import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, throwError } from "rxjs";
import { ModuleRegistry } from "ag-grid-community";
import { AllEnterpriseModule } from "ag-grid-enterprise";
import type { ColDef } from "ag-grid-enterprise";
import { AgGridAngular } from "ag-grid-angular";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { ActivityRunsTableComponent } from "./activity-runs-table.component";
import { ActivityRunsHeaderFilterComponent } from "./header-filter/activity-runs-header-filter.component";
import type {
  ActivityRunsActionsColumn,
  ActivityRunsHeaderFilterParams,
  ActivityRunsPage,
  ActivityRunsPageRequest,
} from "./activity-runs-table.types";

ModuleRegistry.registerModules([AllEnterpriseModule]);

interface RunRow {
  name: string;
  status: string;
}

const mockToastMessageService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const COLUMN_DEFS: ColDef<RunRow>[] = [
  { field: "name", headerName: "Name", colId: "name", sortable: true },
  { field: "status", headerName: "Status", colId: "status" },
];

const FILTER_COLUMN_DEFS: ColDef<RunRow>[] = [
  {
    field: "name",
    headerName: "Name",
    colId: "name",
    headerComponent: ActivityRunsHeaderFilterComponent,
    headerComponentParams: {
      filterKey: "namePhrase",
      filterType: "text",
    } as ActivityRunsHeaderFilterParams,
  },
  { field: "status", headerName: "Status", colId: "status" },
];

const PAGE: ActivityRunsPage<RunRow> = {
  rows: [
    { name: "run-a", status: "RUNNING" },
    { name: "run-b", status: "PENDING_INPUT" },
  ],
  total: 2,
};

async function renderComponent(
  overrides: {
    statuses?: string[];
    pageSize?: number;
    ownerPhrase?: string;
    columnDefs?: ColDef<RunRow>[];
    actionsColumn?: ActivityRunsActionsColumn<RunRow>;
    loadPage?: (req: ActivityRunsPageRequest) => ReturnType<typeof of>;
  } = {}
) {
  const loadPage = overrides.loadPage ?? jest.fn().mockReturnValue(of(PAGE));

  const result = await render(ActivityRunsTableComponent<RunRow>, {
    imports: [AgGridAngular],
    inputs: {
      projectId: "project-1",
      columnDefs: overrides.columnDefs ?? COLUMN_DEFS,
      statuses: overrides.statuses ?? ["RUNNING", "PENDING_INPUT", "ABORTING"],
      pageSize: overrides.pageSize ?? 10,
      ownerPhrase: overrides.ownerPhrase,
      actionsColumn: overrides.actionsColumn,
      loadPage,
    },
    providers: [
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });

  return { ...result, loadPage };
}

describe("ActivityRunsTableComponent", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }),
    });
  });

  beforeEach(() => jest.clearAllMocks());

  afterEach(() => {
    document
      .querySelectorAll(".p-popover, .p-overlay, .p-connected-overlay")
      .forEach((el) => el.remove());
  });

  it("renders the grid with the consumer column headers", async () => {
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByRole("columnheader", { name: /Name/ })).toBeTruthy();
      expect(screen.getByRole("columnheader", { name: /Status/ })).toBeTruthy();
    });
  });

  it("renders a grid cell for each loaded run", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(screen.getByRole("gridcell", { name: "run-a" })).toBeTruthy()
    );
    expect(screen.getByRole("gridcell", { name: "run-b" })).toBeTruthy();
  });

  it("requests the first page with the configured page size and statuses", async () => {
    const { loadPage } = await renderComponent({
      statuses: ["RUNNING", "ABORTING"],
      pageSize: 5,
    });

    await waitFor(() => {
      expect(loadPage).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 0,
          pageSize: 5,
          statuses: ["RUNNING", "ABORTING"],
          filters: {},
        })
      );
    });
  });

  it("passes the ownerPhrase through to the loader", async () => {
    const { loadPage } = await renderComponent({ ownerPhrase: "jdoe" });

    await waitFor(() => {
      expect(loadPage).toHaveBeenCalledWith(
        expect.objectContaining({ ownerPhrase: "jdoe" })
      );
    });
  });

  it("reloads with the filter value when a header filter is applied", async () => {
    const user = userEvent.setup();
    const { loadPage } = await renderComponent({
      columnDefs: FILTER_COLUMN_DEFS,
    });

    await waitFor(() => expect(loadPage).toHaveBeenCalled());
    loadPage.mockClear();

    await user.click(screen.getByRole("button", { name: "Filter Name" }));
    await user.type(await screen.findByRole("textbox"), "abc");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => {
      expect(loadPage).toHaveBeenCalledWith(
        expect.objectContaining({ filters: { namePhrase: "abc" } })
      );
    });
  });

  it("clears the filter when the header filter is cleared", async () => {
    const user = userEvent.setup();
    const { loadPage } = await renderComponent({
      columnDefs: FILTER_COLUMN_DEFS,
    });

    await waitFor(() => expect(loadPage).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: "Filter Name" }));
    await user.type(await screen.findByRole("textbox"), "abc");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() =>
      expect(loadPage).toHaveBeenLastCalledWith(
        expect.objectContaining({ filters: { namePhrase: "abc" } })
      )
    );

    await user.click(screen.getByRole("button", { name: "Filter Name" }));
    await user.click(screen.getByRole("button", { name: "Clear" }));

    await waitFor(() =>
      expect(loadPage).toHaveBeenLastCalledWith(
        expect.objectContaining({ filters: {} })
      )
    );
  });

  it("renders a sticky pinned-right Actions column header when configured", async () => {
    const actionsColumn: ActivityRunsActionsColumn<RunRow> = {
      cellRenderer: () => "<span></span>",
      headerName: "Actions",
    };

    await renderComponent({ actionsColumn });

    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: /Actions/ })).toBeTruthy()
    );
    expect(
      document.querySelector(".ag-pinned-right-header")?.textContent
    ).toContain("Actions");
  });

  it("does not render an Actions column header when none is configured", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: /Name/ })).toBeTruthy()
    );
    expect(screen.queryByRole("columnheader", { name: /Actions/ })).toBeNull();
  });

  it("shows an error toast when the loader fails", async () => {
    const { loadPage } = await renderComponent({
      loadPage: jest.fn().mockReturnValue(throwError(() => new Error("boom"))),
    });

    await waitFor(() => expect(loadPage).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "Couldn't load runs"
      )
    );
  });
});
