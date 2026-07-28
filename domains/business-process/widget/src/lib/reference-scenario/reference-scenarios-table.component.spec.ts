import { render, screen, waitFor, within } from "@testing-library/angular";
import { of, throwError } from "rxjs";
import { provideRouter } from "@angular/router";
import { MessageService } from "primeng/api";
import { Component } from "@angular/core";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { ReferenceScenariosTableComponent } from "./reference-scenarios-table.component";
import { ActionsCellRendererComponent } from "@mxevolve/domains/environment/widget";
import {
  ReferenceScenario,
  ReferenceScenariosService,
} from "@mxevolve/domains/business-process/data-access";
import { EnvironmentService } from "@mxflow/features/environment";

@Component({
  selector: "mxevolve-actions-cell-renderer",
  template: "<div>Mocked Value</div>",
  standalone: true,
})
class MockActionsCellRenderer extends ActionsCellRendererComponent {}

const mockReferenceScenariosService = {
  fetchReferenceScenarios: jest.fn(),
};

const mockToastMessageService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const REQUIRED_INPUTS = {
  projectId: "projectId",
  referenceScenarioExecutionGroupId: "groupId",
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(ReferenceScenariosTableComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      {
        provide: ReferenceScenariosService,
        useValue: mockReferenceScenariosService,
      },
      {
        provide: EnvironmentService,
        useValue: {},
      },
    ],
    providers: [
      provideRouter([]),
      MessageService,
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
    componentProperties: {
      actionsCellRendererComponent: MockActionsCellRenderer,
    },
  });
}

function getDataRows() {
  return screen
    .queryAllByRole("row")
    .filter((row) => within(row).queryAllByRole("gridcell").length > 0);
}

const MOCK_ROW: ReferenceScenario = {
  scenarioExecutionId: "scenario-1",
  tpkName: "TPK Alpha",
  scenarioStatus: "EXECUTING",
  scenarioStartDate: "2026-03-01T10:00:00Z",
  scenarioEndDate: "2026-03-01T11:30:00Z",
  tpkCommitId: "abc123def456xyz",
  tpkMxVersion: "9.24",
  tpkMxBuildId: "9.24.1.12345",
  environment: {
    id: "env-1",
    status: EnvironmentStatus.READY,
    projectId: "projectId",
    databases: [],
  },
};

const MOCK_ROW_2: ReferenceScenario = {
  scenarioExecutionId: "scenario-2",
  tpkName: "TPK Beta",
  scenarioStatus: "CREATED",
  environment: {
    id: "env-2",
    status: EnvironmentStatus.EXECUTING,
    projectId: "projectId",
    databases: [],
  },
};

describe("ReferenceScenariosTableComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReferenceScenariosService.fetchReferenceScenarios.mockReturnValue(
      of([])
    );
  });

  it.each([
    "Scenario Name",
    "Scenario Status",
    "Environment status",
    "Start Date",
    "Duration",
    "Commit Id",
    "Mx version",
    "Mx build id",
    "Actions",
  ])(
    "when the table renders, then the %s column header is displayed",
    async (header) => {
      await renderComponent();

      expect(screen.getByRole("columnheader", { name: header })).toBeTruthy();
    }
  );

  it("when the table renders, then a row is rendered for each reference scenario", async () => {
    mockReferenceScenariosService.fetchReferenceScenarios.mockReturnValue(
      of([MOCK_ROW, MOCK_ROW_2])
    );

    await renderComponent();

    await waitFor(() => {
      expect(getDataRows()).toHaveLength(2);
      expect(getDataRows()[0]).toHaveTextContent("TPK Alpha");
      expect(getDataRows()[1]).toHaveTextContent("TPK Beta");
    });
  });

  it("given there are no reference scenarios when the table renders then the table is displayed with no data", async () => {
    await renderComponent();

    await waitFor(() => expect(getDataRows()).toHaveLength(0));
  });

  it("given there are no reference scenarios when the table renders, then a message is displayed to the user indicating that there are no reference scenarios", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(screen.getByText("No reference environments")).toBeTruthy()
    );
  });

  it("given an error occurs while fetching reference scenarios when the table renders then the table is displayed with no data", async () => {
    mockReferenceScenariosService.fetchReferenceScenarios.mockReturnValue(
      throwError(() => new Error("Service error"))
    );

    await renderComponent();

    await waitFor(() => expect(getDataRows()).toHaveLength(0));
  });

  it("given an error occurs while fetching reference scenarios when the table renders then an error toast is displayed to the user", async () => {
    mockReferenceScenariosService.fetchReferenceScenarios.mockReturnValue(
      throwError(() => new Error("Service error"))
    );

    await renderComponent();

    await waitFor(() =>
      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "Failed to fetch the reference environments."
      )
    );
  });

  it("when the table renders, then the TPK name column displays a link to the scenario execution details page", async () => {
    mockReferenceScenariosService.fetchReferenceScenarios.mockReturnValue(
      of([MOCK_ROW])
    );

    await renderComponent();

    await waitFor(() => {
      const link = screen.getByRole("link", { name: "TPK Alpha" });
      expect(link).toBeTruthy();
      expect(link.getAttribute("href")).toBe(
        "/app/projectId/test/execution/details/scenario-1"
      );
    });
  });

  it("when the table renders, then the duration column displays the computed duration of the TPK", async () => {
    mockReferenceScenariosService.fetchReferenceScenarios.mockReturnValue(
      of([MOCK_ROW])
    );

    await renderComponent();

    await waitFor(() => expect(screen.getByText(/1h 30m/)).toBeTruthy());
  });

  it("given that the reference scenario has not finished execution when the table renders, then the duration column displays a dash", async () => {
    mockReferenceScenariosService.fetchReferenceScenarios.mockReturnValue(
      of([MOCK_ROW_2])
    );

    await renderComponent();

    await waitFor(() => expect(getDataRows()).toHaveLength(1));
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });
});
