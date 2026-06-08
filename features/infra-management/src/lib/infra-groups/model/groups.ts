import { Group } from "./group";

export interface Groups {
  content: Group[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}
