import {
  BinaryUpgradeExecutionsQueryResult,
  BusinessProcessDefinition,
  UpgradeProcessListingService,
} from "@mxevolve/domains/business-process/data-access";
import type { ActivityRunsPageRequest } from "@mxevolve/domains/business-process/widget";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import { firstValueFrom, of } from "rxjs";
import {
  resolveUpgradeDefinitionIds,
  toActivityRunsPage,
  toUpgradeQuery,
  UPG_ACTIVE_STATUSES,
  UPG_HISTORY_STATUSES,
  upgradeLoadPage,
} from "./upgrade-activity.queries";

function definition(
  id: string,
  processName: string
): BusinessProcessDefinition {
  return {
    id,
    name: id,
    processName,
    providedInputs: [],
    family: { id: "binary-upgrade", name: "Upgrade" },
  };
}

const DEFINITIONS: BusinessProcessDefinition[] = [
  definition("def-1", "Continuous RTP Greening"),
  definition("def-2", "Continuous RTP Greening"),
  definition("def-3", "Patch Upgrade"),
];

function request(
  overrides: Partial<ActivityRunsPageRequest> = {}
): ActivityRunsPageRequest {
  return {
    page: 0,
    pageSize: 5,
    statuses: UPG_ACTIVE_STATUSES,
    filters: {},
    ...overrides,
  };
}

