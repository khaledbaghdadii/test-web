import { Version } from "../../version";

export interface MxBuildVersion extends Version {
  version: string;
  buildId: string;
  revision: string;
  os: string;
}
