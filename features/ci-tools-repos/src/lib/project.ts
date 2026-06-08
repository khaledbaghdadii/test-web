import { Repository } from '@mxflow/features/repository';

export interface Project {
  id: string;
  name: string;
  type: string;
  description: string;
  testRepositories: Repository[];
}

export interface Artifact {
  id: string;
  type: string;
  version: string;
  artifactManagerId?: string;
}
