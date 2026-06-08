import type {
  ScenarioRunApiResponse,
  TestUnitApiModel,
  TestUnitScenarioExecutionApiModel,
} from "@mxevolve/domains/test/data-access";
import type { UserApiResponse } from "@mxevolve/domains/user/data-access";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import {
  applyEnvironmentStatus,
  applyResolvedAssignees,
  buildEnvironmentStatusMap,
  buildIncidentStatusesByRunId,
  collectUniqueAssigneeIds,
  computeFilterDataFromApiResponses,
  computeFilterDataFromTestUnit,
  extractUniqueEnvironmentIds,
  mapApiResponseToRun,
  mapExecutionToRun,
  mapTestUnitToRuns,
  splitIntoHeadAndPreviousRuns,
  toTableViewModel,
} from "./scenario-runs-mapper";
import type { PanelFilterData } from "./panel-filter-data";

const DEFAULT_FILTER_DATA: PanelFilterData = {
  hasWasteReasons: false,
  hasRegressions: false,
  hasImpacts: false,
  hasIncidents: false,
  incidentStatuses: [],
  businessProcessChainIds: [],
};

function createExecution(
  overrides: Partial<TestUnitScenarioExecutionApiModel> = {}
): TestUnitScenarioExecutionApiModel {
  return {
    scenarioExecutionId: "se-1",
    analysisObjects: {
      binaryImpacts: [],
      binaryRegressions: [],
      configurationImpacts: [],
      configurationRegressions: [],
      failureReasons: [],
      incidents: [],
    },
    analysisStatus: "Passed",
    status: "Passed",
    startDate: "2025-06-01T10:00:00Z",
    endDate: "2025-06-01T11:00:00Z",
    commitId: "abc123",
    mxVersion: "3.1.64",
    mxBuildId: "build-1",
    factoryProductId: "",
    keptExecution: false,
    environment: { environmentId: "env-1", status: "CREATED" },
    cleaningStatus: "",
    failed: false,
    finished: true,
    ...overrides,
  } as TestUnitScenarioExecutionApiModel;
}

function createTestUnit(
  overrides: Partial<TestUnitApiModel> = {}
): TestUnitApiModel {
  return {
    id: "tu-1",
    scenarioDefinitionId: "sd-1",
    scenarioDefinitionName: "test-scenario",
    contextId: "ctx-1",
    assignee: "user-1",
    branch: "main",
    repushable: false,
    disableKeepExecution: false,
    validationScopeEnabled: false,
    incidentEnabled: false,
    headScenarioExecutionId: "se-1",
    scenarioExecutions: [createExecution()],
    ...overrides,
  } as TestUnitApiModel;
}

function createApiResponse(
  overrides: Partial<ScenarioRunApiResponse> = {}
): ScenarioRunApiResponse {
  return {
    id: "run-1",
    name: "test-scenario",
    status: "Passed",
    analysisStatus: "PASSED",
    startDate: "2025-06-01T10:00:00Z",
    endDate: "2025-06-01T11:00:00Z",
    commitId: "abc123",
    assignee: "user-1",
    mxVersion: "3.1.64",
    mxBuildId: "build-1",
    envInfo: { environmentId: "env-1", status: "CREATED" },
    detections: {
      binaryImpactIds: [],
      configurationImpactIds: [],
      binaryRegressionIds: [],
      configurationRegressionIds: [],
      failureReasonIds: [],
    },
    linkedIncidents: [],
    ...overrides,
  } as ScenarioRunApiResponse;
}

