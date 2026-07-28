export interface Development {
  id: string;
  name: string;
  source?: string;
  projectId: string;
  repository: Repository;
  latestCommitId: string;
  createdOn: string;
  parentCommitId: string;
  deleted: boolean;
}

export interface DevelopmentSummary {
  id: string;
  name: string;
  source?: string;
  projectId: string;
  repositoryId: string;
  parentCommitId: string;
  deleted: boolean;
}

export interface Repository {
  id: string;
  url: string;
}

export interface Developments {
  totalPages: number;
  totalElements: number;
  size: number;
  content: DevelopmentSummary[];
  empty: boolean;
  last: boolean;
}

export interface DevelopmentFilters {
  repositoryId?: string;
  name?: string;
}
