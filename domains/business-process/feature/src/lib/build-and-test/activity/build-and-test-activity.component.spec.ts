import { render, screen, waitFor } from "@testing-library/angular";
import type { RenderResult } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { firstValueFrom, of, throwError } from "rxjs";
import { Button } from "primeng/button";
import type { ColDef } from "ag-grid-enterprise";
import { AuthenticationService } from "@mxflow/core/auth";
import {
  BuildAndTestExecutionsService,
  SharedJiraDetailsService,
} from "@mxevolve/domains/business-process/data-access";
import {
  ActivityRunsTableComponent,
  MyRunsToggleComponent,
} from "@mxevolve/domains/business-process/widget";
import {
  BuildAndTestTemplatesDialogComponent,
  RunActionsCellComponent,
} from "@mxevolve/domains/business-process/composite-widget";
import { DefinitionDetailsLinkCellComponent } from "../../shared/definition-details-link/definition-details-link-cell.component";
import { BuildAndTestActivityComponent } from "./build-and-test-activity.component";
import {
  BT_ACTIVE_STATUSES,
  BT_HISTORY_STATUSES,
} from "./build-and-test-activity.queries";

const JIRA_BASE_URL = "https://jira.example.com";
const authenticationServiceMock = {
  getUsername: jest.fn(() => "alice"),
};

const MOCK_IMPORTS = [
  Button,
  MockComponent(ActivityRunsTableComponent),
  MockComponent(MyRunsToggleComponent),
  MockComponent(BuildAndTestTemplatesDialogComponent),
];

function jiraDetailsMock(): Pick<SharedJiraDetailsService, "getJiraDetails"> {
  return {
    getJiraDetails: () =>
      of({
        projectId: "project-1",
        jiraProjectId: "JP",
        jiraBaseUrl: JIRA_BASE_URL,
      }),
  };
}

type ActivityRender = RenderResult<BuildAndTestActivityComponent>;

async function renderActivity(
  executionsService: Partial<BuildAndTestExecutionsService> = {}
): Promise<ActivityRender> {
  return render(BuildAndTestActivityComponent, {
    inputs: { projectId: "project-1" },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: BuildAndTestExecutionsService, useValue: executionsService },
    ],
    providers: [
      { provide: SharedJiraDetailsService, useValue: jiraDetailsMock() },
      { provide: AuthenticationService, useValue: authenticationServiceMock },
    ],
  });
}

function tables(result: ActivityRender): ActivityRunsTableComponent[] {
  return ngMocks
    .findAll(result.fixture, ActivityRunsTableComponent)
    .map((debugElement) => debugElement.componentInstance);
}

function myBuildsToggle(result: ActivityRender): MyRunsToggleComponent {
  return ngMocks.find(result.fixture, MyRunsToggleComponent).componentInstance;
}

function column(table: ActivityRunsTableComponent, colId: string): ColDef {
  return (table.columnDefs as unknown as ColDef[]).find(
    (col) => col.colId === colId
  ) as ColDef;
}

