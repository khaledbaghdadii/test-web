import { Environment } from "@mxevolve/domains/environment/data-access";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { toReferenceScenarioRow } from "./reference-scenario-mapper";
import { ReferenceScenarioApiModel } from "../models/reference-scenario-api-model";

describe("Reference Scenario Mapper", () => {
  const scenario: ReferenceScenarioApiModel = {
    id: "scenarioId",
    name: "TPK Alpha",
    status: "EXECUTING",
    startDate: "2026-03-01T10:00:00Z",
    endDate: "2026-03-01T11:00:00Z",
    envInfo: {
      environmentId: "environmentId",
    },
    commitId: "abc123",
    mxVersion: "mxVersion",
    mxBuildId: "mxBuildId",
  };

  it("should combine scenario and environment and return the result", () => {
    const environment: Environment = {
      id: "environmentId",
      status: EnvironmentStatus.READY,
      projectId: "proj-001",
      startDate: "2026-02-28T09:00:00Z",
      mxVersion: "EnvMxVersion",
      mxBuildId: "EnvMxBuildId",
      commitId: "env-commit",
      databases: [],
    };

    const result = toReferenceScenarioRow(scenario, environment);

    expect(result).toEqual({
      scenarioExecutionId: "scenarioId",
      tpkName: "TPK Alpha",
      scenarioStatus: "EXECUTING",
      scenarioStartDate: "2026-03-01T10:00:00Z",
      scenarioEndDate: "2026-03-01T11:00:00Z",
      tpkCommitId: "abc123",
      tpkMxVersion: "mxVersion",
      tpkMxBuildId: "mxBuildId",
      environment: {
        id: "environmentId",
        status: EnvironmentStatus.READY,
        projectId: "proj-001",
        startDate: "2026-02-28T09:00:00Z",
        mxVersion: "EnvMxVersion",
        mxBuildId: "EnvMxBuildId",
        commitId: "env-commit",
        databases: [],
      },
    });
  });

  it("when combining scenario and environment, then should nest the environment on the row", () => {
    const environment: Environment = {
      id: "environmentId",
      status: EnvironmentStatus.READY,
      projectId: "proj-001",
      databases: [],
      webClientUrl: "https://client.test",
      environmentActions: ["openClient"],
    };

    const result = toReferenceScenarioRow(scenario, environment);

    expect(result.environment).toBe(environment);
    expect(result.environment?.webClientUrl).toBe("https://client.test");
    expect(result.environment?.environmentActions).toEqual(["openClient"]);
  });

  it("given environment is undefined when combining scenario and environment, then should return a scenario only result", () => {
    const result = toReferenceScenarioRow(scenario);

    expect(result).toEqual({
      scenarioExecutionId: "scenarioId",
      tpkName: "TPK Alpha",
      scenarioStatus: "EXECUTING",
      scenarioStartDate: "2026-03-01T10:00:00Z",
      scenarioEndDate: "2026-03-01T11:00:00Z",
      tpkCommitId: "abc123",
      tpkMxVersion: "mxVersion",
      tpkMxBuildId: "mxBuildId",
    });
    expect(result.environment).toBeUndefined();
  });

  it("should pass undefined optional scenario fields through", () => {
    const minimalScenario: ReferenceScenarioApiModel = {
      id: "scenario-002",
      name: "TPK Beta",
      status: "CREATED",
      envInfo: {
        environmentId: "environmentId",
      },
    };

    const result = toReferenceScenarioRow(minimalScenario);

    expect(result.scenarioStartDate).toBeUndefined();
    expect(result.scenarioEndDate).toBeUndefined();
    expect(result.tpkCommitId).toBeUndefined();
    expect(result.tpkMxVersion).toBeUndefined();
    expect(result.tpkMxBuildId).toBeUndefined();
  });
});
