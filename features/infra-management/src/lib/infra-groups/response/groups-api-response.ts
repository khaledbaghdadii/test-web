import { Group } from "../model/group";

export interface GroupsAPIResponse {
  content: Group[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}
