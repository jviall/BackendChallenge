# BackendChallenge

Thank you for your interest in joining the UnDigital engineering team!  The coding challenge is a way for us to get to see how you write code and evaluate the decisions you make in your design.  Projects can be written in Elixir, C#, Java, or Node.

## Requirements
* Build a REST api service that provides task mangement functionality.
* Tasks should be able to be grouped and retrieved by group.
* Tasks should have 3 states
  * Locked
  * Incomplete
  * Complete
* Tasks can be dependent upon other tasks having to be completed first.
  * If a task is dependent upon another task that is not yet complete, the task should be Locked.
  * When a task is locked, it can not be completed.
* API should support
  * Managing all aspects of the tasks and task groups.


## Data Persistence
* You need to persist the data in some way during the app runtime.
* You don't need to use any external persistence for this exercise as it makes it easier for us to run!
* We do care about SQL and schema design so please include the SQL statements you would run to generate your schema.


## Considerations
* Imagine a frontend UI will be consuming the API to provide the UX so you should determine where what business logic lies to perform the requirements.
  * Provide explanation as to why you made certain decisions in your service.
* Keep in mind scale, even if not implemented, we appreciate comments and thoughts on how the service could be optimized for increased scale.


## We value
* Good structured code following best practices
* We're not looking for a hack to get it done.

## Bonus
* Create a react app that consumes your api and provides a UI.

Once complete, submit a zipped project folder that includes a readme file with any specific instructions on running your solution in addition to any explanation, thoughts, comments etc that you are including with your submission.