describe("mapExecutionToRun", () => {
  it("maps scenarioExecutionId to id", () => {
    const result = mapExecutionToRun(
      createExecution({ scenarioExecutionId: "se-42" }),
      createTestUnit()
    );

    expect(result.id).toBe("se-42");
  });

  it("maps scenarioDefinitionName to name", () => {
    const result = mapExecutionToRun(
      createExecution(),
      createTestUnit({ scenarioDefinitionName: "my-scenario" })
    );

    expect(result.name).toBe("my-scenario");
  });

  it("maps environment.environmentId to environmentId", () => {
    const result = mapExecutionToRun(
      createExecution({
        environment: { environmentId: "env-42", status: "READY" },
      }),
      createTestUnit()
    );

    expect(result.environmentId).toBe("env-42");
  });

  it("counts binary and configuration impacts", () => {
    const result = mapExecutionToRun(
      createExecution({
        analysisObjects: {
          binaryImpacts: ["b1"],
          configurationImpacts: ["c1", "c2"],
          binaryRegressions: [],
          configurationRegressions: [],
          failureReasons: [],
          incidents: [],
        },
      }),
      createTestUnit()
    );

    expect(result.numberOfImpacts).toBe(3);
  });

  it("counts binary and configuration regressions", () => {
    const result = mapExecutionToRun(
      createExecution({
        analysisObjects: {
          binaryImpacts: [],
          configurationImpacts: [],
          binaryRegressions: ["r1", "r2"],
          configurationRegressions: ["r3"],
          failureReasons: [],
          incidents: [],
        },
      }),
      createTestUnit()
    );

    expect(result.numberOfRegressions).toBe(3);
  });

  it("counts incidents", () => {
    const result = mapExecutionToRun(
      createExecution({
        analysisObjects: {
          binaryImpacts: [],
          configurationImpacts: [],
          binaryRegressions: [],
          configurationRegressions: [],
          failureReasons: [],
          incidents: ["inc-1", "inc-2"],
        },
      }),
      createTestUnit()
    );

    expect(result.numberOfIncidents).toBe(2);
  });

  it("exposes combined impact IDs", () => {
    const result = mapExecutionToRun(
      createExecution({
        analysisObjects: {
          binaryImpacts: ["b1"],
          configurationImpacts: ["c1", "c2"],
          binaryRegressions: [],
          configurationRegressions: [],
          failureReasons: [],
          incidents: [],
        },
      }),
      createTestUnit()
    );

    expect(result.impactIds).toEqual(["b1", "c1", "c2"]);
  });

  it("exposes combined regression IDs", () => {
    const result = mapExecutionToRun(
      createExecution({
        analysisObjects: {
          binaryImpacts: [],
          configurationImpacts: [],
          binaryRegressions: ["r1"],
          configurationRegressions: ["r2", "r3"],
          failureReasons: [],
          incidents: [],
        },
      }),
      createTestUnit()
    );

    expect(result.regressionIds).toEqual(["r1", "r2", "r3"]);
  });

  it("exposes incident IDs", () => {
    const result = mapExecutionToRun(
      createExecution({
        analysisObjects: {
          binaryImpacts: [],
          configurationImpacts: [],
          binaryRegressions: [],
          configurationRegressions: [],
          failureReasons: [],
          incidents: ["inc-1", "inc-2"],
        },
      }),
      createTestUnit()
    );

    expect(result.incidentIds).toEqual(["inc-1", "inc-2"]);
  });

  it("maps assignee from test unit", () => {
    const result = mapExecutionToRun(
      createExecution(),
      createTestUnit({ assignee: "assignee-id" })
    );

    expect(result.assigneeId).toBe("assignee-id");
    expect(result.assigneeDisplayName).toBe("assignee-id");
    expect(result.assigneeEmail).toBe("");
  });

  it("maps scenarioDefinitionId from test unit", () => {
    const result = mapExecutionToRun(
      createExecution(),
      createTestUnit({ scenarioDefinitionId: "sd-42" })
    );

    expect(result.scenarioDefinitionId).toBe("sd-42");
  });

  it("maps contextId and subContextId from test unit", () => {
    const result = mapExecutionToRun(
      createExecution(),
      createTestUnit({ contextId: "ctx-42", subContextId: "sub-42" })
    );

    expect(result.contextId).toBe("ctx-42");
    expect(result.subContextId).toBe("sub-42");
  });

  it("maps factoryProductId from execution", () => {
    const result = mapExecutionToRun(
      createExecution({ factoryProductId: "fp-42" }),
      createTestUnit()
    );

    expect(result.factoryProductId).toBe("fp-42");
  });

  it("maps executionGroupId from test unit", () => {
    const result = mapExecutionToRun(
      createExecution(),
      createTestUnit({ executionGroupId: "eg-42" })
    );

    expect(result.executionGroupId).toBe("eg-42");
  });

  it("maps repushable from test unit", () => {
    const result = mapExecutionToRun(
      createExecution(),
      createTestUnit({ repushable: true })
    );

    expect(result.repushable).toBe(true);
  });

  it("sets warningMessage when execution is not kept and keep execution is enabled", () => {
    const result = mapExecutionToRun(
      createExecution({ keptExecution: false }),
      createTestUnit({ disableKeepExecution: false })
    );

    expect(result.warningMessage).toBe(
      "After repushing a scenario that is not kept, the previous execution will be cleaned."
    );
  });

  it("does not set warningMessage when execution is kept", () => {
    const result = mapExecutionToRun(
      createExecution({ keptExecution: true }),
      createTestUnit({ disableKeepExecution: false })
    );

    expect(result.warningMessage).toBeUndefined();
  });

  it("does not set warningMessage when keep execution is disabled", () => {
    const result = mapExecutionToRun(
      createExecution({ keptExecution: false }),
      createTestUnit({ disableKeepExecution: true })
    );

    expect(result.warningMessage).toBeUndefined();
  });
});

