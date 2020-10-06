import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
} from "typeorm";
import { GROUP_TABLE } from "../queries";
import Task from "./Task";

@Entity(GROUP_TABLE)
export default class Group extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column("varchar")
  name: string;
  @OneToMany(() => Task, (task) => task.group)
  tasks: Task[];
}
