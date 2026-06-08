export interface WorkItemAssignableUser {
  id: string;
  displayName: string;
  mail: string;
}

export interface WorkItemAssignableUsersApiResponse {
  content: WorkItemAssignableUser[];
  last: boolean;
}
