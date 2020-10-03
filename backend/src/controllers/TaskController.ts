import { Task } from "../db";
import { RequestError } from "../RequestError";
import { getOneGroupById } from "./TaskGroupController";


/**
 * Gets a Task by ID.
 * @param taskId the ID of the Task to retrieve
 * @returns a Promise resolving to the requested Task
 */
export async function GetTask(taskId: number): Promise<Task> {
    return getOneTaskById(taskId);
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
    return getOneTaskById(taskId).then((task) => task.remove());
}

/**
 * Queries the DB for a Task and validates if it exists, throwing an exception otherwise.
 * @param taskId the ID of the Task to query for
 * @returns a Promise resolving to the queried Task
 */
export async function getOneTaskById(taskId: number): Promise<Task> {
    return Task.findOneOrFail(taskId, { relations: ["group"]}).catch((err) => { 
        console.error(err);
        throw new RequestError("Invalid Task ID", 400); 
    });
}