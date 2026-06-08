import { GitFileStatusCode } from "../model";

export interface ChangedFileApiResponse {
  path: string;
  gitFileStatusCode: GitFileStatusCode;
}
