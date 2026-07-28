import { Version } from "@mxevolve/domains/test/model";

export interface VersionValidationResult {
  validVersions: Version[];
  invalidVersions: string[];
}
