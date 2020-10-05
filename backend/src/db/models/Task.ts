import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
} from "typeorm";
import TaskGroup from "./TaskGroup";

export const STATE:
{ INCOMPLETE: "Incomplete", // state "type" isn't a string *eyeroll*
  LOCKED: "Locked", 
  COMPLETE: "Complete"
} = {
  INCOMPLETE: "Incomplete",
  LOCKED: "Locked",
  COMPLETE: "Complete"
};

@Entity("Task")
export default class Task extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column("varchar")
  name: string;
  @Column({default: STATE.INCOMPLETE})
  state: string;
  @ManyToOne(() => TaskGroup, (group) => group.tasks, { eager: true, nullable: true })
  group: TaskGroup;
}
