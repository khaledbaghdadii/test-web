import { CommitDetails } from "./commit-details.model";

export interface PaginatedCommitsPage {
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly last: boolean;
  readonly content: CommitDetails[];
}
