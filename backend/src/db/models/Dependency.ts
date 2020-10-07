import {
  BaseEntity,
  Entity,
  PrimaryColumn
} from "typeorm";
import { DEP_TABLE } from "../queries";

/**
 * A table of edges between dependent Tasks
 */
@Entity(DEP_TABLE)
export default class Dependency extends BaseEntity {
  @PrimaryColumn()
  taskFrom: number;
  @PrimaryColumn()
  taskTo: number;
}
