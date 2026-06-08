export interface ScenarioDefinitionApiResponse {
  id: string;
  projectId: string;
  name: string;
  active: boolean;
  archived: boolean;
  tests: TestDefinitionApiResponse[];
  idempotent: boolean;
  nonFunctionalTest: boolean;
  bpcs: string[];
  environmentDefinitionId: string;
  heaviness: string;
}

export interface TestDefinitionApiResponse {
  testDefinitionId: string;
  full: boolean;
  testSelectionIds: string[];
}
