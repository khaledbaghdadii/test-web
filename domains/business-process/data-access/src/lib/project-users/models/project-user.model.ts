/**
 * Project-user models migrated (copied) from the legacy user-management feature
 * (`project-users-multiselect/model` + `project-users-fetcher-service`). The
 * `User` shape mirrors `@mxflow/features/user`'s `User`; it is re-declared here
 * so the new-architecture business-process data-access library does not depend
 * on the legacy feature library.
 */
export interface User {
  id: string;
  displayName: string;
  mail: string;
}

export interface UsersPageResponse {
  content: User[];
  last: boolean;
}

export interface FetchProjectUsersRequest {
  projectId: string;
  pageSize: number;
  pageIndex: number;
  searchKey: string;
}