describe("mapTestUnitToRuns", () => {
  it("maps each execution to a run", () => {
    const testUnit = createTestUnit({
      headScenarioExecutionId: "se-1",
      scenarioExecutions: [
        createExecution({ scenarioExecutionId: "se-1" }),
        createExecution({ scenarioExecutionId: "se-2" }),
      ],
    });

    const result = mapTestUnitToRuns(testUnit);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("se-1");
    expect(result[1].id).toBe("se-2");
  });

  it("places the head execution first based on headScenarioExecutionId", () => {
    const testUnit = createTestUnit({
      headScenarioExecutionId: "se-3",
      scenarioExecutions: [
        createExecution({ scenarioExecutionId: "se-1" }),
        createExecution({ scenarioExecutionId: "se-2" }),
        createExecution({ scenarioExecutionId: "se-3" }),
      ],
    });

    const result = mapTestUnitToRuns(testUnit);

    expect(result[0].id).toBe("se-3");
  });

  it("preserves order of remaining runs after moving head to first", () => {
    const testUnit = createTestUnit({
      headScenarioExecutionId: "se-3",
      scenarioExecutions: [
        createExecution({ scenarioExecutionId: "se-1" }),
        createExecution({ scenarioExecutionId: "se-2" }),
        createExecution({ scenarioExecutionId: "se-3" }),
      ],
    });

    const result = mapTestUnitToRuns(testUnit);

    expect(result.map((r) => r.id)).toEqual(["se-3", "se-1", "se-2"]);
  });

  it("keeps original order when head is already first", () => {
    const testUnit = createTestUnit({
      headScenarioExecutionId: "se-1",
      scenarioExecutions: [
        createExecution({ scenarioExecutionId: "se-1" }),
        createExecution({ scenarioExecutionId: "se-2" }),
      ],
    });

    const result = mapTestUnitToRuns(testUnit);

    expect(result.map((r) => r.id)).toEqual(["se-1", "se-2"]);
  });

  it("keeps original order when headScenarioExecutionId does not match any execution", () => {
    const testUnit = createTestUnit({
      headScenarioExecutionId: "se-unknown",
      scenarioExecutions: [
        createExecution({ scenarioExecutionId: "se-1" }),
        createExecution({ scenarioExecutionId: "se-2" }),
      ],
    });

    const result = mapTestUnitToRuns(testUnit);

    expect(result.map((r) => r.id)).toEqual(["se-1", "se-2"]);
  });
});

describe("mapApiResponseToRun", () => {
  it("maps id directly", () => {
    const result = mapApiResponseToRun(createApiResponse({ id: "run-42" }));

    expect(result.id).toBe("run-42");
  });

  it("maps envInfo.environmentId to environmentId", () => {
    const result = mapApiResponseToRun(
      createApiResponse({
        envInfo: { environmentId: "env-42", status: "READY" },
      })
    );

    expect(result.environmentId).toBe("env-42");
  });

  it("counts detection impacts", () => {
    const result = mapApiResponseToRun(
      createApiResponse({
        detections: {
          binaryImpactIds: ["b1"],
          configurationImpactIds: ["c1"],
          binaryRegressionIds: [],
          configurationRegressionIds: [],
        },
      })
    );

    expect(result.numberOfImpacts).toBe(2);
  });

  it("counts detection regressions", () => {
    const result = mapApiResponseToRun(
      createApiResponse({
        detections: {
          binaryImpactIds: [],
          configurationImpactIds: [],
          binaryRegressionIds: ["r1"],
          configurationRegressionIds: ["r2", "r3"],
        },
      })
    );

    expect(result.numberOfRegressions).toBe(3);
  });

  it("counts linked incidents", () => {
    const result = mapApiResponseToRun(
      createApiResponse({
        linkedIncidents: [{ id: "inc-1" }, { id: "inc-2" }],
      })
    );

    expect(result.numberOfIncidents).toBe(2);
  });

  it("exposes combined impact IDs", () => {
    const result = mapApiResponseToRun(
      createApiResponse({
        detections: {
          binaryImpactIds: ["b1"],
          configurationImpactIds: ["c1"],
          binaryRegressionIds: [],
          configurationRegressionIds: [],
          failureReasonIds: [],
        },
      })
    );

    expect(result.impactIds).toEqual(["b1", "c1"]);
  });

  it("exposes combined regression IDs", () => {
    const result = mapApiResponseToRun(
      createApiResponse({
        detections: {
          binaryImpactIds: [],
          configurationImpactIds: [],
          binaryRegressionIds: ["r1"],
          configurationRegressionIds: ["r2", "r3"],
          failureReasonIds: [],
        },
      })
    );

    expect(result.regressionIds).toEqual(["r1", "r2", "r3"]);
  });

  it("exposes linked incident IDs", () => {
    const result = mapApiResponseToRun(
      createApiResponse({
        linkedIncidents: [{ id: "inc-1" }, { id: "inc-2" }],
      })
    );

    expect(result.incidentIds).toEqual(["inc-1", "inc-2"]);
  });

  it("maps assignee to assigneeDisplayName", () => {
    const result = mapApiResponseToRun(
      createApiResponse({ assignee: "Test User" })
    );

    expect(result.assigneeId).toBe("Test User");
    expect(result.assigneeDisplayName).toBe("Test User");
    expect(result.assigneeEmail).toBe("");
  });

  it("does not populate context fields from api response", () => {
    const result = mapApiResponseToRun(createApiResponse());

    expect(result.scenarioDefinitionId).toBeUndefined();
    expect(result.contextId).toBeUndefined();
    expect(result.factoryProductId).toBeUndefined();
    expect(result.repushable).toBeUndefined();
  });
});

