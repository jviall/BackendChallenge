import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
} from "typeorm";
import TaskGroup from "./TaskGroup";

@Entity("Task")
export default class Task extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column("varchar")
  name: string;
  @Column({ type: "boolean", default: false })
  completed: boolean;
  // @OneToMany((type) => Task, (task) => task.dependedOnBy)
  // dependsOn: Task[];
  // @ManyToMany((type) => Task, (task) => task.dependsOn)
  // dependedOnBy: Task[];
  @ManyToOne(() => TaskGroup, (group) => group.tasks)
  group: TaskGroup;
}
