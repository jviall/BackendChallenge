import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
} from "typeorm";
import Task from "./Task";

@Entity("TaskGroup")
export default class TaskGroup extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column("varchar")
  name: string;
  @OneToMany(() => Task, (task) => task.group)
  tasks: Task[];
}
