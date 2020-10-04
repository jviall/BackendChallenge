import {MigrationInterface, QueryRunner} from "typeorm";

export class MakeSchema implements MigrationInterface {
  name = "MakeSchema1601524520328";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "TaskGroup" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL)'
    );
    await queryRunner.query(
      'CREATE TABLE "Task" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "completed" boolean NOT NULL DEFAULT (0), "groupId" integer NULL, CONSTRAINT "FK_GROUPID" FOREIGN KEY ("groupId") REFERENCES "TaskGroup" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "Task"');
    await queryRunner.query('DROP TABLE "TaskGroup"');
  }
}