describe("splitIntoHeadAndPreviousRuns", () => {
  it("puts the first run as head", () => {
    const runs = [
      mapExecutionToRun(
        createExecution({ scenarioExecutionId: "se-head" }),
        createTestUnit()
      ),
      mapExecutionToRun(
        createExecution({ scenarioExecutionId: "se-prev" }),
        createTestUnit()
      ),
    ];

    const result = splitIntoHeadAndPreviousRuns(
      runs,
      new Map(),
      DEFAULT_FILTER_DATA
    );

    expect(result.head.id).toBe("se-head");
    expect(result.previousRuns).toHaveLength(1);
    expect(result.previousRuns[0].id).toBe("se-prev");
  });

  it("applies environment statuses from the map", () => {
    const runs = [
      mapExecutionToRun(
        createExecution({
          scenarioExecutionId: "se-1",
          environment: { environmentId: "env-1", status: "CREATED" },
        }),
        createTestUnit()
      ),
    ];
    const statusMap = new Map<string, EnvironmentStatus>([
      ["env-1", EnvironmentStatus.READY],
    ]);

    const result = splitIntoHeadAndPreviousRuns(
      runs,
      statusMap,
      DEFAULT_FILTER_DATA
    );

    expect(result.head.environmentStatus).toBe(EnvironmentStatus.READY);
  });

  it("computes total findings by deduplicating IDs across all runs", () => {
    const runs = [
      mapExecutionToRun(
        createExecution({
          scenarioExecutionId: "se-1",
          analysisObjects: {
            binaryImpacts: ["imp-1", "imp-2"],
            configurationImpacts: ["imp-3"],
            binaryRegressions: ["reg-1"],
            configurationRegressions: ["reg-2"],
            failureReasons: [],
            incidents: ["inc-1", "inc-2"],
          },
        }),
        createTestUnit()
      ),
      mapExecutionToRun(
        createExecution({
          scenarioExecutionId: "se-2",
          analysisObjects: {
            binaryImpacts: ["imp-1"],
            configurationImpacts: ["imp-4"],
            binaryRegressions: ["reg-1", "reg-3"],
            configurationRegressions: [],
            failureReasons: [],
            incidents: ["inc-2", "inc-3"],
          },
        }),
        createTestUnit()
      ),
    ];

    const result = splitIntoHeadAndPreviousRuns(
      runs,
      new Map(),
      DEFAULT_FILTER_DATA
    );

    expect(result.totalNumberOfImpacts).toBe(4);
    expect(result.totalNumberOfRegressions).toBe(3);
    expect(result.totalNumberOfIncidents).toBe(3);
  });

  it("returns zero totals when runs have no findings", () => {
    const runs = [
      mapExecutionToRun(createExecution(), createTestUnit()),
      mapExecutionToRun(createExecution(), createTestUnit()),
    ];

    const result = splitIntoHeadAndPreviousRuns(
      runs,
      new Map(),
      DEFAULT_FILTER_DATA
    );

    expect(result.totalNumberOfImpacts).toBe(0);
    expect(result.totalNumberOfRegressions).toBe(0);
    expect(result.totalNumberOfIncidents).toBe(0);
  });
});

describe("applyEnvironmentStatus", () => {
  it("replaces environment status when found in map", () => {
    const run = mapExecutionToRun(
      createExecution({
        environment: { environmentId: "env-1", status: "CREATED" },
      }),
      createTestUnit()
    );
    const statusMap = new Map<string, EnvironmentStatus>([
      ["env-1", EnvironmentStatus.READY],
    ]);

    const result = applyEnvironmentStatus(run, statusMap);

    expect(result.environmentStatus).toBe(EnvironmentStatus.READY);
  });

  it("keeps original status when not found in map", () => {
    const run = mapExecutionToRun(
      createExecution({
        environment: { environmentId: "env-1", status: "CREATED" },
      }),
      createTestUnit()
    );

    const result = applyEnvironmentStatus(run, new Map());

    expect(result.environmentStatus).toBe("CREATED");
  });
});

