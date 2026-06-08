import { render, screen, waitFor, within } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { of, throwError } from "rxjs";
import { SingleSelectScenarioRunTableComponent } from "./single-select-scenario-run-table.component";
import { ScenarioRunService } from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";

ModuleRegistry.registerModules([AllCommunityModule]);

const mockScenarioRunService = {
  fetch: jest.fn(),
};

const mockToastMessageService = {
  showError: jest.fn(),
};

const MOCK_SCENARIO_RUNS = [
  {
    id: "run-1",
    startDate: "2024-01-01T10:00:00Z",
    commitId: "abc123def456",
    mxVersion: "1.0.0",
    mxBuildId: "build-1",
  },
  {
    id: "run-2",
    startDate: "2024-02-01T14:00:00Z",
    commitId: "xyz789ghi012",
    mxVersion: "",
    mxBuildId: "",
  },
];

const REQUIRED_INPUTS = {
  contextId: "ctx-1",
  subContextId: "sub-ctx-1",
  status: "PASSED",
  projectId: "project-1",
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(SingleSelectScenarioRunTableComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      { provide: ScenarioRunService, useValue: mockScenarioRunService },
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });
}

function getDataRows() {
  return screen
    .queryAllByRole("row")
    .filter((row) => within(row).queryAllByRole("gridcell").length > 0);
}

describe("SingleSelectScenarioRunTableComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScenarioRunService.fetch.mockReturnValue(of(MOCK_SCENARIO_RUNS));
  });

  describe("data fetching", () => {
    it("fetches scenario runs with context params", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(mockScenarioRunService.fetch).toHaveBeenCalledWith(
          "project-1",
          "ctx-1",
          "sub-ctx-1",
          ["PASSED"]
        );
      });
    });
  });

  describe("table display", () => {
    it("displays a row for each scenario run", async () => {
      await renderComponent();

      await waitFor(() => expect(getDataRows()).toHaveLength(2));
    });

    it("renders the Start Date column header", async () => {
      await renderComponent();

      expect(
        screen.getByRole("columnheader", { name: "Start Date" })
      ).toBeTruthy();
    });

    it("renders the Commit ID column header", async () => {
      await renderComponent();

      expect(
        screen.getByRole("columnheader", { name: "Commit ID" })
      ).toBeTruthy();
    });

    it("renders the MX Version column header", async () => {
      await renderComponent();

      expect(
        screen.getByRole("columnheader", { name: "MX Version" })
      ).toBeTruthy();
    });

    it("renders the MX Build ID column header", async () => {
      await renderComponent();

      expect(
        screen.getByRole("columnheader", { name: "MX Build ID" })
      ).toBeTruthy();
    });

    it("shows dash for empty MX Version", async () => {
      await renderComponent();

      await waitFor(() => {
        const rows = getDataRows();
        const cells = within(rows[1]).getAllByRole("gridcell");
        expect(cells[3].textContent?.trim()).toBe("-");
      });
    });

    it("shows dash for empty MX Build ID", async () => {
      await renderComponent();

      await waitFor(() => {
        const rows = getDataRows();
        const cells = within(rows[1]).getAllByRole("gridcell");
        expect(cells[4].textContent?.trim()).toBe("-");
      });
    });

    it("shows MX Version value when present", async () => {
      await renderComponent();

      await waitFor(() => {
        const rows = getDataRows();
        const cells = within(rows[0]).getAllByRole("gridcell");
        expect(cells[3].textContent?.trim()).toBe("1.0.0");
      });
    });

    it("shows MX Build ID value when present", async () => {
      await renderComponent();

      await waitFor(() => {
        const rows = getDataRows();
        const cells = within(rows[0]).getAllByRole("gridcell");
        expect(cells[4].textContent?.trim()).toBe("build-1");
      });
    });

    it("shows empty overlay when no runs returned", async () => {
      mockScenarioRunService.fetch.mockReturnValue(of([]));

      await renderComponent();

      await waitFor(() =>
        expect(screen.getByText("No scenario runs")).toBeTruthy()
      );
    });
  });

  describe("radio selection", () => {
    it("renders a radio button for each row", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getAllByRole("radio")).toHaveLength(2);
      });
    });

    it("emits selected scenario run ID when radio is clicked", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const emitSpy = jest.fn();
      fixture.componentInstance.selectedScenarioRunId.subscribe(emitSpy);

      await waitFor(() => expect(screen.getAllByRole("radio")).toHaveLength(2));

      await user.click(screen.getAllByRole("radio")[0]);

      expect(emitSpy).toHaveBeenCalledWith("run-1");
    });

    it("only one radio button is selected at a time", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await waitFor(() => expect(screen.getAllByRole("radio")).toHaveLength(2));

      await user.click(screen.getAllByRole("radio")[0]);

      await waitFor(() => {
        const radios = screen.getAllByRole("radio");
        expect(radios[0].checked).toBe(true);
      });

      await user.click(screen.getAllByRole("radio")[1]);

      await waitFor(() => {
        const radios = screen.getAllByRole("radio");
        expect(radios[0].checked).toBe(false);
      });
    });

    it("clears selection when input IDs change and selected run is no longer in the list", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await waitFor(() => expect(screen.getAllByRole("radio")).toHaveLength(2));

      await user.click(screen.getAllByRole("radio")[0]);

      await waitFor(() => {
        const radios = screen.getAllByRole("radio");
        expect(radios[0].checked).toBe(true);
      });

      mockScenarioRunService.fetch.mockReturnValue(of([MOCK_SCENARIO_RUNS[1]]));
      fixture.componentRef.setInput("contextId", "ctx-2");

      await waitFor(() => {
        const radios = screen.getAllByRole("radio");
        expect(radios[0].checked).toBe(false);
      });
    });
  });

  describe("error handling", () => {
    it("shows error toast when fetch fails", async () => {
      mockScenarioRunService.fetch.mockReturnValue(
        throwError(() => new Error("Network error"))
      );

      await renderComponent();

      await waitFor(() => {
        expect(mockToastMessageService.showError).toHaveBeenCalledWith(
          "Failed to load scenario runs"
        );
      });
    });

    it("shows empty table after fetch error", async () => {
      mockScenarioRunService.fetch.mockReturnValue(
        throwError(() => new Error("Network error"))
      );

      await renderComponent();

      await waitFor(() =>
        expect(screen.getByText("No scenario runs")).toBeTruthy()
      );
    });
  });
});
