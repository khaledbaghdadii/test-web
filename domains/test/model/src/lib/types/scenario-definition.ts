import { BusinessProcessChain } from "./business-process-chain";
import { EnvironmentDefinition } from "./environment-definition";
import { Heaviness } from "./heaviness";
import { TestDefinition } from "./test-definition";
import { TestSelection } from "./test-selection";

export interface LiteScenarioDefinition {
  id: string;
  name: string;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  archived: boolean;
  tests: Test[];
  bpcs: BusinessProcessChain[];
  heaviness: Heaviness;
  environmentDefinition: EnvironmentDefinition;
  idempotent: boolean;
  nonFunctionalTest: boolean;
  qualityLevel?: QualityLevel;
}

export interface Test {
  full: boolean;
  testDefinition: TestDefinition;
  testSelections: TestSelection[];
}

export type QualityLevel = "CQG" | "MQG" | "DQG" | "OTHER";