describe("toTableViewModel", () => {
  it("drops head-specific fields", () => {
    const run = mapExecutionToRun(createExecution(), createTestUnit());

    const result = toTableViewModel(run, new Map());

    expect(result).not.toHaveProperty("numberOfImpacts");
    expect(result).not.toHaveProperty("numberOfRegressions");
    expect(result).not.toHaveProperty("numberOfIncidents");
    expect(result).not.toHaveProperty("environmentId");
  });
});

describe("applyResolvedAssignees", () => {
  it("resolves assignee display names and emails from user responses", () => {
    const panel = splitIntoHeadAndPreviousRuns(
      [
        mapExecutionToRun(
          createExecution(),
          createTestUnit({ assignee: "u1" })
        ),
        mapExecutionToRun(
          createExecution(),
          createTestUnit({ assignee: "u2" })
        ),
      ],
      new Map(),
      DEFAULT_FILTER_DATA
    );
    const users: UserApiResponse[] = [
      { id: "u1", displayName: "Alice", mail: "alice@test.com" },
      { id: "u2", displayName: "Bob", mail: "bob@test.com" },
    ];

    const result = applyResolvedAssignees(panel, users);

    expect(result.head.assigneeDisplayName).toBe("Alice");
    expect(result.head.assigneeEmail).toBe("alice@test.com");
    expect(result.previousRuns[0].assigneeDisplayName).toBe("Bob");
    expect(result.previousRuns[0].assigneeEmail).toBe("bob@test.com");
  });

  it("keeps original assignee when user not found", () => {
    const panel = splitIntoHeadAndPreviousRuns(
      [
        mapExecutionToRun(
          createExecution(),
          createTestUnit({ assignee: "unknown" })
        ),
      ],
      new Map(),
      DEFAULT_FILTER_DATA
    );

    const result = applyResolvedAssignees(panel, []);

    expect(result.head.assigneeDisplayName).toBe("unknown");
    expect(result.head.assigneeEmail).toBe("");
  });
});

describe("extractUniqueEnvironmentIds", () => {
  it("returns unique non-empty environment IDs", () => {
    const runs = [
      mapExecutionToRun(
        createExecution({
          environment: { environmentId: "env-1", status: "" },
        }),
        createTestUnit()
      ),
      mapExecutionToRun(
        createExecution({
          environment: { environmentId: "env-1", status: "" },
        }),
        createTestUnit()
      ),
      mapExecutionToRun(
        createExecution({
          environment: { environmentId: "env-2", status: "" },
        }),
        createTestUnit()
      ),
    ];

    expect(extractUniqueEnvironmentIds(runs)).toEqual(["env-1", "env-2"]);
  });

  it("excludes empty IDs", () => {
    const runs = [
      mapExecutionToRun(
        createExecution({
          environment: { environmentId: "", status: "" },
        }),
        createTestUnit()
      ),
    ];

    expect(extractUniqueEnvironmentIds(runs)).toEqual([]);
  });
});

describe("buildEnvironmentStatusMap", () => {
  it("builds a map from environment array", () => {
    const map = buildEnvironmentStatusMap([
      { id: "env-1", status: EnvironmentStatus.READY },
      { id: "env-2", status: EnvironmentStatus.EXECUTING },
    ]);

    expect(map.get("env-1")).toBe(EnvironmentStatus.READY);
    expect(map.get("env-2")).toBe(EnvironmentStatus.EXECUTING);
  });
});

describe("collectUniqueAssigneeIds", () => {
  it("collects unique assignee IDs from head and previous runs", () => {
    const panel = splitIntoHeadAndPreviousRuns(
      [
        mapExecutionToRun(
          createExecution(),
          createTestUnit({ assignee: "u1" })
        ),
        mapExecutionToRun(
          createExecution(),
          createTestUnit({ assignee: "u2" })
        ),
        mapExecutionToRun(
          createExecution(),
          createTestUnit({ assignee: "u1" })
        ),
      ],
      new Map(),
      DEFAULT_FILTER_DATA
    );

    expect(collectUniqueAssigneeIds(panel)).toEqual(["u1", "u2"]);
  });

  it("excludes empty assignees", () => {
    const panel = splitIntoHeadAndPreviousRuns(
      [mapExecutionToRun(createExecution(), createTestUnit({ assignee: "" }))],
      new Map(),
      DEFAULT_FILTER_DATA
    );

    expect(collectUniqueAssigneeIds(panel)).toEqual([]);
  });
});

