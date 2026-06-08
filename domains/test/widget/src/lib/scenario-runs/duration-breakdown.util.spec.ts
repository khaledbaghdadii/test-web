import {
  computeDurationBreakdown,
  formatDurationMs,
} from "./duration-breakdown.util";
import type { HeadScenarioRunViewModel } from "./head-scenario-run-view-model";
import type { DurationBreakdownData } from "./scenario-runs-panel-facade.service";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";

const BASE_HEAD: HeadScenarioRunViewModel = {
  id: "run-1",
  name: "Scenario",
  status: ScenarioRunStatus.PASSED,
  environmentId: "env-1",
  environmentStatus: EnvironmentStatus.RUNNING,
  analysisStatus: "PASSED",
  numberOfImpacts: 0,
  numberOfRegressions: 0,
  numberOfIncidents: 0,
  startDate: "2024-01-01T10:00:00.000Z",
  endDate: "2024-01-01T11:00:00.000Z",
  commitId: "abc123",
  assigneeId: "",
  assigneeDisplayName: "",
  assigneeEmail: "",
  mxVersion: "1.0",
  mxBuildId: "build-1",
};

describe("computeDurationBreakdown", () => {
  it("returns null when head has no endDate", () => {
    const head = { ...BASE_HEAD, endDate: undefined };
    expect(computeDurationBreakdown(head, undefined)).toBeNull();
  });

  it("computes total duration correctly", () => {
    const result = computeDurationBreakdown(BASE_HEAD, undefined);
    expect(result?.totalDuration).toBe("1h 0m 0s");
  });

  it("shows N/A for test time when breakdown is undefined", () => {
    const result = computeDurationBreakdown(BASE_HEAD, undefined);
    expect(result?.testTime).toBe("N/A");
  });

  it("shows N/A for test time when testExecutionTimings is empty", () => {
    const breakdown: DurationBreakdownData = {
      testExecutionTimings: [],
    };
    const result = computeDurationBreakdown(BASE_HEAD, breakdown);
    expect(result?.testTime).toBe("N/A");
  });

  it("shows N/A for test time when testExecutions have no endDates", () => {
    const breakdown: DurationBreakdownData = {
      testExecutionTimings: [{ startDate: "2024-01-01T10:00:00.000Z" }],
    };
    const result = computeDurationBreakdown(BASE_HEAD, breakdown);
    expect(result?.testTime).toBe("N/A");
  });

  it("computes test time as sum of TPK durations", () => {
    const breakdown: DurationBreakdownData = {
      testExecutionTimings: [
        {
          startDate: "2024-01-01T10:00:00.000Z",
          endDate: "2024-01-01T10:30:00.000Z",
        },
        {
          startDate: "2024-01-01T10:00:00.000Z",
          endDate: "2024-01-01T10:20:00.000Z",
        },
      ],
    };
    const result = computeDurationBreakdown(BASE_HEAD, breakdown);
    expect(result?.testTime).toBe("0h 50m 0s");
  });

  it("computes deployment time correctly", () => {
    const breakdown: DurationBreakdownData = {
      testExecutionTimings: [],
      deploymentStartedOn: "2024-01-01T09:00:00.000Z",
      deploymentEndedOn: "2024-01-01T09:15:00.000Z",
    };
    const result = computeDurationBreakdown(BASE_HEAD, breakdown);
    expect(result?.deploymentTime).toBe("0h 15m 0s");
  });

  it("shows N/A for deployment time when no deployment data", () => {
    const breakdown: DurationBreakdownData = {
      testExecutionTimings: [],
    };
    const result = computeDurationBreakdown(BASE_HEAD, breakdown);
    expect(result?.deploymentTime).toBe("N/A");
  });

  it("shows N/A for other time when neither test nor deployment is available", () => {
    const breakdown: DurationBreakdownData = {
      testExecutionTimings: [],
    };
    const result = computeDurationBreakdown(BASE_HEAD, breakdown);
    expect(result?.other).toBe("N/A");
  });

  it("computes other time when only deployment is available", () => {
    const breakdown: DurationBreakdownData = {
      testExecutionTimings: [],
      deploymentStartedOn: "2024-01-01T10:00:00.000Z",
      deploymentEndedOn: "2024-01-01T10:15:00.000Z",
    };
    const result = computeDurationBreakdown(BASE_HEAD, breakdown);
    // total = 1h, deployment = 15m => other = 45m
    expect(result?.other).toBe("0h 45m 0s");
  });

  it("computes other time when only test is available", () => {
    const breakdown: DurationBreakdownData = {
      testExecutionTimings: [
        {
          startDate: "2024-01-01T10:00:00.000Z",
          endDate: "2024-01-01T10:30:00.000Z",
        },
      ],
    };
    const result = computeDurationBreakdown(BASE_HEAD, breakdown);
    // total = 1h, test = 30m => other = 30m
    expect(result?.other).toBe("0h 30m 0s");
  });

  it("computes other time as total minus test minus deployment", () => {
    const breakdown: DurationBreakdownData = {
      testExecutionTimings: [
        {
          startDate: "2024-01-01T10:00:00.000Z",
          endDate: "2024-01-01T10:30:00.000Z",
        },
      ],
      deploymentStartedOn: "2024-01-01T09:00:00.000Z",
      deploymentEndedOn: "2024-01-01T09:15:00.000Z",
    };
    const result = computeDurationBreakdown(BASE_HEAD, breakdown);
    // total = 1h, test = 30m, deployment = 15m => other = 15m
    expect(result?.other).toBe("0h 15m 0s");
  });

  it("shows N/A for other time when remainder is zero", () => {
    const breakdown: DurationBreakdownData = {
      testExecutionTimings: [
        {
          startDate: "2024-01-01T10:00:00.000Z",
          endDate: "2024-01-01T10:45:00.000Z",
        },
      ],
      deploymentStartedOn: "2024-01-01T09:00:00.000Z",
      deploymentEndedOn: "2024-01-01T09:15:00.000Z",
    };
    const result = computeDurationBreakdown(BASE_HEAD, breakdown);
    // total = 1h, test = 45m, deployment = 15m => other = 0 => N/A
    expect(result?.other).toBe("N/A");
  });
});

describe("formatDurationMs", () => {
  it("formats zero duration", () => {
    expect(formatDurationMs(0)).toBe("0h 0m 0s");
  });

  it("formats hours, minutes, and seconds", () => {
    expect(formatDurationMs(3661000)).toBe("1h 1m 1s");
  });

  it("floors partial seconds", () => {
    expect(formatDurationMs(1500)).toBe("0h 0m 1s");
  });
});
