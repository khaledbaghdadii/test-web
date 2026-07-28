import { render, screen, waitFor } from "@testing-library/angular";
import type { RenderResult } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { firstValueFrom, of } from "rxjs";
import { Button } from "primeng/button";
import type { ColDef } from "ag-grid-enterprise";
import { AuthenticationService } from "@mxflow/core/auth";
import {
  AllExecutionsService,
  type AllExecutionSummary,
} from "@mxevolve/domains/business-process/data-access";
import {
  ExecutionFamily,
  ExecutionStatus,
} from "@mxevolve/domains/business-process/util";
import {
  ActivityRunsTableComponent,
  MyRunsToggleComponent,
} from "@mxevolve/domains/business-process/widget";
import { RunActionsCellComponent } from "@mxevolve/domains/business-process/composite-widget";
import { DefinitionDetailsLinkCellComponent } from "../../shared/definition-details-link/definition-details-link-cell.component";
import {
  AllRunsNameCellComponent,
  AllRunsStatusCellComponent,
} from "./all-runs-activity.cells";
import { AllRunsActivityComponent } from "./all-runs-activity.component";
import {
  ALL_RUNS_ACTIVE_STATUSES,
  ALL_RUNS_HISTORY_STATUSES,
} from "./all-runs-activity.queries";

const authenticationServiceMock = {
  getUsername: jest.fn(() => "alice"),
};

const MOCK_IMPORTS = [
  Button,
  MockComponent(ActivityRunsTableComponent),
  MockComponent(MyRunsToggleComponent),
];

const OFFICIALITY_OPTIONS = [
  { label: "Official", value: "OFFICIAL" },
  { label: "Unofficial", value: "UNOFFICIAL" },
  { label: "N/A", value: "NA" },
];

const ACTIVE_STATUS_OPTIONS = Object.values(ExecutionStatus)
  .filter((status) => ALL_RUNS_ACTIVE_STATUSES.includes(status))
  .map((status) => ({ label: status.replaceAll("_", " "), value: status }));

const HISTORY_STATUS_OPTIONS = Object.values(ExecutionStatus)
  .filter((status) => !ALL_RUNS_ACTIVE_STATUSES.includes(status))
  .map((status) => ({ label: status.replaceAll("_", " "), value: status }));

type ActivityRender = RenderResult<AllRunsActivityComponent>;

async function renderActivity(
  executionsService: Partial<AllExecutionsService> = {}
): Promise<ActivityRender> {
  return render(AllRunsActivityComponent, {
    inputs: { projectId: "project-1" },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: AllExecutionsService, useValue: executionsService },
    ],
    providers: [
      { provide: AuthenticationService, useValue: authenticationServiceMock },
    ],
  });
}

function tables(result: ActivityRender): ActivityRunsTableComponent[] {
  return ngMocks
    .findAll(result.fixture, ActivityRunsTableComponent)
    .map((debugElement) => debugElement.componentInstance);
}

function myRunsToggle(result: ActivityRender): MyRunsToggleComponent {
  return ngMocks.find(result.fixture, MyRunsToggleComponent).componentInstance;
}

function column(table: ActivityRunsTableComponent, colId: string): ColDef {
  return (table.columnDefs as unknown as ColDef[]).find(
    (col) => col.colId === colId
  ) as ColDef;
}

async function showHistory(result: ActivityRender): Promise<void> {
  await userEvent.click(screen.getByRole("button", { name: /show history/i }));
  await waitFor(() => expect(tables(result)).toHaveLength(2));
}