describe("computeFilterDataFromTestUnit", () => {
  it("returns all false when no detections exist", () => {
    const testUnit = createTestUnit();

    const result = computeFilterDataFromTestUnit(testUnit);

    expect(result).toEqual({
      hasWasteReasons: false,
      hasRegressions: false,
      hasImpacts: false,
      hasIncidents: false,
      incidentStatuses: [],
      businessProcessChainIds: [],
    });
  });

  it("detects waste reasons from failureReasons", () => {
    const testUnit = createTestUnit({
      scenarioExecutions: [
        createExecution({
          analysisObjects: {
            binaryImpacts: [],
            binaryRegressions: [],
            configurationImpacts: [],
            configurationRegressions: [],
            failureReasons: ["fr-1"],
            incidents: [],
          },
        }),
      ],
    });

    const result = computeFilterDataFromTestUnit(testUnit);

    expect(result.hasWasteReasons).toBe(true);
  });

  it("detects regressions from binary regressions", () => {
    const testUnit = createTestUnit({
      scenarioExecutions: [
        createExecution({
          analysisObjects: {
            binaryImpacts: [],
            binaryRegressions: ["br-1"],
            configurationImpacts: [],
            configurationRegressions: [],
            failureReasons: [],
            incidents: [],
          },
        }),
      ],
    });

    const result = computeFilterDataFromTestUnit(testUnit);

    expect(result.hasRegressions).toBe(true);
  });

  it("detects regressions from configuration regressions", () => {
    const testUnit = createTestUnit({
      scenarioExecutions: [
        createExecution({
          analysisObjects: {
            binaryImpacts: [],
            binaryRegressions: [],
            configurationImpacts: [],
            configurationRegressions: ["cr-1"],
            failureReasons: [],
            incidents: [],
          },
        }),
      ],
    });

    const result = computeFilterDataFromTestUnit(testUnit);

    expect(result.hasRegressions).toBe(true);
  });

  it("detects impacts from binary impacts", () => {
    const testUnit = createTestUnit({
      scenarioExecutions: [
        createExecution({
          analysisObjects: {
            binaryImpacts: ["bi-1"],
            binaryRegressions: [],
            configurationImpacts: [],
            configurationRegressions: [],
            failureReasons: [],
            incidents: [],
          },
        }),
      ],
    });

    const result = computeFilterDataFromTestUnit(testUnit);

    expect(result.hasImpacts).toBe(true);
  });

  it("detects impacts from configuration impacts", () => {
    const testUnit = createTestUnit({
      scenarioExecutions: [
        createExecution({
          analysisObjects: {
            binaryImpacts: [],
            binaryRegressions: [],
            configurationImpacts: ["ci-1"],
            configurationRegressions: [],
            failureReasons: [],
            incidents: [],
          },
        }),
      ],
    });

    const result = computeFilterDataFromTestUnit(testUnit);

    expect(result.hasImpacts).toBe(true);
  });

  it("detects incidents", () => {
    const testUnit = createTestUnit({
      scenarioExecutions: [
        createExecution({
          analysisObjects: {
            binaryImpacts: [],
            binaryRegressions: [],
            configurationImpacts: [],
            configurationRegressions: [],
            failureReasons: [],
            incidents: ["inc-1"],
          },
        }),
      ],
    });

    const result = computeFilterDataFromTestUnit(testUnit);

    expect(result.hasIncidents).toBe(true);
  });

  it("aggregates across multiple executions", () => {
    const testUnit = createTestUnit({
      scenarioExecutions: [
        createExecution({
          analysisObjects: {
            binaryImpacts: [],
            binaryRegressions: [],
            configurationImpacts: [],
            configurationRegressions: [],
            failureReasons: ["fr-1"],
            incidents: [],
          },
        }),
        createExecution({
          analysisObjects: {
            binaryImpacts: [],
            binaryRegressions: [],
            configurationImpacts: [],
            configurationRegressions: [],
            failureReasons: [],
            incidents: ["inc-1"],
          },
        }),
      ],
    });

    const result = computeFilterDataFromTestUnit(testUnit);

    expect(result.hasWasteReasons).toBe(true);
    expect(result.hasIncidents).toBe(true);
    expect(result.hasRegressions).toBe(false);
    expect(result.hasImpacts).toBe(false);
  });
});

