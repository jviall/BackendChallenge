import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
} from "typeorm";
import { TASK_TABLE } from "../queries";
import Group from "./Group";

export const STATE:
{ INCOMPLETE: "Incomplete", // state "type" isn't a string *eyeroll*
  LOCKED: "Locked", 
  COMPLETE: "Complete"
} = {
  INCOMPLETE: "Incomplete",
  LOCKED: "Locked",
  COMPLETE: "Complete"
};

@Entity(TASK_TABLE)
export default class Task extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column("varchar")
  name: string;
  @Column({default: STATE.INCOMPLETE})
  state: string;
  @ManyToOne(() => Group, (group) => group.tasks, { eager: true, nullable: true })
  group: Group;
}
