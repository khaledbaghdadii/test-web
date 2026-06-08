import { panelPassesAssigneeFilter } from "./assignee-filter.util";
import type { ScenarioRunsPanelViewModel } from "./scenario-runs-panel-facade.service";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";

describe("panelPassesAssigneeFilter", () => {
  it("returns true when filterValue is null", () => {
    const panel = createPanel("user-1");
    expect(panelPassesAssigneeFilter(panel, null, "user-1", new Set())).toBe(
      true
    );
  });

  describe("not-assigned", () => {
    it("returns true when assigneeId is empty string", () => {
      const panel = createPanel("");
      expect(
        panelPassesAssigneeFilter(panel, "not-assigned", "user-1", new Set())
      ).toBe(true);
    });

    it("returns true when assigneeId is null at runtime", () => {
      const panel = createPanel(null as unknown as string);
      expect(
        panelPassesAssigneeFilter(panel, "not-assigned", "user-1", new Set())
      ).toBe(true);
    });

    it("returns false when assigneeId is set", () => {
      const panel = createPanel("user-1");
      expect(
        panelPassesAssigneeFilter(panel, "not-assigned", "user-1", new Set())
      ).toBe(false);
    });
  });

  describe("assigned-to-me", () => {
    it("returns true when assigneeId matches currentUserId", () => {
      const panel = createPanel("user-1");
      expect(
        panelPassesAssigneeFilter(panel, "assigned-to-me", "user-1", new Set())
      ).toBe(true);
    });

    it("returns false when assigneeId does not match currentUserId", () => {
      const panel = createPanel("user-2");
      expect(
        panelPassesAssigneeFilter(panel, "assigned-to-me", "user-1", new Set())
      ).toBe(false);
    });
  });

  describe("assigned-to-my-stream", () => {
    it("returns true when panel has a BPC in userStreamBpcIds", () => {
      const panel = createPanel("other-user", ["bpc-1", "bpc-2"]);
      expect(
        panelPassesAssigneeFilter(
          panel,
          "assigned-to-my-stream",
          "user-1",
          new Set(["bpc-1"])
        )
      ).toBe(true);
    });

    it("returns false when panel has no BPC in userStreamBpcIds", () => {
      const panel = createPanel("other-user", ["bpc-3"]);
      expect(
        panelPassesAssigneeFilter(
          panel,
          "assigned-to-my-stream",
          "user-1",
          new Set(["bpc-1"])
        )
      ).toBe(false);
    });

    it("returns false when panel has no bpcIds", () => {
      const panel = createPanel("other-user", []);
      expect(
        panelPassesAssigneeFilter(
          panel,
          "assigned-to-my-stream",
          "user-1",
          new Set(["bpc-1"])
        )
      ).toBe(false);
    });

    it("returns false when userStreamBpcIds is empty", () => {
      const panel = createPanel("other-user", ["bpc-1"]);
      expect(
        panelPassesAssigneeFilter(
          panel,
          "assigned-to-my-stream",
          "user-1",
          new Set()
        )
      ).toBe(false);
    });
  });
});

function createPanel(
  assigneeId: string,
  businessProcessChainIds: string[] = []
): ScenarioRunsPanelViewModel {
  return {
    totalNumberOfImpacts: 0,
    totalNumberOfIncidents: 0,
    totalNumberOfRegressions: 0,
    head: {
      id: "run-1",
      name: "test",
      status: ScenarioRunStatus.PASSED,
      environmentId: "env-1",
      environmentStatus: EnvironmentStatus.READY,
      analysisStatus: "PASSED",
      numberOfImpacts: 0,
      numberOfRegressions: 0,
      numberOfIncidents: 0,
      startDate: "2025-01-01T00:00:00Z",
      commitId: "abc",
      assigneeId,
      assigneeDisplayName: "User",
      assigneeEmail: "user@example.com",
      mxVersion: "3.1.0",
      mxBuildId: "build-1",
      impactIds: [],
      regressionIds: [],
      incidentIds: [],
    },
    previousRuns: [],
    filterData: {
      hasWasteReasons: false,
      hasRegressions: false,
      hasImpacts: false,
      hasIncidents: false,
      incidentStatuses: [],
      businessProcessChainIds,
    },
  };
}
