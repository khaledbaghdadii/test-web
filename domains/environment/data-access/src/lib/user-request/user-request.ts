export interface UserRequest {
  id: string;
  environmentId?: string;
  completedAt?: string;
}

export interface UserRequestStatus {
  environmentIds: string[];
  latestRequestInProgress: boolean;
  latestRequestFailed: boolean;
}
