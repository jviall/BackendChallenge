# Start Up
* Install dependencies with `yarn` in the `/backend` directory. 
* To start-up the app with a clean database, run `yarn start:clean`.
* Otherwise if you'd like to retain the database from your last run: `yarn start`
* There are a few tests written mostly for example: `yarn test`

The project is setup for a Linux environment, so if you're on Windows, use GitBash or something similar.

There is a Postman collection available to get you testing out the API quickly: 
`/backend/task-manager.postman_collection.json`

# Notes on Implementation
The API uses TypeORM and SQLite to manage the data model, which I chose for a number of reasons:
* I haven't used an ORM prior, and wanted to use this opportunity to explore its advantages.
* TypeORM's flexibiility and SQLite's portability allowed me to use a database without infringing on your ability to easily try the API out.
* Coming from a heavily front-end background, using both of these helped me think through the schema as I implemented features.

While learning through it, I encountered a number of drawbacks to this choice:
* Learning something new obviously slowed me down and reduced quality, but I found it to be a worthwhile experience for myself.
* With only a surface-level knowledge of TypeORM, I initally benefitted from the simplicity of defining the models and making simple interactions with Entities. However, when I wanted to implement more complex features like dependency management or graph traversal, it was a lot harder to write clean or consistent code while sticking to the simpler constructs.
* Given more time, I would have liked to explore using the Repository constructs TypeORM offers to make a more organized data access layer, as well as group database interactions by transaction and commit them en-masse for easier roll-back.

Though I was eager to, I didn't end up having time to show off my front-end skills with a UI (hence the redundent `/backend` folder), but I did try my best to implement features with a UI in mind. As an example, that's why I ended up with the `TaskDTO` Model, so that when doing things like Completing a Task the UI can easily show the user sub-tasks which depended on the Task they just completed without making an additional request.

## Assumptions
* A task with a state of `Completed` cannot add a new dependency.
* The app isn't being used at scale, and so some important considerations are being ignored like Database locking, and I don't handle failed database interactions in requests that do multiple commits to the DB, and that risks data inconsistency and corruption if many different requests are coming in at once without the chance to rollback.
* The number of tasks will be reasonably small (< 100), so there isn't any paging/sorting of Tasks for requests, which are pretty crucial features of any real-world API returning lists of entities.

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



