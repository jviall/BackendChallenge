import { FindOneOptions, getConnection, getRepository } from "typeorm";
import { Task, STATE } from "../db";
import Dependency from "../db/models/Dependency";
import TaskDTO from "../models/TaskDTO";
import { RequestError } from "../RequestError";
import { getOneGroupById } from "./TaskGroupController";

/****************
 * Notes for the reader:
 * 
 * This controller is messy. In the interest of time I implemented most business logic in the controllers,
 * but a DAL to abstract out the database interactions would clean things up nicely, and move the app
 * closer to a MVC architecture.
 ***************/


/**
 * Gets a Task by ID.
 * @param taskId the ID of the Task to retrieve
 * @returns a Promise resolving to the requested Task
 */
export async function GetTask(taskId: number): Promise<TaskDTO> {
    // I use the DTO here out of thought for a fundamental front-end feature:
    // While viewing a Task, a user should be able to quickly navigate to the dependencies/dependents
    // Ideally would have Paging/Sorting
    return getTaskDTOById(taskId, { relations: ["group"] } , true);
}

/**
 * Creates a new Task and persists it to the database;
 * @param name the name of the new Task
 * @param groupId optional; the ID of the group this task should belong to.
 * @returns a Promise resolving to the new Task's ID
 */
export async function CreateTask(name: string, groupId?: number): Promise<Task> {
    const task = new Task();
    task.name = name;
    if(groupId) {
        return getOneGroupById(groupId)
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
export async function RenameTask(taskId: number, name: string): Promise<Task> {
    return getOneTaskById(taskId).then((task) => {
      task.name = name;
      return task.save();
    });
}

/**
 * Deletes an existing Task
 * @param taskId the ID of the Task to rename
 * @returns a Promise resolving to the removed Task
 */
export async function DeleteTask(taskId: number): Promise<Task> {
    const task = await getOneTaskById(taskId);
    if (task.state !== STATE.COMPLETE) {
        // Incomplete / Locked -- need to unblock for dependents
        await unblockDependency(taskId);
    }
    // Delete dependencies to/from
    await getConnection()
      .createQueryBuilder()
      .delete()
      .from(Dependency)
      .where("tFrom = :taskId", { taskId })
      .where("tTo = :taskId", { taskId })
      .execute();
    return task.remove();
}

/**
 * 
 * @param taskId 
 * @param dependencyId 
 */
export async function MarkTaskComplete(taskId: number): Promise<Task> {
    const task = await getOneTaskById(taskId);
    if (task.state === STATE.LOCKED) {
        throw new RequestError("Task is Locked.", 404);
    } else if (task.state === STATE.COMPLETE) {
        return task;
    } else {
        // Incomplete
        await unblockDependency(taskId);
        task.state = STATE.COMPLETE;
        return task.save();
    }
}

/**
 * Marks a task Incomplete, and Locks all the Tasks in its tree of dependents
 * @param taskId 
 */
export async function MarkTaskIncomplete(taskId: number): Promise<Task> {
// This is potentially very expensive for such a trivial operation if we allow marking a 
// Task Incomplete when dependents of it are already Complete...
// have to recurse through whole (completed) dependent tree.
    const depsToSave: Task[] = [];

    async function walk(id: number) {
        const dependents = await getTaskDependents(id);
        // mark all dependents locked
        for (let i = 0; i < dependents.length; i++) {
            if(dependents[i].state === STATE.COMPLETE) {
                // if dependent was Complete, recurse
                await walk(dependents[i].id);
            }
            dependents[i].state = STATE.LOCKED;
            depsToSave.push(dependents[i]);
        }
    }
    await walk(taskId);
    await Task.save(depsToSave);
    return getOneTaskById(taskId);
}

/**
 * Adds one Task (dependencyId) as a dependency of another Task (taskId)
 * @param taskId 
 * @param dependencyId 
 */
export async function AddDependencyToTask(taskId: number, dependencyId: number): Promise<Dependency> {
    const cycleError = "Dependency Error: Dependency assignment would create cycle.";

    if(taskId === dependencyId) {
        throw new RequestError(cycleError, 400);
    }
    // check tasks exist before recursing 
    const task = await getOneTaskById(taskId);
    if(task.state == STATE.COMPLETE) {
        throw new RequestError("Dependency Error: Task is already completed.", 409);
    }
    const depTask = await getOneTaskById(dependencyId);

    // return dep if it already exists
    const existingDependency = await Dependency.findOne({ where: { tFrom: taskId, tTo: dependencyId }});
    if(existingDependency !== undefined) return existingDependency; 

    // query list of deps for would-be dependency Task, and see if current task is in the list--indicating a cycle
    return getConnection().query(`
        WITH RECURSIVE traverse AS (
            SELECT Dependency.tFrom, Dependency.tTo FROM Dependency
            WHERE Dependency.tFrom = ${dependencyId}
        UNION ALL
            SELECT DISTINCT Dependency.tFrom, Dependency.tTo FROM Dependency
            INNER JOIN traverse
            ON Dependency.tFrom = traverse.tTo
        )
        SELECT tFrom, tTo FROM traverse
        GROUP BY tTo;
    `).then(async (res) => { 
        const deps = res as Dependency[];
        if (deps.filter((dep) => dep.tTo === taskId).length !== 0) {
            throw new RequestError(cycleError, 400);
        }
        const newDep = new Dependency();
        newDep.tFrom = taskId;
        newDep.tTo = dependencyId;
        if(depTask.state !== STATE.COMPLETE) {
            task.state = STATE.LOCKED;
            await Task.save(task);
        }
        return await newDep.save();
    });
}

/**
 * Gets a topological list of Tasks needed to be completed in order to complete the given Task
 * @param taskId 
 */
export async function GetTopologicalTaskList(taskId: number): Promise<Task[]> {
    return getConnection().query( `
        WITH RECURSIVE traverse(tFrom, tTo, depth) AS (
            SELECT Dependency.tFrom, Dependency.tTo, 0 FROM Dependency
            WHERE Dependency.tFrom = ${taskId}
        UNION ALL
            SELECT DISTINCT Dependency.tFrom, Dependency.tTo, traverse.depth + 1 FROM traverse
            INNER JOIN Dependency
            ON Dependency.tFrom = traverse.tTo
        )
        SELECT Task.* FROM Task
        INNER JOIN traverse ON Task.id = traverse.tTo
        GROUP BY Task.id
        ORDER BY MAX(depth) DESC;
    `).then((res) => res as Task[]);
}


/**
 * Queries the DB for a Task and validates if it exists, throwing an exception otherwise.
 * @param taskId the ID of the Task to query for
 * @returns a Promise resolving to the queried Task
 */
export async function getOneTaskById(taskId: number): Promise<Task> {
    return Task.findOneOrFail(taskId).catch((err) => { 
        console.error(err);
        throw new RequestError("Invalid Task ID", 404); 
    });
}

// HELPERS

/**
 * Queries the DB for a Task and validates if it exists, throwing an exception otherwise.
 * @param taskId the ID of the Task to query for
 * @param options TypeORM options to apply to the query
 * @returns a Promise resolving to the queried Task
 */
export async function getTaskDTOById(taskId: number, options: FindOneOptions = { relations: ["group"]}, joinDependencies?: boolean): Promise<TaskDTO> {
    let dependentOn: Task[];
    let dependencyOf: Task[];
    if(joinDependencies) {
        dependentOn = await getTaskDependencies(taskId);
        dependencyOf = await getTaskDependents(taskId);
    }
    return Task.findOneOrFail(taskId, options).then(task => {            
        const t = task as TaskDTO;
        t.dependentOn = dependentOn ?? [];
        t.dependencyOf = dependencyOf ?? [];
        return t;
    })
    .catch((err) => { 
        console.error(err);
        throw new RequestError("Invalid Task ID", 404); 
    });
}

/**
 * Returns a list of all Tasks that the given Task directly depends on.
 * @param taskId 
 */
export async function getTaskDependencies(taskId: number): Promise<Task[]> {
    const dependentOn: Task[] = await getRepository(Dependency)
        .createQueryBuilder("dependencies")
        .select("Task.*")
        .leftJoin(Task, "Task", "dependencies.tTo = Task.id")
        .where(`dependencies.tFrom = ${taskId}`)
        .execute();
    return dependentOn ?? [];
}

/**
 * Returns a list of all Tasks that directly depend on the given Task.
 * @param taskId 
 */
export async function getTaskDependents(taskId: number): Promise<Task[]> {
    const dependencyOf: Task[] = await getRepository(Dependency)
        .createQueryBuilder("dependencies")
        .select("Task.*")
        .leftJoin(Task, "Task", "dependencies.tFrom = Task.id")
        .where(`dependencies.tTo = ${taskId}`)
        .execute();
    return dependencyOf ?? [];
}

/**
 * Re-evalautes dependents of a Task, and sets their respective states to reflect the given Task no longer blocking completion.
 * @param taskId 
 * @returns list of the updated dependent Tasks
 */
export async function unblockDependency(taskId: number): Promise<void> {
    const dependents = await getTaskDependents(taskId);
    // insert/delete bottle neck if lots of tasks have lots of dependencies - WC O(n^2)
    for (let i = 0; i < dependents.length; i++) {
        dependents[i].state = STATE.INCOMPLETE;
        const siblingDeps = await getTaskDependencies(dependents[i].id);
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