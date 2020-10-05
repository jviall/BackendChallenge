import { createConnection } from "typeorm";

export const connect = async () => {
  await createConnection("default");
};

export { default as Task, STATE } from "./models/Task";
export { default as TaskGroup } from "./models/TaskGroup";