describe("upgrade-activity.queries", () => {
  describe("status split", () => {
    it("treats running, pending-input and aborting runs as active", () => {
      expect(UPG_ACTIVE_STATUSES).toEqual([
        ExecutionStatus.RUNNING,
        ExecutionStatus.PENDING_INPUT,
        ExecutionStatus.ABORTING,
      ]);
    });

    it("treats every other status as history with no overlap", () => {
      expect(UPG_HISTORY_STATUSES).toEqual(
        expect.arrayContaining([
          ExecutionStatus.PASSED,
          ExecutionStatus.FAILED,
          ExecutionStatus.ABORTED,
          ExecutionStatus.STOPPED,
          ExecutionStatus.NOT_STARTED,
        ])
      );
      UPG_ACTIVE_STATUSES.forEach((status) =>
        expect(UPG_HISTORY_STATUSES).not.toContain(status)
      );
    });
  });

  describe("toUpgradeQuery", () => {
    it("sends the page, table status set and hidden=false", () => {
      const query = toUpgradeQuery(
        request({ page: 2, pageSize: 10, statuses: UPG_HISTORY_STATUSES }),
        DEFINITIONS
      );

      expect(query.page).toBe(2);
      expect(query.pageSize).toBe(10);
      expect(query.statuses).toEqual(UPG_HISTORY_STATUSES);
      expect(query.hidden).toBe(false);
    });

    it("preserves every legacy upgrade column filter", () => {
      const query = toUpgradeQuery(
        request({
          ownerPhrase: "john.doe",
          sort: "startDate,desc",
          filters: {
            namePhrase: "nightly",
            officiality: ["OFFICIAL"],
            businessProcessQualityLevel: ["DQG"],
            parentMxArchivalBranchPhrase: "archival-1",
            mxVersionPhrase: "3.1",
            mxBuildIdPhrase: "build-42",
            configurationBranchNamePhrase: "config-branch",
          },
        }),
        DEFINITIONS
      );

      expect(query.namePhrase).toBe("nightly");
      expect(query.officiality).toEqual(["OFFICIAL"]);
      expect(query.businessProcessQualityLevel).toEqual(["DQG"]);
      expect(query.parentMxArchivalBranchPhrase).toBe("archival-1");
      expect(query.mxVersionPhrase).toBe("3.1");
      expect(query.mxBuildIdPhrase).toBe("build-42");
      expect(query.configurationBranchNamePhrase).toBe("config-branch");
      expect(query.ownerPhrase).toBe("john.doe");
      expect(query.sort).toBe("startDate,desc");
    });

    it("prefers the owner column filter over the My Builds owner phrase", () => {
      const query = toUpgradeQuery(
        request({ ownerPhrase: "me", filters: { ownerPhrase: "alice" } }),
        DEFINITIONS
      );

      expect(query.ownerPhrase).toBe("alice");
    });

    it("splits each date-range filter into start and end params", () => {
      const from = new Date("2026-01-01T00:00:00.000Z");
      const to = new Date("2026-01-31T00:00:00.000Z");

      const query = toUpgradeQuery(
        request({
          filters: {
            startDateRange: [from, to],
            endDateRange: [from, to],
            expiryDateRange: [from, to],
          },
        }),
        DEFINITIONS
      );

      expect(query.startDateRangeStart).toBe(from.toISOString());
      expect(query.startDateRangeEnd).toBe(to.toISOString());
      expect(query.endDateRangeStart).toBe(from.toISOString());
      expect(query.endDateRangeEnd).toBe(to.toISOString());
      expect(query.expiryDateRangeStart).toBe(from.toISOString());
      expect(query.expiryDateRangeEnd).toBe(to.toISOString());
    });

    it("narrows the table status set by the Status column filter", () => {
      const query = toUpgradeQuery(
        request({
          statuses: UPG_ACTIVE_STATUSES,
          filters: { statuses: [ExecutionStatus.RUNNING] },
        }),
        DEFINITIONS
      );

      expect(query.statuses).toEqual([ExecutionStatus.RUNNING]);
    });

    it("keeps the table status set when the Status filter falls outside it", () => {
      const query = toUpgradeQuery(
        request({
          statuses: UPG_ACTIVE_STATUSES,
          filters: { statuses: [ExecutionStatus.PASSED] },
        }),
        DEFINITIONS
      );

      expect(query.statuses).toEqual(UPG_ACTIVE_STATUSES);
    });

    it("omits empty filter params", () => {
      const query = toUpgradeQuery(request(), DEFINITIONS);

      expect(query.namePhrase).toBeUndefined();
      expect(query.officiality).toBeUndefined();
      expect(query.parentMxArchivalBranchPhrase).toBeUndefined();
      expect(query.mxVersionPhrase).toBeUndefined();
      expect(query.definitionIds).toBeUndefined();
      expect("startDateRangeStart" in query).toBe(false);
    });
  });

  describe("resolveUpgradeDefinitionIds", () => {
    it("returns undefined when no definition or process-name filter is set", () => {
      expect(
        resolveUpgradeDefinitionIds(DEFINITIONS, undefined, undefined)
      ).toBeUndefined();
    });

    it("returns the selected definition ids", () => {
      expect(
        resolveUpgradeDefinitionIds(DEFINITIONS, ["def-1"], undefined)
      ).toEqual(["def-1"]);
    });

    it("resolves selected process names to their definition ids", () => {
      expect(
        resolveUpgradeDefinitionIds(DEFINITIONS, undefined, [
          "Continuous RTP Greening",
        ])
      ).toEqual(["def-1", "def-2"]);
    });

    it("intersects definition ids and process names when both are set", () => {
      expect(
        resolveUpgradeDefinitionIds(
          DEFINITIONS,
          ["def-1", "def-3"],
          ["Continuous RTP Greening"]
        )
      ).toEqual(["def-1"]);
    });

    it("yields the noMatch sentinel for an empty intersection", () => {
      expect(
        resolveUpgradeDefinitionIds(
          DEFINITIONS,
          ["def-3"],
          ["Continuous RTP Greening"]
        )
      ).toEqual(["noMatch"]);
    });
  });

  describe("upgradeLoadPage", () => {
    it("maps the backend response onto the table rows and total", async () => {
      const response: BinaryUpgradeExecutionsQueryResult = {
        content: [
          { id: "exec-1", name: "Nightly" },
        ] as BinaryUpgradeExecutionsQueryResult["content"],
        totalElements: 12,
      };
      const service = {
        getBinaryUpgradeExecutions: jest.fn(() => of(response)),
      } as unknown as UpgradeProcessListingService;

      const page = await firstValueFrom(
        upgradeLoadPage(service, "project-1", DEFINITIONS)(request())
      );

      expect(page.total).toBe(12);
      expect(page.rows).toHaveLength(1);
      expect(service.getBinaryUpgradeExecutions).toHaveBeenCalledWith(
        "project-1",
        expect.objectContaining({
          hidden: false,
          statuses: UPG_ACTIVE_STATUSES,
        })
      );
    });
  });

  describe("toActivityRunsPage", () => {
    it("maps content and totalElements onto rows and total", () => {
      const page = toActivityRunsPage({
        content: [{ id: "exec-1" }],
        totalElements: 3,
      } as BinaryUpgradeExecutionsQueryResult);

      expect(page.rows).toHaveLength(1);
      expect(page.total).toBe(3);
    });
  });
});