describe("AllRunsActivityComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authenticationServiceMock.getUsername.mockReturnValue("alice");
  });

  it("renders the active runs table scoped to the in-flight statuses", async () => {
    const result = await renderActivity();

    const active = tables(result)[0];
    expect(active.statuses).toEqual(ALL_RUNS_ACTIVE_STATUSES);
    expect(active.pageSize).toBe(5);
    expect(active.projectId).toBe("project-1");
  });

  it("gives the active table a live (non-terminal) actions column", async () => {
    const result = await renderActivity();

    const actions = tables(result)[0].actionsColumn;
    expect(actions?.cellRenderer).toBe(RunActionsCellComponent);
    expect(actions?.cellRendererParams).toBeUndefined();
  });

  it("hides the history table until Show History is toggled", async () => {
    const result = await renderActivity();

    expect(tables(result)).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: /show history/i })
    ).toBeInTheDocument();
  });

  it("shows the history table scoped to the terminal statuses with ten rows per page", async () => {
    const result = await renderActivity();

    await showHistory(result);

    const history = tables(result)[1];
    expect(history.statuses).toEqual(ALL_RUNS_HISTORY_STATUSES);
    expect(history.pageSize).toBe(10);
    expect(history.projectId).toBe("project-1");
  });

  it("gives the history table a terminal actions column", async () => {
    const result = await renderActivity();

    await showHistory(result);

    const actions = tables(result)[1].actionsColumn;
    expect(actions?.cellRenderer).toBe(RunActionsCellComponent);
    expect(actions?.cellRendererParams).toEqual({ terminal: true });
  });

  it("hides the history table again when Hide History is clicked", async () => {
    const result = await renderActivity();

    await showHistory(result);

    await userEvent.click(
      screen.getByRole("button", { name: /hide history/i })
    );

    await waitFor(() => expect(tables(result)).toHaveLength(1));
  });

  it("scopes both tables to the signed-in user by default", async () => {
    const result = await renderActivity();

    await showHistory(result);

    tables(result).forEach((table) => expect(table.ownerPhrase).toBe("alice"));
  });

  it("updates both tables' owner scope when the My Runs toggle changes", async () => {
    const result = await renderActivity();
    await showHistory(result);

    myRunsToggle(result).ownerPhrase.emit("bob");

    await waitFor(() => {
      tables(result).forEach((table) => expect(table.ownerPhrase).toBe("bob"));
    });
  });

  it("clears the owner scope when the My Runs toggle emits undefined", async () => {
    const result = await renderActivity();

    myRunsToggle(result).ownerPhrase.emit(undefined);

    await waitFor(() => expect(tables(result)[0].ownerPhrase).toBeUndefined());
  });

  it("loads a page through the executions service and enriches rows for actions", async () => {
    const row: AllExecutionSummary = {
      id: "run-1",
      name: "run-1",
      familyId: ExecutionFamily.VALIDATION_PROCESS,
      sourceDefinitionId: "def-1",
      status: ExecutionStatus.RUNNING,
    };
    const executionsService = {
      getAllExecutions: jest.fn(() => of([row])),
    };
    const result = await renderActivity(executionsService);

    const page = await firstValueFrom(
      tables(result)[0].loadPage({
        page: 0,
        pageSize: 5,
        statuses: ALL_RUNS_ACTIVE_STATUSES,
        filters: {},
      })
    );

    expect(executionsService.getAllExecutions).toHaveBeenCalledWith(
      "project-1"
    );
    expect(page.rows).toEqual([
      expect.objectContaining({
        id: "run-1",
        projectId: "project-1",
        processId: "run-1",
        status: ExecutionStatus.RUNNING,
        familyId: ExecutionFamily.VALIDATION_PROCESS,
        sourceDefinitionId: "def-1",
      }),
    ]);
  });

  it("defaults a missing status to NA when the row falls in the history statuses", async () => {
    const row = {
      id: "run-2",
      name: "run-2",
      status: undefined,
      familyId: ExecutionFamily.USER_STORY_BUILD_AND_TEST,
    } as AllExecutionSummary;
    const executionsService = {
      getAllExecutions: jest.fn(() => of([row])),
    };
    const result = await renderActivity(executionsService);
    await showHistory(result);

    const page = await firstValueFrom(
      tables(result)[1].loadPage({
        page: 0,
        pageSize: 10,
        statuses: ALL_RUNS_HISTORY_STATUSES,
        filters: {},
      })
    );

    expect(page.rows[0].status).toBe(ExecutionStatus.NA);
  });

  it("defaults the family to build-and-test when a row has none", async () => {
    const row = {
      id: "run-3",
      name: "run-3",
      status: ExecutionStatus.PASSED,
    } as unknown as AllExecutionSummary;
    const executionsService = {
      getAllExecutions: jest.fn(() => of([row])),
    };
    const result = await renderActivity(executionsService);
    await showHistory(result);

    const page = await firstValueFrom(
      tables(result)[1].loadPage({
        page: 0,
        pageSize: 10,
        statuses: ALL_RUNS_HISTORY_STATUSES,
        filters: {},
      })
    );

    expect(page.rows[0].familyId).toBe(
      ExecutionFamily.USER_STORY_BUILD_AND_TEST
    );
  });

  it("shows the Execution Name column with a text filter", async () => {
    const result = await renderActivity();

    const name = column(tables(result)[0], "name");
    expect(name.cellRenderer).toBe(AllRunsNameCellComponent);
    expect(name.cellRendererParams).toEqual({ projectId: "project-1" });
    expect(name.headerComponentParams).toEqual({
      filterKey: "namePhrase",
      filterType: "text",
      placeholder: "Filter name",
    });
  });

  it("scopes the active table's Status column options to in-flight statuses", async () => {
    const result = await renderActivity();

    const status = column(tables(result)[0], "status");
    expect(status.cellRenderer).toBe(AllRunsStatusCellComponent);
    expect(status.headerComponentParams).toEqual({
      filterKey: "statuses",
      filterType: "multiselect",
      options: ACTIVE_STATUS_OPTIONS,
    });
  });

  it("scopes the history table's Status column options to terminal statuses", async () => {
    const result = await renderActivity();

    await showHistory(result);

    const status = column(tables(result)[1], "status");
    expect(status.headerComponentParams).toEqual({
      filterKey: "statuses",
      filterType: "multiselect",
      options: HISTORY_STATUS_OPTIONS,
    });
  });

  it("shows the Official Status column with Official/Unofficial/N-A options", async () => {
    const result = await renderActivity();

    const officiality = column(tables(result)[0], "officiality");
    expect(officiality.headerComponentParams).toEqual({
      filterKey: "officiality",
      filterType: "multiselect",
      options: OFFICIALITY_OPTIONS,
    });
  });

  it("shows the Owner column with a text filter", async () => {
    const result = await renderActivity();

    const owner = column(tables(result)[0], "owner");
    expect(owner.headerComponentParams).toEqual({
      filterKey: "ownerPhrase",
      filterType: "text",
      placeholder: "Filter owner",
    });
  });

  it("formats populated start, end and expiry dates as locale strings", async () => {
    const result = await renderActivity();
    const table = tables(result)[0];
    const isoDate = "2026-01-01T00:00:00.000Z";
    const expected = new Date(isoDate).toLocaleString();

    ["startDate", "endDate", "expiryDate"].forEach((colId) => {
      const formatted = column(table, colId).valueFormatter!({
        value: isoDate,
      } as never);
      expect(formatted).toBe(expected);
    });
  });

  it("leaves start, end and expiry dates blank when missing", async () => {
    const result = await renderActivity();
    const table = tables(result)[0];

    ["startDate", "endDate", "expiryDate"].forEach((colId) => {
      const formatted = column(table, colId).valueFormatter!({
        value: null,
      } as never);
      expect(formatted).toBe("");
    });
  });

  it("shows the Days Extended column as sortable without a header filter", async () => {
    const result = await renderActivity();

    const daysExtended = column(tables(result)[0], "daysExtended");
    expect(daysExtended.sortable).toBe(true);
    expect(daysExtended.headerComponentParams).toBeUndefined();
  });

  it("links the Business Process Definition column to definition details", async () => {
    const result = await renderActivity();

    const definition = column(
      tables(result)[0],
      "businessProcessDefinitionName"
    );
    expect(definition.cellRenderer).toBe(DefinitionDetailsLinkCellComponent);
    expect(definition.cellRendererParams).toEqual({ projectId: "project-1" });
    expect(definition.headerComponentParams).toEqual({
      filterKey: "businessProcessDefinitionNamePhrase",
      filterType: "text",
      placeholder: "Filter definition",
    });
  });
});
