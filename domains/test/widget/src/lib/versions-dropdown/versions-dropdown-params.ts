import { VersionType } from "@mxevolve/domains/test/data-access";

export interface VersionsDropdownParams {
  versionTypes: VersionType[];
  active?: boolean;
}
