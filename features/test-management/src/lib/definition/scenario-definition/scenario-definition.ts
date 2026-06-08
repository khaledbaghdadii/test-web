import { EnvironmentDefinition } from "@mxflow/features/environment";
import { BusinessProcessChain } from "@mxflow/features/streams";
import { TestDefinition, TestSelection } from "@mxevolve/domains/test/model";

export interface LiteScenarioDefinition {
  id: string;
  name: string;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  active: boolean;
  archived: boolean;
  tests: Test[];
  bpcs: BusinessProcessChain[];
  heaviness: Heaviness;
  environmentDefinition: EnvironmentDefinition;
  idempotent: boolean;
  nonFunctionalTest: boolean;
}

export interface Test {
  full: boolean;
  testDefinition: TestDefinition;
  testSelections: TestSelection[];
}

export const Heaviness = {
  NA: "NA",
  HEAVY: "HEAVY",
  LIGHT: "LIGHT",
};

export const PossibleHeaviness = [
  Heaviness.NA,
  Heaviness.HEAVY,
  Heaviness.LIGHT,
] as const;

export type Heaviness = (typeof PossibleHeaviness)[number] | undefined;

export enum ActivityStatus {
  ACTIVE = "ACTIVE",
  ALL = "ALL",
  INACTIVE = "INACTIVE",
}
