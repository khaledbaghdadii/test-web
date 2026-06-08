import { GitFileStatusCode } from "../model";

export interface SourceTreeEntryApiResponse {
  path: string;
  pathCode: GitFileStatusCode;
  pathSize: number;
  directory: boolean;
}
