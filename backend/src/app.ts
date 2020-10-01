import express from "express";
import * as bodyParser from "body-parser";

import { connect, Task, TaskGroup } from "./db";

// init
const app = express();

// Middleware
app.use(bodyParser.json());

// fakie
(async () => {
  await connect();
  const firstTask = new Task();
  firstTask.name = "First Task";
  await firstTask.save();
  const firstGroup = new TaskGroup();
  firstGroup.name = "First Group";
  await firstGroup.save();
  firstTask.group = firstGroup;
  await firstTask.save();
})();

// Root
app.get("/", async (req, res) => {
  const tasks = await Task.find();
  res.send(tasks);
});

export default app;
