export interface FetchProjectUsersRequest {
  projectId: string;
  pageSize: number;
  pageIndex: number;
  searchKey: string;
}
