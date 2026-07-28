import { Observable } from "rxjs";
import { DescribeRepositoryResponse } from "@mxflow/features/scm";

export interface RepositoryDirectoryTreeInput {
  directories: Observable<DescribeRepositoryResponse>;
  failureMessageProvider: (error: any) => string;
  preSelectedDirectory?: string;
  preSelectedFiles?: string[];
  shouldReadFiles?: boolean;
  multiSelection?: boolean;
  fileNameFilter?: string;
}
