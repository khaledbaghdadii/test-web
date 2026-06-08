export interface ScenarioDefinitionApiResponse {
  id: string;
  projectId: string;
  name: string;
  archived: boolean;
  tests: TestDefinitionApiResponse[];
  idempotent: boolean;
  nonFunctionalTest: boolean;
  bpcs: string[];
  environmentDefinitionId: string;
  heaviness: string;
  qualityLevel?: QualityLevel;
}

export interface TestDefinitionApiResponse {
  testDefinitionId: string;
  full: boolean;
  testSelectionIds: string[];
}

export type QualityLevel = "CQG" | "MQG" | "DQG" | "OTHER";
