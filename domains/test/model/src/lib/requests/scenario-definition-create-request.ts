export interface TestCreateRequest {
  full: boolean;
  testDefinitionId: string;
  testSelectionIds: string[];
}

export interface ScenarioDefinitionCreateRequest {
  name: string;
  tests: TestCreateRequest[];
  idempotent: boolean;
  nonFunctionalTest: boolean;
  bpcs: string[];
  environmentDefinitionId: string;
  heaviness: string;
  qualityLevel: string;
}
