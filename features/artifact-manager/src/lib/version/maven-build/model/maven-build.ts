export interface MavenBuild {
  groupId: string;
  artifactId: string;
  version: string;
  classifier?: string;
}
