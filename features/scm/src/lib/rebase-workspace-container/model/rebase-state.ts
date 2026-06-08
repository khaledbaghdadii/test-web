import { RebaseState } from "../../remote-cloned-repository/response/get-rebase-operation-info-api-response";
import { RebaseOperation } from "./rebase-operation";

export interface RebaseWorkspaceState {
  rebaseInProgress: boolean;
  sourceBranchName: string;
  targetBranchName: string;
  rebaseState?: RebaseState;
  rebaseOperations: RebaseOperation[];
  bundleContent?: string;
}
