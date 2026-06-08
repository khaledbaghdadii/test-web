import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { of, Subject, throwError } from "rxjs";
import { MultiSelectScenarioRunTableComponent } from "./multi-select-scenario-run-table.component";
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
    name: "Login Scenario",
    status: "Passed",
    startDate: "2024-01-01T10:00:00Z",
    commitId: "abc123",
    mxVersion: "1.0.0",
    mxBuildId: "build-1",
  },
  {
    id: "run-2",
    name: "Payment Scenario",
    status: "Failed",
    startDate: "2024-02-01T14:00:00Z",
    commitId: "xyz789",
    mxVersion: "",
    mxBuildId: "",
  },
  {
    id: "run-3",
    name: "Checkout Scenario",
    status: "Underway",
    startDate: "2024-03-01T09:00:00Z",
    commitId: "def456",
    mxVersion: "2.0.0",
    mxBuildId: "build-3",
  },
];

const REQUIRED_INPUTS = {
  projectId: "project-1",
  scenarioRunIds: ["run-1", "run-2", "run-3"],
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(MultiSelectScenarioRunTableComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      { provide: ScenarioRunService, useValue: mockScenarioRunService },
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });
}

describe("MultiSelectScenarioRunTableComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScenarioRunService.fetch.mockReturnValue(of(MOCK_SCENARIO_RUNS));
  });

  describe("data fetching", () => {
    it("fetches scenario runs with project ID and scenario run IDs", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(mockScenarioRunService.fetch).toHaveBeenCalledWith(
          "project-1",
          undefined,
          undefined,
          undefined,
          ["run-1", "run-2", "run-3"]
        );
      });
    });

    it("does not call fetch when scenarioRunIds is empty", async () => {
      await renderComponent({ scenarioRunIds: [] });

      await waitFor(() => {
        expect(screen.getByText("No scenario runs")).toBeTruthy();
      });
      expect(mockScenarioRunService.fetch).not.toHaveBeenCalled();
    });

    it("shows loading state while data is being fetched", async () => {
      const subject = new Subject();
      mockScenarioRunService.fetch.mockReturnValue(subject.asObservable());
      const { fixture } = await renderComponent();

      expect(fixture.componentInstance.isLoading()).toBe(true);

      subject.next(MOCK_SCENARIO_RUNS);
      subject.complete();
      fixture.detectChanges();

      await waitFor(() => {
        expect(fixture.componentInstance.isLoading()).toBe(false);
      });
    });
  });

  describe("table display", () => {
    it("displays all scenario run names", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Login Scenario")).toBeTruthy();
      });
      expect(screen.getByText("Payment Scenario")).toBeTruthy();
      expect(screen.getByText("Checkout Scenario")).toBeTruthy();
    });

    it("renders the Name column header", async () => {
      await renderComponent();

      expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
    });

    it("renders the Status column header", async () => {
      await renderComponent();

      expect(screen.getByRole("columnheader", { name: "Status" })).toBeTruthy();
    });

    it("shows empty overlay when no runs returned", async () => {
      mockScenarioRunService.fetch.mockReturnValue(of([]));

      await renderComponent();

      await waitFor(() =>
        expect(screen.getByText("No scenario runs")).toBeTruthy()
      );
    });
  });

  describe("checkbox selection", () => {
    it("renders a checkbox for each row plus a header checkbox", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getAllByRole("checkbox")).toHaveLength(4);
      });
    });

    it("emits selected scenario run IDs when a checkbox is clicked", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const emitSpy = jest.fn();
      fixture.componentInstance.selectedScenarioRunIds.subscribe(emitSpy);

      await waitFor(() =>
        expect(screen.getAllByRole("checkbox")).toHaveLength(4)
      );

      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[1]);

      expect(emitSpy).toHaveBeenCalledWith(["run-1"]);
    });

    it("allows selecting multiple rows", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const emitSpy = jest.fn();
      fixture.componentInstance.selectedScenarioRunIds.subscribe(emitSpy);

      await waitFor(() =>
        expect(screen.getAllByRole("checkbox")).toHaveLength(4)
      );

      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);

      expect(emitSpy).toHaveBeenLastCalledWith(["run-1", "run-2"]);
    });

    it("selects all rows when header checkbox is clicked", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const emitSpy = jest.fn();
      fixture.componentInstance.selectedScenarioRunIds.subscribe(emitSpy);

      await waitFor(() =>
        expect(screen.getAllByRole("checkbox")).toHaveLength(4)
      );

      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);

      expect(emitSpy).toHaveBeenLastCalledWith(
        expect.arrayContaining(["run-1", "run-2", "run-3"])
      );
    });

    it("deselects a row when its checkbox is clicked again", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const emitSpy = jest.fn();
      fixture.componentInstance.selectedScenarioRunIds.subscribe(emitSpy);

      await waitFor(() =>
        expect(screen.getAllByRole("checkbox")).toHaveLength(4)
      );

      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[1]);
      await user.click(checkboxes[1]);

      expect(emitSpy).toHaveBeenLastCalledWith([]);
    });
  });

  describe("sorting", () => {
    it("has sorting enabled on the Name column", async () => {
      const { fixture } = await renderComponent();

      const nameColDef = fixture.componentInstance.columnDefinitions.find(
        (col) => col.field === "name"
      );

      expect(nameColDef?.sortable).toBe(true);
    });

    it("has sorting enabled on the Status column", async () => {
      const { fixture } = await renderComponent();

      const statusColDef = fixture.componentInstance.columnDefinitions.find(
        (col) => col.field === "status"
      );

      expect(statusColDef?.sortable).toBe(true);
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
