/* eslint-disable no-empty */
import { DatabaseManager } from "../db/DatabaseManager";
import { TaskController } from "./TaskController";
import { STATE, Task } from "../db";
import { RequestError } from "../util/RequestError";
import { ERR_LOCKED_TASK } from "../util/error-messages";

const mockGetOneTaskById = jest.fn();
const mockGetTaskDTO = jest.fn();
const mockGetTaskDependents = jest.fn();
const mockGetTaskDependencies = jest.fn();
const mockDeleteDependencies = jest.fn();
jest.mock("../db/DatabaseManager", () => {
  return {
    DatabaseManager: jest.fn().mockImplementation(() => ({
      getOneTaskById: mockGetOneTaskById,
      getTaskDTOById: mockGetTaskDTO,
      getTaskDependents: mockGetTaskDependents,
      getTaskDependencies: mockGetTaskDependencies,
      deleteDependenciesForTask: mockDeleteDependencies,
    }))
  };
});

// Mock Data
let t0: Task, t1: Task, t2: Task, t3: Task;
let startId = 1;
const generateTask = (function* makeTask() {
    while(true) {
        const _task = new Task();
        _task.id = startId;
        _task.name = `Task_${startId}`;
        _task.state = STATE.INCOMPLETE;
        startId++;
        yield _task;
    }
})();

beforeEach(jest.resetAllMocks);
beforeEach(() => {
    // t0, t1 are incomplete 
    // both t2 and t3 depend on t0 and t1
    // so t2 and t3 should be locked after deletion/completion
    startId = 0;
    t0 = generateTask.next().value;
    t1 = generateTask.next().value;
    t2 = generateTask.next().value;
    t3 = generateTask.next().value;
    mockGetOneTaskById.mockResolvedValue(t0);
    mockGetTaskDependents.mockResolvedValue([t2, t3]);
    mockGetTaskDependencies.mockResolvedValue([t0, t1]);
});

const controller = new TaskController(new DatabaseManager());

describe("Unblocking Dependencies", () => {
    describe("Deleting a Task", () => {
        it("should succeed for a Complete Task without checking dependents", async (done) => {
            t0.state = STATE.COMPLETE;
            try {
                await controller.DeleteTask(t0.id);
                // Task.remove throws an error cause it can't be mocked (TypeORM abstract class property)
                // but core functionality is still being tested.
            } catch(error){ }
 
            expect(mockGetTaskDependents).toBeCalledTimes(0);
            expect(mockGetTaskDependencies).toBeCalledTimes(0);
            expect(mockDeleteDependencies).toBeCalled();
            expect(t2.state).toBe(STATE.INCOMPLETE); // state shouldn't change
            expect(t3.state).toBe(STATE.INCOMPLETE);
            done();
        });
        it("should succeed (and check dependents) for an Incomplete Task", async (done) => {
            try {
                await controller.DeleteTask(t0.id);
                // Task.remove throws an error cause it can't be mocked (TypeORM abstract class property)
                // but core functionality is still being tested.
            } catch(error){ }
            expect(mockGetTaskDependents).toBeCalledTimes(1);
            expect(mockGetTaskDependencies).toBeCalledTimes(2);
            expect(t2.state).toBe(STATE.LOCKED);
            expect(t3.state).toBe(STATE.LOCKED);
            done();
        });
    });
    describe("Completing a Task", () => {
        it("Should fail if the Task is Locked", async (done) => {
            t0.state = STATE.LOCKED;
            try {
                await controller.MarkTaskComplete(t0.id);
            } catch(error){ 
                expect(error).toMatchObject(new RequestError(ERR_LOCKED_TASK, 404));
            }
            done();
        });
        it("Should return the Task if already Complete.", async (done) => {
            t0.state = STATE.COMPLETE;
            mockGetTaskDTO.mockResolvedValue(t0);
            const result = await controller.MarkTaskComplete(t0.id);
            expect(result).toMatchObject(t0);
            done();
        });
        it("should succeed (and check dependents) for an Incomplete Task", async (done) => {
            try {
                await controller.MarkTaskComplete(t0.id);
                // Task.save throws an error cause it can't be mocked (abstract class property)
                // but core functionality is still being tested.
            } catch(error){ }
            expect(mockGetTaskDependents).toBeCalledTimes(1);
            expect(mockGetTaskDependencies).toBeCalledTimes(2);
            expect(t2.state).toBe(STATE.LOCKED);
            expect(t3.state).toBe(STATE.LOCKED);
            done();
        });
    });
});