/* eslint-disable semi */
import { Task } from "../db";

/**
 * Useful for representing a Task along with the Tasks it directly depends on, or directly depend on it.
 */
export default interface TaskDTO {
    id: number;
    name: string;
    state: 0 | 1 | 2; // Incomplete, Locked, Complete
    groupId: number | undefined;
    dependentOn: Task[];
    dependencyOf: Task[];
}