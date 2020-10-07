import { FindOneOptions, getConnection, getRepository } from "typeorm";
import { Task, TaskGroup } from ".";
import ITaskDTO from "../models/ITaskDTO";
import { ERR_INVALID_PARAM } from "../util/error-messages";
import { RequestError } from "../util/RequestError";
import Dependency from "./models/Dependency";
import { DEP_FROM, DEP_TABLE, DEP_TO, TASK_TABLE } from "./queries";

export class DatabaseManager {
  readonly name: string;

  constructor() {
    this.name = "db"; // can't have empty constructor
  }

  async executeQuery(query: string) {
    return getConnection().query(query);
  }

  /**
   * Queries the DB for a Task and validates if it exists, throwing an exception otherwise.
   * @param taskId the ID of the Task to query for
   * @returns a Promise resolving to the queried Task
   */
  async getOneTaskById(taskId: number): Promise<Task> {
    return Task.findOneOrFail(taskId).catch((err) => {
      console.error(err);
      throw new RequestError(ERR_INVALID_PARAM, 404);
    });
  }

  /**
   * Queries the DB for a Task and validates if it exists, throwing an exception otherwise.
   * @param taskId the ID of the Task to query for
   * @param options TypeORM options to apply to the query
   * @param joinDependencies Defaults to 'true', querying the DB for the dependents and dependencies of the given Task
   * @returns a Promise resolving to a TaskDTO containing the Task's dependents and dependencies
   */
  async getTaskDTOById(
    taskId: number,
    options: FindOneOptions = { relations: ["group"] },
    joinDependencies = true
  ): Promise<ITaskDTO> {
    let dependentOn: Task[];
    let dependencyOf: Task[];
    if (joinDependencies) {
      dependentOn = await this.getTaskDependencies(taskId);
      dependencyOf = await this.getTaskDependents(taskId);
    }
    return Task.findOneOrFail(taskId, options)
      .then((task) => {
        const t = task as ITaskDTO;
        t.dependentOn = dependentOn ?? [];
        t.dependencyOf = dependencyOf ?? [];
        return t;
      })
      .catch((err) => {
        console.error(err);
        throw new RequestError(ERR_INVALID_PARAM, 404);
      });
  }

  /**
   * Returns a list of all Tasks that directly depend on the given Task.
   * @param taskId
   */
  async getTaskDependents(taskId: number): Promise<Task[]> {
    const dependencyOf: Task[] = await getRepository(Dependency)
      .createQueryBuilder(DEP_TABLE)
      .select(`${TASK_TABLE}.*`)
      .leftJoin(Task, TASK_TABLE, `${DEP_TABLE}.${DEP_FROM} = ${TASK_TABLE}.id`)
      .where(`${DEP_TABLE}.${DEP_TO} = ${taskId}`)
      .execute();
    return dependencyOf ?? [];
  }

  /**
   * Returns a list of all Tasks that the given Task directly depends on.
   * @param taskId
   */
  async getTaskDependencies(taskId: number): Promise<Task[]> {
    const dependentOn: Task[] = await getRepository(Dependency)
      .createQueryBuilder(DEP_TABLE)
      .select(`${TASK_TABLE}.*`)
      .leftJoin(Task, TASK_TABLE, `${DEP_TABLE}.${DEP_TO} = ${TASK_TABLE}.id`)
      .where(`${DEP_TABLE}.${DEP_FROM} = ${taskId}`)
      .execute();
    return dependentOn ?? [];
  }

  // TaskGroup Table

  /**
   * Queries the DB for a TaskGroup and validates if it exists, throwing an exception otherwise.
   * @param groupId the ID of the TaskGroup to query for
   * @returns a Promise resolving to the queried TaskGroup
   */
  async getOneGroupById(groupId: number): Promise<TaskGroup> {
    return TaskGroup.findOneOrFail(groupId).catch(() => {
      throw new RequestError(ERR_INVALID_PARAM, 400);
    });
  }

  // Dependency Table

  async findOneDependency(options: FindOneOptions<Dependency>): Promise<Dependency | undefined> {
    return Dependency.findOne(options);
  }

  /**
   * Deletes all dependencies to / from a given Task
   * @param taskId 
   */
  async deleteDependenciesForTask(taskId: number): Promise<void> {
    await getConnection()
      .createQueryBuilder()
      .delete()
      .from(Dependency)
      .where(`${DEP_FROM} = :taskId`, { taskId })
      .where(`${DEP_TO} = :taskId`, { taskId })
      .execute();
  }
}