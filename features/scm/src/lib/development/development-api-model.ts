export interface DevelopmentApiModel {
  id: string;
  projectId: string;
  repository: RepositoryApiModel;
  name: string;
  source: string;
  latestCommitId: string;
  createdOn: string;
  parentCommitId: string;
  deleted: boolean;
}

interface RepositoryApiModel {
  id: string;
  url: string;
}
