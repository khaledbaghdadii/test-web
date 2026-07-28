import { render, screen, waitFor } from "@testing-library/angular";
import type { RenderResult } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { firstValueFrom, of, throwError } from "rxjs";
import { Button } from "primeng/button";
import type { ColDef } from "ag-grid-enterprise";
import {
  BusinessProcessDefinitionService,
  UpgradeProcessListingService,
} from "@mxevolve/domains/business-process/data-access";
import {
  ActivityRunsTableComponent,
  MyRunsToggleComponent,
} from "@mxevolve/domains/business-process/widget";
import {
  RunActionsCellComponent,
  UpgradeTemplatesDialogComponent,
} from "@mxevolve/domains/business-process/composite-widget";
import { DefinitionDetailsLinkCellComponent } from "../../shared/definition-details-link/definition-details-link-cell.component";
import { UpgradeActivityComponent } from "./upgrade-activity.component";
import {
  UPG_ACTIVE_STATUSES,
  UPG_HISTORY_STATUSES,
} from "./upgrade-activity.queries";

const MOCK_IMPORTS = [
  Button,
  MockComponent(ActivityRunsTableComponent),
  MockComponent(MyRunsToggleComponent),
  MockComponent(UpgradeTemplatesDialogComponent),
];

const definitionServiceMock = {
  getBusinessProcessDefinitions: jest.fn(() => of([])),
};

type ActivityRender = RenderResult<UpgradeActivityComponent>;

const UPGRADE_DEFINITIONS = [
  {
    id: "upgrade-1",
    name: "First Upgrade",
    processName: "Greening",
    family: { id: "binary-upgrade" },
    providedInputs: [],
  },
  {
    id: "upgrade-1",
    name: "Duplicate Upgrade",
    processName: "Greening",
    family: { id: "binary-upgrade" },
    providedInputs: [],
  },
  {
    id: "upgrade-2",
    name: "Second Upgrade",
    processName: "Patch",
    family: { id: "binary-upgrade" },
    providedInputs: [],
  },
  {
    id: "other-1",
    name: "Other family",
    processName: "Other",
    family: { id: "master-validation" },
    providedInputs: [],
  },
];

async function renderActivity(
  definitions = UPGRADE_DEFINITIONS,
  listingService: Partial<UpgradeProcessListingService> = {}
): Promise<ActivityRender> {
  definitionServiceMock.getBusinessProcessDefinitions.mockReturnValue(
    of(definitions)
  );
  return render(UpgradeActivityComponent, {
    inputs: { projectId: "project-1" },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: UpgradeProcessListingService, useValue: listingService },
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

describe("UpgradeActivityComponent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the active runs table scoped to the in-flight statuses", async () => {
    const result = await renderActivity();

    expect(
      document.querySelector("mxevolve-activity-runs-table")
    ).not.toBeNull();
    const active = tables(result)[0];
    expect(active.statuses).toEqual(UPG_ACTIVE_STATUSES);
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
    expect(history.statuses).toEqual(UPG_HISTORY_STATUSES);
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

  it("renders the upgrade columns in the legacy order", async () => {
    const result = await renderActivity();

    const colIds = (tables(result)[0].columnDefs as unknown as ColDef[]).map(
      (col) => col.colId
    );
    expect(colIds).toEqual([
      "name",
      "status",
      "officiality",
      "businessProcessQualityLevel",
      "parentMxArchivalBranch",
      "mxVersion",
      "mxBuildId",
      "configurationBranchName",
      "owner",
      "startDate",
      "endDate",
      "expiryDate",
      "daysExtended",
      "duration",
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

  it("makes the start, expiry and days-extended columns sortable", async () => {
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
          { label: "First Upgrade", value: "upgrade-1" },
          { label: "Second Upgrade", value: "upgrade-2" },
        ],
      });
    });
    expect(
      column(tables(result)[0], "processName").headerComponentParams
    ).toMatchObject({
      options: [
        { label: "Greening", value: "Greening" },
        { label: "Patch", value: "Patch" },
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
      getBinaryUpgradeExecutions: jest.fn(() =>
        of({ content: [{ id: "run-1", status: undefined }], totalElements: 1 })
      ),
    };
    const result = await renderActivity([], listingService);

    const page = await firstValueFrom(
      tables(result)[0].loadPage({
        page: 0,
        pageSize: 5,
        statuses: UPG_ACTIVE_STATUSES,
      })
    );

    expect(listingService.getBinaryUpgradeExecutions).toHaveBeenCalled();
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
      UpgradeTemplatesDialogComponent
    ).componentInstance;
    const openSpy = jest.spyOn(dialog, "open");

    await userEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(openSpy).toHaveBeenCalled();
  });

  it("opens the requested execution when a row is eligible for repush", async () => {
    const result = await renderActivity();
    const dialog = ngMocks.find(
      result.fixture,
      UpgradeTemplatesDialogComponent
    ).componentInstance;
    const openRepushSpy = jest.spyOn(dialog, "openRepush");
    const onRepush = tables(result)[0].actionsColumn?.cellRendererParams
      ?.onRepush as (event: { processId: string }) => void;

    onRepush({ processId: "run-1" });

    expect(openRepushSpy).toHaveBeenCalledWith("run-1");
  });
});
