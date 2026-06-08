export interface ArtifactManager {
  id: string;
  name: string;
  url: string;
  username?: string;
  password?: string;
  credentialsId: string;
}
