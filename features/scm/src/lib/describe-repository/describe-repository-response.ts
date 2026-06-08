export type RepositoryItem = Directory | File;

export interface DescribeRepositoryResponse {
  repositoryItems: RepositoryItem[];
}

export interface Directory {
  parentPath: string;
  name: string;
  children: RepositoryItem[];
  type: RepoItemType.DIRECTORY;
}

export interface File {
  parentPath: string;
  name: string;
  type: RepoItemType.FILE;
}

export enum RepoItemType {
  DIRECTORY,
  FILE,
}
