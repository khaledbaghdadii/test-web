import {
  RemoteClonedRepositoryOperationStatus,
  RemoteClonedRepositoryOperationType,
} from "../../remote-cloned-repository/response/remote-cloned-repository-operation-api-response";

export interface RebaseOperation {
  id: string;
  type: RemoteClonedRepositoryOperationType;
  status: RemoteClonedRepositoryOperationStatus;
  endedOn?: string;
  failureReason?: string;
}
