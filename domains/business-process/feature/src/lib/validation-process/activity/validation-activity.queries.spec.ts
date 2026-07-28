import {
  BusinessProcessDefinition,
  ValidationProcessExecutionsQueryResponse,
  ValidationProcessListingService,
} from "@mxevolve/domains/business-process/data-access";
import type { ActivityRunsPageRequest } from "@mxevolve/domains/business-process/widget";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import { firstValueFrom, of } from "rxjs";
import {
  resolveValidationDefinitionIds,
  toActivityRunsPage,
  toValidationQuery,
  VAL_ACTIVE_STATUSES,
  VAL_HISTORY_STATUSES,
  validationLoadPage,
} from "./validation-activity.queries";

function definition(
  id: string,
  processName: string
): BusinessProcessDefinition {
  return {
    id,
    name: id,
    processName,
    providedInputs: [],
    family: { id: "master-validation", name: "Validation" },
  };
}

const DEFINITIONS: BusinessProcessDefinition[] = [
  definition("def-1", "Master Validation"),
  definition("def-2", "Master Validation"),
  definition("def-3", "Incremental RTP Greening"),
];

function request(
  overrides: Partial<ActivityRunsPageRequest> = {}
): ActivityRunsPageRequest {
  return {
    page: 0,
    pageSize: 5,
    statuses: VAL_ACTIVE_STATUSES,
    filters: {},
    ...overrides,
  };
}

describe("validation-activity.queries", () => {
  describe("status split", () => {
    it("treats running, pending-input and aborting runs as active", () => {
      expect(VAL_ACTIVE_STATUSES).toEqual([
        ExecutionStatus.RUNNING,
        ExecutionStatus.PENDING_INPUT,
        ExecutionStatus.ABORTING,
      ]);
    });

    it("treats every other status as history with no overlap", () => {
      expect(VAL_HISTORY_STATUSES).toEqual(
        expect.arrayContaining([
          ExecutionStatus.PASSED,
          ExecutionStatus.FAILED,
          ExecutionStatus.ABORTED,
          ExecutionStatus.STOPPED,
          ExecutionStatus.NOT_STARTED,
        ])
      );
      VAL_ACTIVE_STATUSES.forEach((status) =>
        expect(VAL_HISTORY_STATUSES).not.toContain(status)
      );
    });
  });

  describe("toValidationQuery", () => {
    it("sends the page, table status set and hidden=false", () => {
      const query = toValidationQuery(
        request({ page: 2, pageSize: 10, statuses: VAL_HISTORY_STATUSES }),
        DEFINITIONS
      );

      expect(query.page).toBe(2);
      expect(query.pageSize).toBe(10);
      expect(query.statuses).toEqual(VAL_HISTORY_STATUSES);
      expect(query.hidden).toBe(false);
    });

    it("preserves every legacy validation column filter", () => {
      const query = toValidationQuery(
        request({
          ownerPhrase: "john.doe",
          sort: "startDate,desc",
          filters: {
            namePhrase: "nightly",
            officiality: ["OFFICIAL"],
            businessProcessQualityLevel: ["DQG"],
          },
        }),
        DEFINITIONS
      );

      expect(query.namePhrase).toBe("nightly");
      expect(query.officiality).toEqual(["OFFICIAL"]);
      expect(query.businessProcessQualityLevel).toEqual(["DQG"]);
      expect(query.ownerPhrase).toBe("john.doe");
      expect(query.sort).toBe("startDate,desc");
    });

    it("prefers the owner column filter over the My Builds owner phrase", () => {
      const query = toValidationQuery(
        request({ ownerPhrase: "me", filters: { ownerPhrase: "alice" } }),
        DEFINITIONS
      );

      expect(query.ownerPhrase).toBe("alice");
    });

    it("splits each date-range filter into start and end params", () => {
      const from = new Date("2026-01-01T00:00:00.000Z");
      const to = new Date("2026-01-31T00:00:00.000Z");

      const query = toValidationQuery(
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
      const query = toValidationQuery(
        request({
          statuses: VAL_ACTIVE_STATUSES,
          filters: { statuses: [ExecutionStatus.RUNNING] },
        }),
        DEFINITIONS
      );

      expect(query.statuses).toEqual([ExecutionStatus.RUNNING]);
    });

    it("keeps the table status set when the Status filter falls outside it", () => {
      const query = toValidationQuery(
        request({
          statuses: VAL_ACTIVE_STATUSES,
          filters: { statuses: [ExecutionStatus.PASSED] },
        }),
        DEFINITIONS
      );

      expect(query.statuses).toEqual(VAL_ACTIVE_STATUSES);
    });

    it("omits empty filter params", () => {
      const query = toValidationQuery(request(), DEFINITIONS);

      expect(query.namePhrase).toBeUndefined();
      expect(query.officiality).toBeUndefined();
      expect(query.definitionIds).toBeUndefined();
      expect("startDateRangeStart" in query).toBe(false);
    });
  });

  describe("resolveValidationDefinitionIds", () => {
    it("returns undefined when no definition or process-name filter is set", () => {
      expect(
        resolveValidationDefinitionIds(DEFINITIONS, undefined, undefined)
      ).toBeUndefined();
    });

    it("returns the selected definition ids", () => {
      expect(
        resolveValidationDefinitionIds(DEFINITIONS, ["def-1"], undefined)
      ).toEqual(["def-1"]);
    });

    it("resolves selected process names to their definition ids", () => {
      expect(
        resolveValidationDefinitionIds(DEFINITIONS, undefined, [
          "Master Validation",
        ])
      ).toEqual(["def-1", "def-2"]);
    });

    it("intersects definition ids and process names when both are set", () => {
      expect(
        resolveValidationDefinitionIds(
          DEFINITIONS,
          ["def-1", "def-3"],
          ["Master Validation"]
        )
      ).toEqual(["def-1"]);
    });

    it("yields the noMatch sentinel for an empty intersection", () => {
      expect(
        resolveValidationDefinitionIds(
          DEFINITIONS,
          ["def-3"],
          ["Master Validation"]
        )
      ).toEqual(["noMatch"]);
    });
  });

  describe("validationLoadPage", () => {
    it("maps the backend response onto the table rows and total", async () => {
      const response: ValidationProcessExecutionsQueryResponse = {
        executions: [
          { id: "exec-1", name: "Nightly" },
        ] as ValidationProcessExecutionsQueryResponse["executions"],
        total: 12,
        last: true,
      };
      const service = {
        getValidationProcessExecutions: jest.fn(() => of(response)),
      } as unknown as ValidationProcessListingService;

      const page = await firstValueFrom(
        validationLoadPage(service, "project-1", DEFINITIONS)(request())
      );

      expect(page.total).toBe(12);
      expect(page.rows).toHaveLength(1);
      expect(service.getValidationProcessExecutions).toHaveBeenCalledWith(
        "project-1",
        expect.objectContaining({
          hidden: false,
          statuses: VAL_ACTIVE_STATUSES,
        })
      );
    });
  });

  describe("toActivityRunsPage", () => {
    it("maps executions and total onto rows and total", () => {
      const page = toActivityRunsPage({
        executions: [{ id: "exec-1" }],
        total: 3,
        last: false,
      } as ValidationProcessExecutionsQueryResponse);

      expect(page.rows).toHaveLength(1);
      expect(page.total).toBe(3);
    });
  });
});
