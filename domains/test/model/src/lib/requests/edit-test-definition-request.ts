export interface EditTestDefinitionRequest {
  name: string;
  path: string;
  description: string;
  repoId: string;
  timeoutDuration: {
    days: number;
    hours: number;
    minutes: number;
  };
}
