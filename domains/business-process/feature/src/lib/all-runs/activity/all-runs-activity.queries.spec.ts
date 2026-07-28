import { of } from "rxjs";
import type {
  AllExecutionSummary,
  AllExecutionsService,
} from "@mxevolve/domains/business-process/data-access";
import {
  ExecutionFamily,
  ExecutionStatus,
} from "@mxevolve/domains/business-process/util";
import type { ActivityRunsPageRequest } from "@mxevolve/domains/business-process/widget";
import {
  ALL_RUNS_ACTIVE_STATUSES,
  ALL_RUNS_HISTORY_STATUSES,
  allRunsLoadPage,
  toAllRunsPage,
} from "./all-runs-activity.queries";

describe("all-runs-activity.queries", () => {
  const baseRequest: ActivityRunsPageRequest = {
    page: 0,
    pageSize: 2,
    statuses: ALL_RUNS_ACTIVE_STATUSES,
    filters: {},
  };

  const rows: AllExecutionSummary[] = [
    execution("run-1", ExecutionStatus.RUNNING, "alice", "2026-01-02"),
    execution("run-2", ExecutionStatus.PENDING_INPUT, "bob", "2026-01-03"),
    execution("run-3", ExecutionStatus.PASSED, "alice", "2026-01-04"),
  ];

  it("keeps active and history status sets disjoint", () => {
    expect(ALL_RUNS_ACTIVE_STATUSES).toEqual([
      ExecutionStatus.RUNNING,
      ExecutionStatus.PENDING_INPUT,
      ExecutionStatus.ABORTING,
    ]);
    ALL_RUNS_ACTIVE_STATUSES.forEach((status) =>
      expect(ALL_RUNS_HISTORY_STATUSES).not.toContain(status)
    );
    expect(ALL_RUNS_HISTORY_STATUSES).toContain(ExecutionStatus.PASSED);
  });

  it("filters by status, owner, and name before paging", () => {
    const page = toAllRunsPage(rows, {
      ...baseRequest,
      pageSize: 10,
      ownerPhrase: "alice",
      filters: { namePhrase: "run" },
    });

    expect(page.total).toBe(1);
    expect(page.rows.map((row) => row.id)).toEqual(["run-1"]);
  });

  it("applies the column status filter inside the active/history split", () => {
    const page = toAllRunsPage(rows, {
      ...baseRequest,
      filters: { statuses: [ExecutionStatus.PENDING_INPUT] },
    });

    expect(page.rows.map((row) => row.id)).toEqual(["run-2"]);
  });

  it("sorts by the requested field and returns the requested page", () => {
    const page = toAllRunsPage(rows, {
      ...baseRequest,
      statuses: [
        ExecutionStatus.RUNNING,
        ExecutionStatus.PENDING_INPUT,
        ExecutionStatus.PASSED,
      ],
      page: 1,
      pageSize: 1,
      sort: "startDate,desc",
    });

    expect(page.total).toBe(3);
    expect(page.rows.map((row) => row.id)).toEqual(["run-2"]);
  });

  it("shares the legacy list request across page loads", () => {
    const service = {
      getAllExecutions: jest.fn(() => of(rows)),
    } as unknown as AllExecutionsService;
    const loadPage = allRunsLoadPage(service, "project-1");

    loadPage(baseRequest).subscribe();
    loadPage({ ...baseRequest, page: 1 }).subscribe();

    expect(service.getAllExecutions).toHaveBeenCalledTimes(1);
  });
});

function execution(
  id: string,
  status: ExecutionStatus,
  owner: string,
  startDate: string
): AllExecutionSummary {
  return {
    id,
    name: id,
    owner,
    status,
    startDate,
    familyId: ExecutionFamily.USER_STORY_BUILD_AND_TEST,
  };
}
