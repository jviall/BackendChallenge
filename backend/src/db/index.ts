import { createConnection } from "typeorm";

export const connect = async () => {
  await createConnection("default");
};

export { default as Task, STATE } from "./models/Task";
export { default as TaskGroup } from "./models/Group";
export { DatabaseManager } from "./DatabaseManager";
export { SELECT_TASK_DEPENDENCY_LIST, SELECT_TASK_TOPOLOGICAL_LIST } from "./queries"; 