describe("computeFilterDataFromApiResponses", () => {
  it("returns all false when no detections exist", () => {
    const result = computeFilterDataFromApiResponses([createApiResponse()]);

    expect(result).toEqual({
      hasWasteReasons: false,
      hasRegressions: false,
      hasImpacts: false,
      hasIncidents: false,
      incidentStatuses: [],
      businessProcessChainIds: [],
    });
  });

  it("detects waste reasons from failureReasonIds", () => {
    const result = computeFilterDataFromApiResponses([
      createApiResponse({
        detections: {
          binaryImpactIds: [],
          configurationImpactIds: [],
          binaryRegressionIds: [],
          configurationRegressionIds: [],
          failureReasonIds: ["fr-1"],
        },
      }),
    ]);

    expect(result.hasWasteReasons).toBe(true);
  });

  it("detects regressions from binary regression IDs", () => {
    const result = computeFilterDataFromApiResponses([
      createApiResponse({
        detections: {
          binaryImpactIds: [],
          configurationImpactIds: [],
          binaryRegressionIds: ["br-1"],
          configurationRegressionIds: [],
          failureReasonIds: [],
        },
      }),
    ]);

    expect(result.hasRegressions).toBe(true);
  });

  it("detects impacts from configuration impact IDs", () => {
    const result = computeFilterDataFromApiResponses([
      createApiResponse({
        detections: {
          binaryImpactIds: [],
          configurationImpactIds: ["ci-1"],
          binaryRegressionIds: [],
          configurationRegressionIds: [],
          failureReasonIds: [],
        },
      }),
    ]);

    expect(result.hasImpacts).toBe(true);
  });

  it("detects incidents from linkedIncidents", () => {
    const result = computeFilterDataFromApiResponses([
      createApiResponse({
        linkedIncidents: [
          {
            id: "inc-1",
            title: "t",
            status: "OPEN",
            assignee: "",
            reporter: "",
            creationDate: "",
            externalIssue: { id: "", origin: "", link: "" },
          },
        ],
      }),
    ]);

    expect(result.hasIncidents).toBe(true);
    expect(result.incidentStatuses).toEqual(["OPEN"]);
  });

  it("aggregates across multiple responses", () => {
    const result = computeFilterDataFromApiResponses([
      createApiResponse({
        detections: {
          binaryImpactIds: ["bi-1"],
          configurationImpactIds: [],
          binaryRegressionIds: [],
          configurationRegressionIds: [],
          failureReasonIds: [],
        },
      }),
      createApiResponse({
        detections: {
          binaryImpactIds: [],
          configurationImpactIds: [],
          binaryRegressionIds: ["br-1"],
          configurationRegressionIds: [],
          failureReasonIds: [],
        },
      }),
    ]);

    expect(result.hasImpacts).toBe(true);
    expect(result.hasRegressions).toBe(true);
    expect(result.hasWasteReasons).toBe(false);
    expect(result.hasIncidents).toBe(false);
  });
});

describe("buildIncidentStatusesByRunId", () => {
  it("returns an empty map when no runs have incidents", () => {
    const result = buildIncidentStatusesByRunId([createApiResponse()]);

    expect(result.size).toBe(0);
  });

  it("maps run ID to its incident statuses", () => {
    const result = buildIncidentStatusesByRunId([
      createApiResponse({
        id: "run-1",
        linkedIncidents: [
          {
            id: "inc-1",
            title: "t",
            status: "Draft",
            assignee: "",
            reporter: "",
            creationDate: "",
            externalIssue: { id: "", origin: "", link: "" },
          },
          {
            id: "inc-2",
            title: "t",
            status: "In Progress",
            assignee: "",
            reporter: "",
            creationDate: "",
            externalIssue: { id: "", origin: "", link: "" },
          },
        ],
      }),
    ]);

    expect(result.get("run-1")).toEqual(["Draft", "In Progress"]);
  });

  it("handles multiple runs independently", () => {
    const result = buildIncidentStatusesByRunId([
      createApiResponse({
        id: "run-1",
        linkedIncidents: [
          {
            id: "inc-1",
            title: "t",
            status: "Draft",
            assignee: "",
            reporter: "",
            creationDate: "",
            externalIssue: { id: "", origin: "", link: "" },
          },
        ],
      }),
      createApiResponse({
        id: "run-2",
        linkedIncidents: [
          {
            id: "inc-2",
            title: "t",
            status: "CLOSED",
            assignee: "",
            reporter: "",
            creationDate: "",
            externalIssue: { id: "", origin: "", link: "" },
          },
        ],
      }),
    ]);

    expect(result.get("run-1")).toEqual(["Draft"]);
    expect(result.get("run-2")).toEqual(["CLOSED"]);
  });

  it("filters out empty status strings", () => {
    const result = buildIncidentStatusesByRunId([
      createApiResponse({
        id: "run-1",
        linkedIncidents: [
          {
            id: "inc-1",
            title: "t",
            status: "",
            assignee: "",
            reporter: "",
            creationDate: "",
            externalIssue: { id: "", origin: "", link: "" },
          },
          {
            id: "inc-2",
            title: "t",
            status: "Draft",
            assignee: "",
            reporter: "",
            creationDate: "",
            externalIssue: { id: "", origin: "", link: "" },
          },
        ],
      }),
    ]);

    expect(result.get("run-1")).toEqual(["Draft"]);
  });
});

