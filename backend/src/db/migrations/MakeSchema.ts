/* eslint-disable quotes */
import {MigrationInterface, QueryRunner} from "typeorm";
import { STATE } from "../models/Task";
import { DEP_FROM, DEP_TABLE, DEP_TO, GROUP_NAME, GROUP_TABLE, TASK_GROUPID, TASK_NAME, TASK_STATE, TASK_TABLE } from "../queries";

export class MakeSchema implements MigrationInterface {
    name = 'MakeSchema1601850688922'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`PRAGMA foreign_keys = ON;`);
        await queryRunner.query(`CREATE TABLE "${GROUP_TABLE}" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "${GROUP_NAME}" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "${TASK_TABLE}" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, 
                                        "${TASK_NAME}" varchar NOT NULL, 
                                        "${TASK_STATE}" varchar CHECK(${TASK_STATE} IN ("${STATE.INCOMPLETE}", "${STATE.LOCKED}", "${STATE.COMPLETE}")) NOT NULL DEFAULT "${STATE.INCOMPLETE}", 
                                        "${TASK_GROUPID}" integer, 
                                        CONSTRAINT "FK_TASK_groupId" FOREIGN KEY ("${TASK_GROUPID}") REFERENCES "${GROUP_TABLE}" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`CREATE TABLE "${DEP_TABLE}" (
                                        "${DEP_FROM}" integer NOT NULL,
                                        "${DEP_TO}" integer NOT NULL,
                                        PRIMARY KEY (${DEP_FROM}, ${DEP_TO}),
                                        CONSTRAINT "FK_from_task_id" FOREIGN KEY ("${DEP_FROM}") REFERENCES "${TASK_TABLE}" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                                        CONSTRAINT "FK_to_task_id" FOREIGN KEY ("${DEP_TO}") REFERENCES "${TASK_TABLE}" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
}

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "${DEP_TABLE}"`);
        await queryRunner.query(`DROP TABLE "${TASK_TABLE}"`);
        await queryRunner.query(`DROP TABLE "${GROUP_TABLE}"`);
    }

}
