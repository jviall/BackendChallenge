import express, { NextFunction, Request, Response } from "express";
import * as bodyParser from "body-parser";
import helmet from "helmet";

import { connect, Task } from "./db";
import * as TaskController from "./controllers/TaskController";
import * as GroupController from "./controllers/TaskGroupController";
import { RequestError } from "./RequestError";

// init
const app = express();
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
    // validate
    const taskId = parseInt(req.params.taskId);
    if (isNaN(taskId)) {
      res.status(400).send("Missing task ID.");
      return;
    }
    // act
    TaskController.GetTask(taskId)
      .then((task) => res.send(task))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Create Task
app.post("/task", async (req, res, next) => {
  try {
    // validate
    const taskName = req.body.name;
    const groupId = req.body?.groupId || undefined;
    if (!taskName || !taskName.length) {
      res.status(400).send("Missing task name.");
      return;
    }
    // act
    TaskController.CreateTask(taskName, groupId)
      .then((newTask) => res.send(newTask))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Rename Task
app.patch("/task/:taskId", async (req, res, next) => {
  try {
    // validate
    const taskId = parseInt(req.params.taskId);
    const name = req.body.name;
    if (isNaN(taskId) || !(name && name.length)) {
      res.status(400).send("Missing parameters.");
      return;
    }
    // act
    TaskController.RenameTask(taskId, name)
      .then((task) => res.send(task))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Mark Task Complete
app.patch("/task/:taskId/complete", async (req, res, next) => {
  try {
    // validate
    const taskId = parseInt(req.params.taskId);
    if (isNaN(taskId)) {
      res.status(400).send("Missing parameters.");
      return;
    }
    // act
    TaskController.MarkTaskComplete(taskId)
      .then((task) => res.send(task))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Mark Task Incomplete
app.patch("/task/:taskId/incomplete", async (req, res, next) => {
  try {
    // validate
    const taskId = parseInt(req.params.taskId);
    if (isNaN(taskId)) {
      res.status(400).send("Missing parameters.");
      return;
    }
    // act
    TaskController.MarkTaskIncomplete(taskId)
      .then((task) => res.send(task))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Delete Task
app.delete("/task/:taskId", async (req, res, next) => {
  try {
    // validate
    const taskId = parseInt(req.params.taskId);
    if (isNaN(taskId)) {
      res.status(400).send("Missing task ID.");
      return;
    }
    // act
    TaskController.DeleteTask(taskId)
      .then((task) => res.send(task))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Add Task Dependency
app.post("/task/:taskId/dependency/:dependencyId", async (req, res, next) => {
  try {
    // validate
    const taskId = parseInt(req.params.taskId);
    const dependencyId = parseInt(req.params.dependencyId);
    if (isNaN(taskId) || isNaN(dependencyId)) {
      res.status(400).send("Invalid task ID.");
      return;
    }
    // act
    TaskController.AddDependencyToTask(taskId, dependencyId)
      .then((updatedTask) => res.send(updatedTask))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Get Task Dependency List, topologically sorted
app.get("/task/:taskId/dependencies", async (req, res, next) => {
  try {
    // validate
    const taskId = parseInt(req.params.taskId);
    if (isNaN(taskId)) {
      res.status(400).send("Invalid task ID.");
      return;
    }
    // act
    TaskController.GetTopologicalTaskList(taskId)
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
    // validate
    const groupId = parseInt(req.params.groupId);
    if (isNaN(groupId)) {
      res.status(400).send("Missing group ID.");
      return;
    }
    // act
    GroupController.GetTaskGroup(groupId)
      .then((group) => res.send(group))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Create Group
app.post("/group", async (req, res, next) => {
  try {
    // validate
    const groupName = req.body.name;
    if (!groupName || !groupName.length) {
      res.status(400).send("Missing group name.");
      return;
    }

    // act
    GroupController.CreateTaskGroup(groupName)
      .then((newGroup) => res.send(newGroup))
      .catch(next);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Rename Group
app.patch("/group/:groupId", async (req, res, next) => {
  try {
    // validate
    const groupId = parseInt(req.params.groupId);
    const name = req.body.name;
    if (isNaN(groupId) || !(name && name.length)) {
      res.status(400).send("Missing parameters.");
      return;
    }
    // act
    GroupController.RenameGroup(groupId, name)
      .then((group) => res.send(group))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Delete Group
app.delete("/group/:groupId", async (req, res, next) => {
  try {
    // validate
    const groupId = parseInt(req.params.groupId);
    if (isNaN(groupId)) {
      res.status(400).send("Missing group ID.");
      return;
    }
    // act
    GroupController.DeleteGroup(groupId)
      .then((group) => res.send(group))
      .catch(next);
  } catch (error) {
    res.status(error.status ?? 500).send(error?.message);
  }
});

// Add Task to Group
app.put("/group/:groupId/task/:taskId", async (req, res, next) => {
  try {
    // validate
    const groupId = parseInt(req.params.groupId);
    const taskId = parseInt(req.params.taskId);
    if (isNaN(groupId) || isNaN(taskId)) {
      res.status(400).send("Missing parameters.");
      return;
    }

    // act
    GroupController.AddTaskToGroup(taskId, groupId)
      .then((group) => res.send(group))
      .catch(next);
  } catch (error) {
    res.status(500).send(error);
  }
});

export default app;