describe("BuildAndTestActivityComponent", () => {
  it("renders the active runs table scoped to the in-flight statuses", async () => {
    const result = await renderActivity();

    expect(
      document.querySelector("mxevolve-activity-runs-table")
    ).not.toBeNull();
    const active = tables(result)[0];
    expect(active.statuses).toEqual(BT_ACTIVE_STATUSES);
    expect(active.pageSize).toBe(5);
    expect(active.projectId).toBe("project-1");
  });

  it("gives the active table a live (non-terminal) actions column", async () => {
    const result = await renderActivity();

    const actions = tables(result)[0].actionsColumn;
    expect(actions?.cellRenderer).toBe(RunActionsCellComponent);
    expect(actions?.cellRendererParams).toEqual({
      onRepush: expect.any(Function),
    });
  });

  it("hides the history table until Show History is toggled", async () => {
    const result = await renderActivity();

    expect(tables(result)).toHaveLength(1);

    await userEvent.click(
      screen.getByRole("button", { name: /show history/i })
    );

    await waitFor(() => expect(tables(result)).toHaveLength(2));
  });

  it("scopes the history table to the terminal statuses with ten rows per page", async () => {
    const result = await renderActivity();

    await userEvent.click(
      screen.getByRole("button", { name: /show history/i })
    );

    await waitFor(() => expect(tables(result)).toHaveLength(2));
    const history = tables(result)[1];
    expect(history.statuses).toEqual(BT_HISTORY_STATUSES);
    expect(history.pageSize).toBe(10);
  });

  it("renders the history actions column as terminal so abort is non-abortable", async () => {
    const result = await renderActivity();

    await userEvent.click(
      screen.getByRole("button", { name: /show history/i })
    );

    await waitFor(() => expect(tables(result)).toHaveLength(2));
    const actions = tables(result)[1].actionsColumn;
    expect(actions?.cellRenderer).toBe(RunActionsCellComponent);
    expect(actions?.cellRendererParams).toEqual({
      terminal: true,
      onRepush: expect.any(Function),
    });
  });

  it("scopes both tables to the user and keeps the Owner column visible", async () => {
    const result = await renderActivity();

    await userEvent.click(
      screen.getByRole("button", { name: /show history/i })
    );
    await waitFor(() => expect(tables(result)).toHaveLength(2));

    myBuildsToggle(result).ownerPhrase.emit("alice");

    await waitFor(() => {
      tables(result).forEach((table) =>
        expect(table.ownerPhrase).toBe("alice")
      );
    });
    tables(result).forEach((table) =>
      expect(column(table, "owner").hide).toBeUndefined()
    );
  });

  it("clears the owner scope without hiding the Owner column", async () => {
    const result = await renderActivity();

    myBuildsToggle(result).ownerPhrase.emit("alice");
    await waitFor(() => expect(tables(result)[0].ownerPhrase).toBe("alice"));

    myBuildsToggle(result).ownerPhrase.emit(undefined);

    await waitFor(() => expect(tables(result)[0].ownerPhrase).toBeUndefined());
    expect(column(tables(result)[0], "owner").hide).toBeUndefined();
  });

  it("links user stories with the once-resolved Jira base url", async () => {
    const result = await renderActivity();

    await waitFor(() => {
      const userStories = column(tables(result)[0], "userStoryIds");
      expect(userStories.cellRendererParams).toEqual({
        jiraBaseUrl: JIRA_BASE_URL,
      });
    });
  });

  it("uses plain user-story text when Jira details cannot load", async () => {
    const result = await render(BuildAndTestActivityComponent, {
      inputs: { projectId: "project-1" },
      componentImports: MOCK_IMPORTS,
      componentProviders: [
        { provide: BuildAndTestExecutionsService, useValue: {} },
      ],
      providers: [
        { provide: AuthenticationService, useValue: authenticationServiceMock },
        {
          provide: SharedJiraDetailsService,
          useValue: { getJiraDetails: () => throwError(() => new Error()) },
        },
      ],
    });

    await waitFor(() => {
      expect(
        column(tables(result)[0], "userStoryIds").cellRendererParams
      ).toEqual({ jiraBaseUrl: "" });
    });
  });

  it("loads a page through the execution service and enriches rows for actions", async () => {
    const executionsService = {
      getBuildAndTestExecutions: jest.fn(() =>
        of({ content: [{ id: "run-1", status: undefined }], totalElements: 1 })
      ),
    };
    const result = await renderActivity(executionsService);

    const page = await firstValueFrom(
      tables(result)[0].loadPage({
        page: 0,
        pageSize: 5,
        statuses: BT_ACTIVE_STATUSES,
      })
    );

    expect(executionsService.getBuildAndTestExecutions).toHaveBeenCalled();
    expect(page).toEqual({
      total: 1,
      rows: [
        expect.objectContaining({
          id: "run-1",
          projectId: "project-1",
          processId: "run-1",
          status: "NA",
        }),
      ],
    });
  });

  it("formats date and duration columns for complete and incomplete runs", async () => {
    const result = await renderActivity();
    const table = tables(result)[0];
    const startDate = column(table, "startDate");
    const duration = column(table, "duration");

    expect(startDate.valueFormatter!({ value: null })).toBe("");
    expect(
      duration.valueGetter!({
        data: {
          startDate: "2026-01-01T00:00:00.000Z",
          endDate: "2026-01-01T01:05:00.000Z",
        },
      } as never)
    ).toBe("1h 5m");
    expect(duration.valueGetter!({ data: {} } as never)).toBe("");
    expect(
      duration.valueGetter!({
        data: {
          startDate: "2026-01-01T01:00:00.000Z",
          endDate: "2026-01-01T00:00:00.000Z",
        },
      } as never)
    ).toBe("");
  });

  it("shows the status column", async () => {
    const result = await renderActivity();

    expect(column(tables(result)[0], "status").headerName).toBe("Status");
  });

  it("uses the shared definition details link cell", async () => {
    const result = await renderActivity();

    expect(column(tables(result)[0], "businessProcessDefinitionName")).toEqual(
      expect.objectContaining({
        cellRenderer: DefinitionDetailsLinkCellComponent,
        cellRendererParams: { projectId: "project-1" },
      })
    );
  });

  it("shows a Run action", async () => {
    await renderActivity();

    expect(screen.getByRole("button", { name: "Run" })).toBeInTheDocument();
  });

  it("renders the Run action without an icon", async () => {
    await renderActivity();

    expect(
      screen.getByRole("button", { name: "Run" }).querySelector(".pi")
    ).toBeNull();
  });

  it("opens the templates dialog when Run is clicked", async () => {
    const result = await renderActivity();

    const dialog = ngMocks.find(
      result.fixture,
      BuildAndTestTemplatesDialogComponent
    ).componentInstance;
    const openSpy = jest.spyOn(dialog, "open");

    await userEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(openSpy).toHaveBeenCalled();
  });

  it("opens the requested execution when a row is eligible for repush", async () => {
    const result = await renderActivity();
    const dialog = ngMocks.find(
      result.fixture,
      BuildAndTestTemplatesDialogComponent
    ).componentInstance;
    const openRepushSpy = jest.spyOn(dialog, "openRepush");
    const onRepush = tables(result)[0].actionsColumn?.cellRendererParams
      ?.onRepush as (event: { processId: string }) => void;

    onRepush({ processId: "run-1" });

    expect(openRepushSpy).toHaveBeenCalledWith("run-1");
  });
});
