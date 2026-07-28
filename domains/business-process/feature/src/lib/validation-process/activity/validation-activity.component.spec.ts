import { render, screen, waitFor } from "@testing-library/angular";
import type { RenderResult } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { firstValueFrom, of, throwError } from "rxjs";
import { Button } from "primeng/button";
import type { ColDef } from "ag-grid-enterprise";
import {
  BusinessProcessDefinitionService,
  ValidationProcessListingService,
} from "@mxevolve/domains/business-process/data-access";
import {
  ActivityRunsTableComponent,
  MyRunsToggleComponent,
} from "@mxevolve/domains/business-process/widget";
import {
  RunActionsCellComponent,
  ValidationTemplatesDialogComponent,
} from "@mxevolve/domains/business-process/composite-widget";
import { DefinitionDetailsLinkCellComponent } from "../../shared/definition-details-link/definition-details-link-cell.component";
import { ValidationActivityComponent } from "./validation-activity.component";
import {
  VAL_ACTIVE_STATUSES,
  VAL_HISTORY_STATUSES,
} from "./validation-activity.queries";

const MOCK_IMPORTS = [
  Button,
  MockComponent(ActivityRunsTableComponent),
  MockComponent(MyRunsToggleComponent),
  MockComponent(ValidationTemplatesDialogComponent),
];

const definitionServiceMock = {
  getBusinessProcessDefinitions: jest.fn(() => of([])),
};

type ActivityRender = RenderResult<ValidationActivityComponent>;

const VALIDATION_DEFINITIONS = [
  {
    id: "validation-1",
    name: "First Validation",
    processName: "Master",
    family: { id: "master-validation" },
    providedInputs: [],
  },
  {
    id: "validation-1",
    name: "Duplicate Validation",
    processName: "Master",
    family: { id: "master-validation" },
    providedInputs: [],
  },
  {
    id: "validation-2",
    name: "Second Validation",
    processName: "Incremental",
    family: { id: "master-validation" },
    providedInputs: [],
  },
];

async function renderActivity(
  definitions = VALIDATION_DEFINITIONS,
  listingService: Partial<ValidationProcessListingService> = {}
): Promise<ActivityRender> {
  definitionServiceMock.getBusinessProcessDefinitions.mockReturnValue(
    of(definitions)
  );
  return render(ValidationActivityComponent, {
    inputs: { projectId: "project-1" },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: ValidationProcessListingService, useValue: listingService },
      {
        provide: BusinessProcessDefinitionService,
        useValue: definitionServiceMock,
      },
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

describe("ValidationActivityComponent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the active runs table scoped to the in-flight statuses", async () => {
    const result = await renderActivity();

    expect(
      document.querySelector("mxevolve-activity-runs-table")
    ).not.toBeNull();
    const active = tables(result)[0];
    expect(active.statuses).toEqual(VAL_ACTIVE_STATUSES);
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
    expect(history.statuses).toEqual(VAL_HISTORY_STATUSES);
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

  it("renders the validation columns in the legacy order", async () => {
    const result = await renderActivity();

    const colIds = (tables(result)[0].columnDefs as unknown as ColDef[]).map(
      (col) => col.colId
    );
    expect(colIds).toEqual([
      "name",
      "status",
      "officiality",
      "businessProcessQualityLevel",
      "owner",
      "startDate",
      "endDate",
      "expiryDate",
      "daysExtended",
      "definitionName",
      "processName",
    ]);
  });

  it("uses the shared definition details link cell", async () => {
    const result = await renderActivity();

    expect(column(tables(result)[0], "definitionName")).toEqual(
      expect.objectContaining({
        cellRenderer: DefinitionDetailsLinkCellComponent,
        cellRendererParams: { projectId: "project-1" },
      })
    );
  });

  it("makes the date columns sortable", async () => {
    const result = await renderActivity();

    const table = tables(result)[0];
    expect(column(table, "startDate").sortable).toBe(true);
    expect(column(table, "expiryDate").sortable).toBe(true);
    expect(column(table, "daysExtended").sortable).toBe(true);
  });

  it("derives de-duplicated definition and process-name filter options", async () => {
    const result = await renderActivity();

    await waitFor(() => {
      expect(
        column(tables(result)[0], "definitionName").headerComponentParams
      ).toMatchObject({
        options: [
          { label: "First Validation", value: "validation-1" },
          { label: "Second Validation", value: "validation-2" },
        ],
      });
    });
    expect(
      column(tables(result)[0], "processName").headerComponentParams
    ).toMatchObject({
      options: [
        { label: "Master", value: "Master" },
        { label: "Incremental", value: "Incremental" },
      ],
    });
  });

  it("falls back to empty definition filter options when definitions cannot load", async () => {
    definitionServiceMock.getBusinessProcessDefinitions.mockReturnValue(
      throwError(() => new Error("unavailable"))
    );
    const result = await renderActivity([]);

    await waitFor(() => {
      expect(
        column(tables(result)[0], "definitionName").headerComponentParams
      ).toMatchObject({ options: [] });
    });
  });

  it("loads a page through the listing service and enriches rows for actions", async () => {
    const listingService = {
      getValidationProcessExecutions: jest.fn(() =>
        of({ executions: [{ id: "run-1", status: undefined }], total: 1 })
      ),
    };
    const result = await renderActivity([], listingService);

    const page = await firstValueFrom(
      tables(result)[0].loadPage({
        page: 0,
        pageSize: 5,
        statuses: VAL_ACTIVE_STATUSES,
      })
    );

    expect(listingService.getValidationProcessExecutions).toHaveBeenCalled();
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

  it("opens the templates dialog when Run is clicked", async () => {
    const result = await renderActivity();

    const dialog = ngMocks.find(
      result.fixture,
      ValidationTemplatesDialogComponent
    ).componentInstance;
    const openSpy = jest.spyOn(dialog, "open");

    await userEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(openSpy).toHaveBeenCalled();
  });

  it("opens the requested execution when a row is eligible for repush", async () => {
    const result = await renderActivity();
    const dialog = ngMocks.find(
      result.fixture,
      ValidationTemplatesDialogComponent
    ).componentInstance;
    const openRepushSpy = jest.spyOn(dialog, "openRepush");
    const onRepush = tables(result)[0].actionsColumn?.cellRendererParams
      ?.onRepush as (event: { processId: string }) => void;

    onRepush({ processId: "run-1" });

    expect(openRepushSpy).toHaveBeenCalledWith("run-1");
  });
});
