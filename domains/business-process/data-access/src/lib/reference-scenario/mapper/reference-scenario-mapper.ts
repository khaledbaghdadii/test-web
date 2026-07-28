import { Environment } from "@mxevolve/domains/environment/data-access";
import { ReferenceScenarioApiModel } from "../models/reference-scenario-api-model";
import { ReferenceScenario } from "../models/reference-scenario";

export function toReferenceScenarioRow(
  scenario: ReferenceScenarioApiModel,
  environment?: Environment
): ReferenceScenario {
  return {
    scenarioExecutionId: scenario.id,
    tpkName: scenario.name,
    scenarioStatus: scenario.status,
    scenarioStartDate: scenario.startDate,
    scenarioEndDate: scenario.endDate,
    tpkCommitId: scenario.commitId,
    tpkMxVersion: scenario.mxVersion,
    tpkMxBuildId: scenario.mxBuildId,
    environment,
  };
}
