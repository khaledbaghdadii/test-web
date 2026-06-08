import { User } from "@mxflow/features/user";

export interface UsersPageResponse {
  content: User[];
  last: boolean;
}
