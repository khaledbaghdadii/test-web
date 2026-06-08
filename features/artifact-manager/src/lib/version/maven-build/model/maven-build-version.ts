import { Version } from "../../version";

export interface MavenBuildVersion extends Version {
  groupId: string;
  artifactId: string;
  version: string;
  classifier?: string;
}
