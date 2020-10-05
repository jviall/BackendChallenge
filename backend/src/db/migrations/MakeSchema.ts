/* eslint-disable quotes */
import {MigrationInterface, QueryRunner} from "typeorm";

export class MakeSchema implements MigrationInterface {
    name = 'MakeSchema1601850688922'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`PRAGMA foreign_keys = ON;`);
        await queryRunner.query(`CREATE TABLE "TaskGroup" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "Task" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, 
                                        "name" varchar NOT NULL, 
                                        "state" varchar CHECK(state IN ("Incomplete", "Locked", "Complete")) NOT NULL DEFAULT "Incomplete", 
                                        "groupId" integer, 
                                        CONSTRAINT "FK_TASK_groupId" FOREIGN KEY ("groupId") REFERENCES "TaskGroup" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`CREATE TABLE "Dependency" (
                                        "tFrom" integer NOT NULL,
                                        "tTo" integer NOT NULL ,
                                        PRIMARY KEY (tFrom, tTo),
                                        CONSTRAINT "FK_from_task_id" FOREIGN KEY ("tFrom") REFERENCES "Task" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                                        CONSTRAINT "FK_to_task_id" FOREIGN KEY ("tTo") REFERENCES "Task" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
}

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "Dependency"`);
        await queryRunner.query(`DROP TABLE "Task"`);
        await queryRunner.query(`DROP TABLE "TaskGroup"`);
    }

}
