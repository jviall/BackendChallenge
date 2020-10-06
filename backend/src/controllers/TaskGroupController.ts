import { DatabaseManager, TaskGroup } from "../db";

export class GroupController {
    DB: DatabaseManager;

    constructor(databaseManager: DatabaseManager) {
        this.DB = databaseManager;
    }

    /**
     * Gets a TaskGroup by ID.
     * @param groupId the ID of the TaskGroup to retrieve
     * @returns a Promise resolving to the requested TaskGroup
     */
    async GetTaskGroup(groupId: number): Promise<TaskGroup> {
        return this.DB.getOneGroupById(groupId);
    }

    /**
     * Creates a new Task Group and persists it to the database;
     * @param name the name of the new group
     * @returns a Promise resolving to the new group
     */
    async CreateTaskGroup(name: string): Promise<TaskGroup> {
        const group = new TaskGroup();
        group.name = name;
        return group.save();
    }

    /**
     * Adds an existing Task to an existing TaskGroup
     * @param taskId the ID of the task to add to the group
     * @param groupId the ID of the group this task should belong to.
     * @returns a Promise resolving to the updated group
     */
    async AddTaskToGroup(
    taskId: number,
    groupId: number
    ): Promise<TaskGroup> {
    return this.DB.getOneGroupById(groupId).then((group) =>
        this.DB.getOneTaskById(taskId).then((task) => {
            task.group = group;
            task.save();
            return group;
        })
    );
    }

    /**
     * Adds an existing Task to a new TaskGroup
     * @param taskId the ID of the task to add to the group
     * @param name the name of the new TaskGroup this Task should belong to.
     * @returns a Promise resolving to the new TaskGroup
     */
    async CreateGroupFromTask(
    name: string,
    taskId: number
    ): Promise<TaskGroup> {
        const group = new TaskGroup();
        group.name = name;
        return this.DB.getOneTaskById(taskId).then((task) => {
            task.group = group;
            task.save();
            return group.save();
        });
    }

    /**
     * Renames an existing Group
     * @param groupId the ID of the TaskGroup to rename
     * @param name the new name for your TaskGroup
     * @returns a Promise resolving to the renamed TaskGroup
     */
    async RenameGroup(groupId: number, name: string): Promise<TaskGroup> {
        return this.DB.getOneGroupById(groupId).then((group) => {
          group.name = name;
          return group.save();
        });
    }

    /**
     * Deletes an existing TaskGroup, keeping all of its tasks.
     * @param groupId the ID of the TaskGroup to remove
     * @returns a Promise resolving to the removed TaskGroup
     */
    async DeleteGroup(groupId: number): Promise<TaskGroup> {
        return this.DB.getOneGroupById(groupId)
          .then((group) => {
            group.tasks = [];
            return group.save();
          })
          .then((group) => group.remove());
    }
}