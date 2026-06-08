export interface ScenarioDefinitionUpdateRequest {
  name: string;
  tests: TestUpdateRequest[];
  idempotent: boolean;
  nonFunctionalTest: boolean;
  bpcs: string[];
  environmentDefinitionId: string;
  heaviness: string;
}

export interface TestUpdateRequest {
  full: boolean;
  testDefinitionId: string;
  testSelectionIds: string[];
}
