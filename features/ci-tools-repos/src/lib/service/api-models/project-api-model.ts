export interface ProjectApiModel {
  id: string;
  name: string;
  type: string;
  description: string;
  testArtifact: ArtifactApiModel;
  configArtifact: ArtifactApiModel;
}

export interface ArtifactApiModel {
  id: string;
  type: string;
  version: string;
  artifactManagerId?: string;
}
