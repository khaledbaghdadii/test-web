import { render, screen, waitFor, within } from "@testing-library/angular";
import { provideRouter } from "@angular/router";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { ScenarioRunTableComponent } from "./scenario-run-table.component";
import { ScenarioRunTableViewModel } from "./scenario-run-table.view-model";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";

ModuleRegistry.registerModules([AllCommunityModule]);

const REQUIRED_INPUTS = {
  scenarioRuns: [] as ScenarioRunTableViewModel[],
  projectId: "project-1",
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(ScenarioRunTableComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    providers: [provideRouter([])],
  });
}

function getDataRows() {
  return screen
    .queryAllByRole("row")
    .filter((row) => within(row).queryAllByRole("gridcell").length > 0);
}

const MOCK_SCENARIO_RUN: ScenarioRunTableViewModel = {
  id: "run-1",
  name: "Regression Suite",
  status: ScenarioRunStatus.PASSED,
  environmentStatus: EnvironmentStatus.READY,
  startDate: "2024-01-01T10:00:00Z",
  endDate: "2024-01-01T11:30:45Z",
  commitId: "abc123def456xyz",
  mxVersion: "1.0.0",
  mxBuildId: "build-123",
  assigneeId: "user-1",
  assigneeDisplayName: "John Doe",
  assigneeEmail: "john.doe@example.com",
};

const MOCK_SCENARIO_RUN_MINIMAL: ScenarioRunTableViewModel = {
  id: "run-2",
  name: "Smoke Tests",
  status: ScenarioRunStatus.FAILED,
  environmentStatus: EnvironmentStatus.BROKEN,
  startDate: "",
  endDate: "",
  commitId: "",
  mxVersion: "",
  mxBuildId: "",
  assigneeId: "",
  assigneeDisplayName: "",
  assigneeEmail: "",
};

describe("ScenarioRunTableComponent", () => {
  describe("column headers", () => {
    it("renders the Name column header", async () => {
      await renderComponent();

      expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
    });

    it("renders the Status column header", async () => {
      await renderComponent();

      expect(screen.getByRole("columnheader", { name: "Status" })).toBeTruthy();
    });

    it("renders the Env Status column header", async () => {
      await renderComponent();

      expect(
        screen.getByRole("columnheader", { name: "Env Status" })
      ).toBeTruthy();
    });

    it("renders the Start Date column header", async () => {
      await renderComponent();

      expect(
        screen.getByRole("columnheader", { name: "Start Date" })
      ).toBeTruthy();
    });

    it("renders the Duration column header", async () => {
      await renderComponent();

      expect(
        screen.getByRole("columnheader", { name: "Duration" })
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

    it("renders the Assignee column header", async () => {
      await renderComponent();

      expect(
        screen.getByRole("columnheader", { name: "Assignee" })
      ).toBeTruthy();
    });
  });

  describe("data rows", () => {
    it("renders a row for each scenario run", async () => {
      await renderComponent({
        scenarioRuns: [MOCK_SCENARIO_RUN, MOCK_SCENARIO_RUN_MINIMAL],
      });

      await waitFor(() => expect(getDataRows()).toHaveLength(2));
    });
  });

  it("shows a 'No scenario runs' message when there are no scenario runs", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(screen.getByText("No scenario runs")).toBeTruthy()
    );
  });

  describe("Name column", () => {
    it("renders a link with the scenario run name", async () => {
      await renderComponent({ scenarioRuns: [MOCK_SCENARIO_RUN] });

      await waitFor(() =>
        expect(
          screen.getByRole("link", { name: "Regression Suite" })
        ).toBeTruthy()
      );
    });

    it("links to the scenario run detail page for the given project", async () => {
      await renderComponent({
        scenarioRuns: [MOCK_SCENARIO_RUN],
        projectId: "project-1",
      });

      await waitFor(() => {
        const link = screen.getByRole("link", { name: "Regression Suite" });
        expect(link.getAttribute("href")).toBe(
          "/app/project-1/test/execution/details/run-1"
        );
      });
    });
  });

  describe("MX Version column", () => {
    it("shows the mxVersion value", async () => {
      await renderComponent({ scenarioRuns: [MOCK_SCENARIO_RUN] });

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[6].textContent?.trim()).toBe("1.0.0");
      });
    });

    it("shows a dash when mxVersion is not available", async () => {
      await renderComponent({ scenarioRuns: [MOCK_SCENARIO_RUN_MINIMAL] });

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[6].textContent?.trim()).toBe("-");
      });
    });
  });

  describe("MX Build ID column", () => {
    it("shows the mxBuildId value", async () => {
      await renderComponent({ scenarioRuns: [MOCK_SCENARIO_RUN] });

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[7].textContent?.trim()).toBe("build-123");
      });
    });

    it("shows a dash when mxBuildId is not available", async () => {
      await renderComponent({ scenarioRuns: [MOCK_SCENARIO_RUN_MINIMAL] });

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[7].textContent?.trim()).toBe("-");
      });
    });
  });

  describe("Duration column", () => {
    it("shows the formatted duration between start and end dates", async () => {
      await renderComponent({ scenarioRuns: [MOCK_SCENARIO_RUN] });

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[4].textContent?.trim()).toBe("1h 30m 45s");
      });
    });

    it("shows a dash when start or end date is not available", async () => {
      await renderComponent({ scenarioRuns: [MOCK_SCENARIO_RUN_MINIMAL] });

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[4].textContent?.trim()).toBe("-");
      });
    });
  });

  describe("Commit ID column", () => {
    it("shows the first 10 characters of the commit ID", async () => {
      await renderComponent({ scenarioRuns: [MOCK_SCENARIO_RUN] });

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[5].textContent?.trim()).toBe("abc123def4");
      });
    });

    it("shows a dash when commitId is not available", async () => {
      await renderComponent({ scenarioRuns: [MOCK_SCENARIO_RUN_MINIMAL] });

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[5].textContent?.trim()).toBe("-");
      });
    });
  });
});
