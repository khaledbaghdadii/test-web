import { TestSelectionApiModel } from "./test-selection-api-model";

export interface TestDefinitionApiModel {
  id: string;
  name: string;
  projectId: string;
  repoId: string;
  path: string;
  timeoutDuration: {
    days: number;
    hours: number;
    minutes: number;
  };
  testSelections: TestSelectionApiModel[];
  description: string;
}
