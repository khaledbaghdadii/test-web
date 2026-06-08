import { Development } from "./development";

export interface Developments {
  totalPages: number;
  totalElements: number;
  size: number;
  content: Development[];
  empty: boolean;
  last: boolean;
}
