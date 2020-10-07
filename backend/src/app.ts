import express, { NextFunction, Request, Response } from "express";
import * as bodyParser from "body-parser";
import helmet from "helmet";

import { connect, DatabaseManager, Task } from "./db";
import { TaskController } from "./controllers/TaskController";
import { GroupController } from "./controllers/GroupController";
import { RequestError } from "./util/RequestError";
import { sanitizeNumber, sanitizeString } from "./util/utils";

// init
const databaseManager = new DatabaseManager();
const taskController = new TaskController(databaseManager);
const groupController = new GroupController(databaseManager);
export const app = express();
(async () => {
  await connect();
})();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(helmet());
// handle async errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(function (error: RequestError, req: Request, res: Response, next: NextFunction) {
  // if there isn't a status set, it's not a RequestError object, and we don't know what happened.
  res.status(error.status ?? 500).send(error.message);
});


// Root -- Get all tasks
app.get("/", async (req, res) => {
  const tasks = await Task.find();
  res.send(tasks);
});

///////////////////
// Task Endpoints
///////////////////

// Get Task
app.get("/task/:taskId", async (req, res, next) => {
  try {
    // sanitize
    const taskId = sanitizeNumber(req.params.taskId);

    // act
    taskController.GetTask(taskId)
      .then((task) => res.send(task))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Create Task
app.post("/task", async (req, res, next) => {
  try {
    // sanitize
    const name = sanitizeString(req.body.name);
    const groupId = req.body.groupId ? sanitizeNumber(req.body.groupId) : undefined;
    
    // act
    taskController.CreateTask(name, groupId)
      .then((newTask) => res.send(newTask))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Rename Task
app.patch("/task/:taskId", async (req, res, next) => {
  try {
    // sanitize
    const taskId = sanitizeNumber(req.params.taskId);
    const name = sanitizeString(req.body.name);
    
    // act
    taskController.RenameTask(taskId, name)
      .then((task) => res.send(task))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Mark Task Complete
app.patch("/task/:taskId/complete", async (req, res, next) => {
  try {
    // sanitize
    const taskId = sanitizeNumber(req.params.taskId);
    
    // act
    taskController.MarkTaskComplete(taskId)
      .then((task) => res.send(task))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Mark Task Incomplete
app.patch("/task/:taskId/incomplete", async (req, res, next) => {
  try {
    // sanitize
    const taskId = sanitizeNumber(req.params.taskId);
    
    // act
    taskController.MarkTaskIncomplete(taskId)
      .then((task) => res.send(task))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Delete Task
app.delete("/task/:taskId", async (req, res, next) => {
  try {
    // sanitize
    const taskId = sanitizeNumber(req.params.taskId);
    
    // act
    taskController.DeleteTask(taskId)
      .then((task) => res.send(task))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Add Task Dependency
app.post("/task/:taskId/dependency/:dependencyId", async (req, res, next) => {
  try {
    // sanitize
    const taskId = sanitizeNumber(req.params.taskId);
    const dependencyId = sanitizeNumber(req.params.dependencyId);
    
    // act
    taskController.AddDependencyToTask(taskId, dependencyId)
      .then((updatedTask) => res.send(updatedTask))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Get Task Dependency List, topologically sorted
app.get("/task/:taskId/dependencies", async (req, res, next) => {
  try {
    // sanitize
    const taskId = sanitizeNumber(req.params.taskId);

    // act
    taskController.GetTopologicalTaskList(taskId)
      .then((topologicalList) => res.send(topologicalList))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

///////////////////
// Group Endpoints
///////////////////

// Get Group
app.get("/group/:groupId", async (req, res, next) => {
  try {
    // sanitize
    const groupId = sanitizeNumber(req.params.groupId);

    // act
    groupController.GetTaskGroup(groupId)
      .then((group) => res.send(group))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Create Group
app.post("/group", async (req, res, next) => {
  try {
    // sanitize
    const name = sanitizeString(req.body.name);

    // act
    groupController.CreateTaskGroup(name)
      .then((newGroup) => res.send(newGroup))
      .catch(next);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Rename Group
app.patch("/group/:groupId", async (req, res, next) => {
  try {
    // sanitize
    const groupId = sanitizeNumber(req.params.groupId);
    const name = sanitizeString(req.body.name);

    // act
    groupController.RenameGroup(groupId, name)
      .then((group) => res.send(group))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Delete Group
app.delete("/group/:groupId", async (req, res, next) => {
  try {
    // sanitize
    const groupId = sanitizeNumber(req.params.groupId);

    // act
    groupController.DeleteGroup(groupId)
      .then((group) => res.send(group))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Add Task to Group
app.put("/group/:groupId/task/:taskId", async (req, res, next) => {
  try {
    // sanitize
    const groupId = sanitizeNumber(req.params.groupId);
    const taskId = sanitizeNumber(req.params.taskId);

    // act
    groupController.AddTaskToGroup(taskId, groupId)
      .then((group) => res.send(group))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error);
  }
});

export default app;
