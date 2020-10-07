import { Task, STATE, DatabaseManager, SELECT_TASK_DEPENDENCY_LIST, SELECT_TASK_TOPOLOGICAL_LIST } from "../db";
import Dependency from "../db/models/Dependency";
import ITaskDTO from "../models/ITaskDTO";
import { RequestError } from "../util/RequestError";
import { ERR_DEPENDENCY_COMPLETED_TASK, ERR_DEPENDENCY_CYCLE, ERR_LOCKED_TASK } from "../util/error-messages";

export class TaskController {
    readonly DB: DatabaseManager;

    constructor(databaseManager: DatabaseManager) {
        this.DB = databaseManager;
    }

    /**
     * Gets a Task by ID.
     * @param taskId the ID of the Task to retrieve
     * @returns a Promise resolving to the requested Task
     */
    public async GetTask(taskId: number): Promise<ITaskDTO> {
        // I use the DTO here out of thought for a fundamental front-end feature:
        // While viewing a Task, a user should be able to quickly navigate to the dependencies/dependents
        // I don't use this model everywhere because of the extra queries it takes to build,
        // but I think it and other potential "DTO's" that extended the DB's model would
        // prove useful depending on UX use-cases.
        return this.DB.getTaskDTOById(taskId, { relations: ["group"] } , true);
    }

    /**
     * Creates a new Task and persists it to the database;
     * @param name the name of the new Task
     * @param groupId optional; the ID of the group this task should belong to.
     * @returns a Promise resolving to the new Task's ID
     */
    public async CreateTask(name: string, groupId?: number): Promise<Task> {
        const task = new Task();
        task.name = name;
        if(groupId) {
            return this.DB.getOneGroupById(groupId)
            .then((group) => {
                task.group = group;
                return task;
            })
            .then((task) => task.save());
        }
        return task.save();
    }

    /**
     * Renames an existing Task
     * @param taskId the ID of the Task to rename
     * @param name the new name for your Task
     * @returns a Promise resolving to the renamed Task
     */
    public async RenameTask(taskId: number, name: string): Promise<Task> {
        return this.DB.getOneTaskById(taskId).then((task) => {
            task.name = name;
            return task.save();
        });
    }

    /**
     * Deletes an existing Task
     * @param taskId the ID of the Task to rename
     * @returns a Promise resolving to the removed Task
     */
    public async DeleteTask(taskId: number): Promise<Task> {
        const task = await this.DB.getOneTaskById(taskId);
        if (task.state !== STATE.COMPLETE) {
            // Incomplete / Locked -- need to unblock for dependents
            await this.unblockDependency(taskId);
        }
        // Delete dependencies to/from
        await this.DB.deleteDependenciesForTask(taskId);
        return task.remove();
    }

    /**
     * 
     * @param taskId 
     * @param dependencyId 
     */
    public async MarkTaskComplete(taskId: number): Promise<ITaskDTO> {
        const task = await this.DB.getOneTaskById(taskId);
        if (task.state === STATE.LOCKED) {
            throw new RequestError(ERR_LOCKED_TASK, 404); 
        } else if (task.state === STATE.COMPLETE) {
            return this.DB.getTaskDTOById(task.id);
        } else {
            // Incomplete
            await this.unblockDependency(taskId);
            task.state = STATE.COMPLETE;
            return task.save().then(task => this.DB.getTaskDTOById(task.id));
        }
    }

    /**
     * Marks a task Incomplete, and Locks all the Tasks in its tree of dependents
     * @param taskId 
     */
    public async MarkTaskIncomplete(taskId: number): Promise<Task> {
    // have to recurse through every Completed dependent tree and lock.
        const depsToSave: Task[] = [];
        const task = await this.DB.getOneTaskById(taskId);
        const getDependents = this.DB.getTaskDependents; // avoid shadowed 'this'

        async function walkDependentTree(id: number) {
            const dependents = await getDependents(id);
            // mark all dependents locked
            for (let i = 0; i < dependents.length; i++) {
                if(dependents[i].state === STATE.COMPLETE) {
                    // if dependent was Complete, recurse
                    await walkDependentTree(dependents[i].id);
                }
                dependents[i].state = STATE.LOCKED;
                depsToSave.push(dependents[i]);
            }
        }
        await walkDependentTree(taskId);
        await Task.save(depsToSave).then(() => task.state = STATE.INCOMPLETE);
        return task.save();
    }

    /**
     * Adds one Task (dependencyId) as a dependency of another Task (taskId)
     * @param taskId 
     * @param dependencyId 
     */
    public async AddDependencyToTask(taskId: number, dependencyId: number): Promise<Dependency> {
        if(taskId === dependencyId) {
            throw new RequestError(ERR_DEPENDENCY_CYCLE, 400);
        }
        // check tasks exist before recursing 
        const task = await this.DB.getOneTaskById(taskId);

        if(task.state == STATE.COMPLETE) {
            throw new RequestError(ERR_DEPENDENCY_COMPLETED_TASK, 409);
        }
        const depTask = await this.DB.getOneTaskById(dependencyId);

        // return dep if it already exists
        const existingDependency = await this.DB.findOneDependency({ where: { taskFrom: taskId, taskTo: dependencyId }});
        if(existingDependency !== undefined) return existingDependency; 

        // query list of deps for would-be dependency Task, 
        // and see if current task is in the list--indicating a cycle
        return this.DB.executeQuery(
          SELECT_TASK_DEPENDENCY_LIST(dependencyId)
        ).then(async (res) => {
          const deps = res as Dependency[];
          // check for cycle
          if (deps.filter((dep) => dep.taskTo === taskId).length !== 0) {
            throw new RequestError(ERR_DEPENDENCY_CYCLE, 400);
          }

          const newDep = new Dependency();
          newDep.taskFrom = taskId;
          newDep.taskTo = dependencyId;

          if (depTask.state !== STATE.COMPLETE) {
            task.state = STATE.LOCKED;
            await Task.save(task);
          }
          return newDep.save();
        });
    }

    /**
     * Gets a topological list of Tasks needed to be completed in order to complete the given Task
     * @param taskId 
     */
    public async GetTopologicalTaskList(taskId: number): Promise<Task[]> {
        return this.DB.executeQuery(SELECT_TASK_TOPOLOGICAL_LIST(taskId)).then((res) => res as Task[]);
    }


    /**
     * Re-evalautes dependents of a Task, and sets their respective states to reflect the given Task no longer blocking completion.
     * @param taskId 
     * @returns list of the updated dependent Tasks
     */
    private async unblockDependency(taskId: number): Promise<void> {
        const dependents = await this.DB.getTaskDependents(taskId);
        // insert/delete bottleneck if dependents have lots of dependencies - but WC is something less than O(n^2)
        for (let i = 0; i < dependents.length; i++) {
            dependents[i].state = STATE.INCOMPLETE;
            const siblingDeps = await this.DB.getTaskDependencies(dependents[i].id);
            for (let j = 0; j < siblingDeps.length; j++) {
                if (siblingDeps[j].id === taskId) continue;
                if (siblingDeps[j].state !== STATE.COMPLETE) {
                    dependents[i].state = STATE.LOCKED;
                    break;
                }
            }
        }
        Task.save(dependents);
    }

}
