import {
  BaseEntity,
  Entity,
  PrimaryColumn
} from "typeorm";

/**
 * A table of edges between dependent Tasks
 */
@Entity("Dependency")
export default class Dependency extends BaseEntity {
  @PrimaryColumn()
  tFrom: number;
  @PrimaryColumn()
  tTo: number;
}