describe("computeFilterDataFromTestUnit with incidentStatusesByRunId", () => {
  it("populates incident statuses from the status map", () => {
    const testUnit = createTestUnit({
      scenarioExecutions: [
        createExecution({
          scenarioExecutionId: "se-1",
          analysisObjects: {
            binaryImpacts: [],
            binaryRegressions: [],
            configurationImpacts: [],
            configurationRegressions: [],
            failureReasons: [],
            incidents: ["inc-1"],
          },
        }),
      ],
    });
    const statusMap = new Map([["se-1", ["Draft", "In Progress"]]]);

    const result = computeFilterDataFromTestUnit(testUnit, statusMap);

    expect(result.incidentStatuses).toEqual(["Draft", "In Progress"]);
    expect(result.hasIncidents).toBe(true);
  });

  it("returns empty incident statuses when execution ID is not in the map", () => {
    const testUnit = createTestUnit({
      scenarioExecutions: [
        createExecution({
          scenarioExecutionId: "se-1",
          analysisObjects: {
            binaryImpacts: [],
            binaryRegressions: [],
            configurationImpacts: [],
            configurationRegressions: [],
            failureReasons: [],
            incidents: ["inc-1"],
          },
        }),
      ],
    });
    const statusMap = new Map([["se-other", ["Draft"]]]);

    const result = computeFilterDataFromTestUnit(testUnit, statusMap);

    expect(result.incidentStatuses).toEqual([]);
  });

  it("deduplicates statuses across multiple executions", () => {
    const testUnit = createTestUnit({
      scenarioExecutions: [
        createExecution({
          scenarioExecutionId: "se-1",
          analysisObjects: {
            binaryImpacts: [],
            binaryRegressions: [],
            configurationImpacts: [],
            configurationRegressions: [],
            failureReasons: [],
            incidents: ["inc-1"],
          },
        }),
        createExecution({
          scenarioExecutionId: "se-2",
          analysisObjects: {
            binaryImpacts: [],
            binaryRegressions: [],
            configurationImpacts: [],
            configurationRegressions: [],
            failureReasons: [],
            incidents: ["inc-2"],
          },
        }),
      ],
    });
    const statusMap = new Map([
      ["se-1", ["Draft"]],
      ["se-2", ["Draft", "CLOSED"]],
    ]);

    const result = computeFilterDataFromTestUnit(testUnit, statusMap);

    expect(result.incidentStatuses).toEqual(["Draft", "CLOSED"]);
  });

  it("returns empty incident statuses when no map is provided", () => {
    const testUnit = createTestUnit({
      scenarioExecutions: [
        createExecution({
          analysisObjects: {
            binaryImpacts: [],
            binaryRegressions: [],
            configurationImpacts: [],
            configurationRegressions: [],
            failureReasons: [],
            incidents: ["inc-1"],
          },
        }),
      ],
    });

    const result = computeFilterDataFromTestUnit(testUnit);

    expect(result.incidentStatuses).toEqual([]);
  });
});

describe("computeFilterDataFromApiResponses with businessProcessChainIds", () => {
  it("passes through provided BPC IDs", () => {
    const result = computeFilterDataFromApiResponses(
      [createApiResponse()],
      ["bpc-1", "bpc-2"]
    );

    expect(result.businessProcessChainIds).toEqual(["bpc-1", "bpc-2"]);
  });

  it("returns empty businessProcessChainIds when none provided", () => {
    const result = computeFilterDataFromApiResponses([createApiResponse()]);

    expect(result.businessProcessChainIds).toEqual([]);
  });
});

describe("computeFilterDataFromTestUnit with businessProcessChainIds", () => {
  it("populates businessProcessChainIds from the provided array", () => {
    const testUnit = createTestUnit({
      scenarioExecutions: [createExecution({ scenarioExecutionId: "se-1" })],
    });

    const result = computeFilterDataFromTestUnit(testUnit, undefined, [
      "bpc-1",
      "bpc-2",
    ]);

    expect(result.businessProcessChainIds).toEqual(["bpc-1", "bpc-2"]);
  });

  it("returns empty businessProcessChainIds when no BPC IDs provided", () => {
    const testUnit = createTestUnit();

    const result = computeFilterDataFromTestUnit(testUnit);

    expect(result.businessProcessChainIds).toEqual([]);
  });
});
