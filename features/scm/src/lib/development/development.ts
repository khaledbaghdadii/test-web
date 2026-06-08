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

interface Repository {
  id: string;
  url: string;
}
