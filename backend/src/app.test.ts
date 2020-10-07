/* eslint-disable @typescript-eslint/no-unused-vars */
import request from "supertest";
import app from "./app";
 import { TaskController } from "./controllers/TaskController";
import { STATE, Task } from "./db";

const createTaskMock = jest.fn();
jest.mock("./controllers/TaskController", () => {
    return {
        TaskController: jest.fn().mockImplementation(() => {
            return {
              CreateTask: () =>
                new Promise((resolve) => {
                    createTaskMock();
                    resolve(task);
                }),
            };
        })
    };
});

const task = new Task();
beforeEach(jest.resetAllMocks);
beforeEach(() => {
    task.id = 1;
    task.name = "Test Task";
    task.state = STATE.INCOMPLETE;
});

describe("Create A Task", () => {
    it("responds correctly with good input", (done) => {
        request(app)
          .post("/task")
          .send({name: "A task", groupId: 1})
          .expect(200)
          .then((resp) => {
              expect(resp.body).toMatchObject(task);
              expect(createTaskMock).toBeCalled();
              done();
          });
        
    });
    it("sanitizes bad input", (done) => {
        request(app)
          .post("/task")
          .send({name: "A task", groupId: "not a number"})
          .expect(400, done);
    });
});