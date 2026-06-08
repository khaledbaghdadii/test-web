export interface CommitDetailsPage {
  page: number;
  size: number;
  totalElements: number;
  last: boolean;
  content: Commit[];
}

export interface Commit {
  id: string;
  committerDisplayName: string;
  timeStamp: string;
  message: string;
  url: string;
}
