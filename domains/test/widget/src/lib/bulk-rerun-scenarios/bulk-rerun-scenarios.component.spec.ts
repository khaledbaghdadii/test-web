import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { of, throwError } from "rxjs";
import { BulkRerunScenariosComponent } from "./bulk-rerun-scenarios.component";
import { ScenarioRunService } from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { MultiSelectScenarioRunTableComponent } from "../multi-select-scenario-run-table/multi-select-scenario-run-table.component";
import { RerunDialogComponent } from "../rerun-dialog/rerun-dialog.component";
import type { ScenarioRunsPanelViewModel } from "../scenario-runs/scenario-runs-panel-facade.service";

const mockToastService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const mockScenarioRunService = {
  bulkRerun: jest.fn(),
  bulkRerunFromFinalProduct: jest.fn(),
};

const MOCK_IMPORTS = [
  MockComponent(MultiSelectScenarioRunTableComponent),
  MockComponent(RerunDialogComponent),
  Button,
  Dialog,
  PrimeTemplate,
];

const MOCK_PANEL: ScenarioRunsPanelViewModel = {
  head: {
    id: "run-head-001",
    name: "pricing-regression-test",
    status: ScenarioRunStatus.PASSED,
    environmentId: "env-001",
    environmentStatus: EnvironmentStatus.READY,
    analysisStatus: "PASSED",
    numberOfImpacts: 3,
    numberOfRegressions: 1,
    numberOfIncidents: 2,
    startDate: "2025-06-01T10:00:00Z",
    endDate: "2025-06-01T11:30:00Z",
    commitId: "abc123def",
    assigneeId: "user-001",
    assigneeDisplayName: "John Doe",
    assigneeEmail: "john.doe@example.com",
    mxVersion: "3.1.64",
    mxBuildId: "build-789",
    scenarioDefinitionId: "sd-001",
    contextId: "ctx-001",
    subContextId: "sub-ctx-001",
    factoryProductId: "fp-001",
    executionGroupId: "eg-001",
    repushable: true,
  },
  previousRuns: [],
};

async function renderComponent(
  inputs: Partial<{
    projectId: string;
    panels: ScenarioRunsPanelViewModel[];
    allowOfficialRerun: boolean;
    initialFinalProductId: string;
    branch: string;
    defaultRerunMode: "official" | "unofficial";
  }> = {}
) {
  return render(BulkRerunScenariosComponent, {
    inputs: {
      projectId: "project-123",
      panels: [MOCK_PANEL],
      ...inputs,
    },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: ScenarioRunService, useValue: mockScenarioRunService },
      { provide: ToastMessageService, useValue: mockToastService },
    ],
  });
}

describe("BulkRerunScenariosComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    document.body
      .querySelectorAll(".p-dialog-mask")
      .forEach((el) => el.remove());
  });

  describe("Bulk Rerun button", () => {
    it("renders the Bulk Rerun button", async () => {
      await renderComponent();

      expect(screen.getByRole("button", { name: "Bulk Rerun" })).toBeTruthy();
    });

    it("enables the Bulk Rerun button when at least one panel has a repushable scenario run", async () => {
      await renderComponent();

      expect(
        screen.getByRole("button", { name: "Bulk Rerun" })
      ).not.toBeDisabled();
    });

    it("disables the Bulk Rerun button when no panels have repushable scenario runs", async () => {
      const nonRepushablePanel: ScenarioRunsPanelViewModel = {
        ...MOCK_PANEL,
        head: { ...MOCK_PANEL.head, repushable: false },
      };
      await renderComponent({ panels: [nonRepushablePanel] });

      expect(screen.getByRole("button", { name: "Bulk Rerun" })).toBeDisabled();
    });

    it("disables the Bulk Rerun button when repushable is undefined", async () => {
      const undefinedRepushablePanel: ScenarioRunsPanelViewModel = {
        ...MOCK_PANEL,
        head: { ...MOCK_PANEL.head, repushable: undefined },
      };
      await renderComponent({ panels: [undefinedRepushablePanel] });

      expect(screen.getByRole("button", { name: "Bulk Rerun" })).toBeDisabled();
    });
  });

  describe("selection dialog", () => {
    it("opens the selection dialog when Bulk Rerun is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: "Bulk Rerun" }));

      expect(screen.getByText("Selected Scenarios")).toBeTruthy();
      expect(
        screen.getByText(
          "Select one or more Scenarios that you wish to re-run."
        )
      ).toBeTruthy();
    });

    it("passes all head IDs to the multi-select table", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Bulk Rerun" }));

      const table = ngMocks.find(fixture, MultiSelectScenarioRunTableComponent);
      expect(ngMocks.input(table, "scenarioRunIds")).toEqual(["run-head-001"]);
      expect(ngMocks.input(table, "projectId")).toBe("project-123");
    });

    it("disables the Re-run button in the selection dialog when no scenarios are selected", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: "Bulk Rerun" }));

      expect(screen.getByRole("button", { name: "Re-run" })).toBeDisabled();
    });

    it("closes the selection dialog and opens the rerun dialog when Re-run is clicked", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Bulk Rerun" }));

      const table = ngMocks.find(fixture, MultiSelectScenarioRunTableComponent);
      ngMocks.output(table, "selectedScenarioRunIds").emit(["run-head-001"]);
      fixture.detectChanges();

      await user.click(screen.getByRole("button", { name: "Re-run" }));

      await waitFor(() => {
        expect(screen.queryByText("Selected Scenarios")).toBeNull();
      });
      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      expect(ngMocks.input(rerunDialog, "visible")).toBe(true);
    });
  });

  describe("bulk rerun execution", () => {
    it("calls bulkRerun service with correct parameters", async () => {
      mockScenarioRunService.bulkRerun.mockReturnValue(
        of({ successfulRepushes: [], failedRepushes: [] })
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Bulk Rerun" }));
      const table = ngMocks.find(fixture, MultiSelectScenarioRunTableComponent);
      ngMocks.output(table, "selectedScenarioRunIds").emit(["run-head-001"]);
      fixture.detectChanges();
      await user.click(screen.getByRole("button", { name: "Re-run" }));

      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      ngMocks.output(rerunDialog, "rerunRequested").emit({
        factoryProductId: "fp-001",
        commitId: "abc123",
      });

      expect(mockScenarioRunService.bulkRerun).toHaveBeenCalledWith(
        "project-123",
        {
          factoryProductId: "fp-001",
          commitId: "abc123",
          scenariosToBeRepushed: ["run-head-001"],
        }
      );
    });

    it("shows success toast after bulk rerun succeeds", async () => {
      mockScenarioRunService.bulkRerun.mockReturnValue(
        of({
          successfulRepushes: [
            {
              originalScenarioExecutionId: "run-head-001",
              repushedScenarioExecutionId: "new-1",
            },
          ],
          failedRepushes: [],
        })
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Bulk Rerun" }));
      const table = ngMocks.find(fixture, MultiSelectScenarioRunTableComponent);
      ngMocks.output(table, "selectedScenarioRunIds").emit(["run-head-001"]);
      fixture.detectChanges();
      await user.click(screen.getByRole("button", { name: "Re-run" }));

      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      ngMocks.output(rerunDialog, "rerunRequested").emit({
        factoryProductId: "fp-001",
      });

      expect(mockToastService.showSuccess).toHaveBeenCalledWith(
        "Bulk rerun successfully submitted."
      );
    });

    it("shows success toast with failed count when some reruns fail", async () => {
      mockScenarioRunService.bulkRerun.mockReturnValue(
        of({ successfulRepushes: [], failedRepushes: ["run-head-001"] })
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Bulk Rerun" }));
      const table = ngMocks.find(fixture, MultiSelectScenarioRunTableComponent);
      ngMocks.output(table, "selectedScenarioRunIds").emit(["run-head-001"]);
      fixture.detectChanges();
      await user.click(screen.getByRole("button", { name: "Re-run" }));

      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      ngMocks.output(rerunDialog, "rerunRequested").emit({
        factoryProductId: "fp-001",
      });

      expect(mockToastService.showSuccess).toHaveBeenCalledWith(
        "Bulk rerun successfully submitted. 1 failed."
      );
    });

    it("shows error toast when bulk rerun fails", async () => {
      mockScenarioRunService.bulkRerun.mockReturnValue(
        throwError(() => new Error("Server error"))
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Bulk Rerun" }));
      const table = ngMocks.find(fixture, MultiSelectScenarioRunTableComponent);
      ngMocks.output(table, "selectedScenarioRunIds").emit(["run-head-001"]);
      fixture.detectChanges();
      await user.click(screen.getByRole("button", { name: "Re-run" }));

      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      ngMocks.output(rerunDialog, "rerunRequested").emit({
        factoryProductId: "fp-001",
      });

      expect(mockToastService.showError).toHaveBeenCalledWith(
        "Failed to submit bulk rerun."
      );
    });

    it("closes the rerun dialog after successful bulk rerun", async () => {
      mockScenarioRunService.bulkRerun.mockReturnValue(
        of({ successfulRepushes: [], failedRepushes: [] })
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Bulk Rerun" }));
      const table = ngMocks.find(fixture, MultiSelectScenarioRunTableComponent);
      ngMocks.output(table, "selectedScenarioRunIds").emit(["run-head-001"]);
      fixture.detectChanges();
      await user.click(screen.getByRole("button", { name: "Re-run" }));

      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      ngMocks.output(rerunDialog, "rerunRequested").emit({
        factoryProductId: "fp-001",
      });

      await waitFor(() => {
        expect(ngMocks.input(rerunDialog, "visible")).toBe(false);
      });
    });

    it("emits rerunCompleted after successful bulk rerun", async () => {
      mockScenarioRunService.bulkRerun.mockReturnValue(
        of({ successfulRepushes: [], failedRepushes: [] })
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const emitSpy = jest.fn();
      fixture.componentInstance.rerunCompleted.subscribe(emitSpy);

      await user.click(screen.getByRole("button", { name: "Bulk Rerun" }));
      const table = ngMocks.find(fixture, MultiSelectScenarioRunTableComponent);
      ngMocks.output(table, "selectedScenarioRunIds").emit(["run-head-001"]);
      fixture.detectChanges();
      await user.click(screen.getByRole("button", { name: "Re-run" }));

      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      ngMocks.output(rerunDialog, "rerunRequested").emit({
        factoryProductId: "fp-001",
      });

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe("new inputs passed to rerun dialog", () => {
    it("passes allowOfficialRerun to the RerunDialogComponent", async () => {
      const { fixture } = await renderComponent({ allowOfficialRerun: true });

      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      expect(ngMocks.input(rerunDialog, "allowOfficialRerun")).toBe(true);
    });

    it("passes false for allowOfficialRerun by default", async () => {
      const { fixture } = await renderComponent();

      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      expect(ngMocks.input(rerunDialog, "allowOfficialRerun")).toBe(false);
    });

    it("passes initialFinalProductId to the RerunDialogComponent", async () => {
      const { fixture } = await renderComponent({
        initialFinalProductId: "fp-init-123",
      });

      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      expect(ngMocks.input(rerunDialog, "initialFinalProductId")).toBe(
        "fp-init-123"
      );
    });

    it("passes branch to the RerunDialogComponent", async () => {
      const { fixture } = await renderComponent({ branch: "main" });

      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      expect(ngMocks.input(rerunDialog, "branch")).toBe("main");
    });

    it("passes defaultRerunMode to the RerunDialogComponent", async () => {
      const { fixture } = await renderComponent({
        defaultRerunMode: "official",
      });

      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      expect(ngMocks.input(rerunDialog, "defaultRerunMode")).toBe("official");
    });

    it("passes unofficial for defaultRerunMode by default", async () => {
      const { fixture } = await renderComponent();

      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      expect(ngMocks.input(rerunDialog, "defaultRerunMode")).toBe("unofficial");
    });
  });

  describe("official bulk rerun", () => {
    it("calls bulkRerunFromFinalProduct when official mode rerun is requested", async () => {
      mockScenarioRunService.bulkRerunFromFinalProduct.mockReturnValue(
        of({ successfulRepushes: [], failedRepushes: [] })
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Bulk Rerun" }));
      const table = ngMocks.find(fixture, MultiSelectScenarioRunTableComponent);
      ngMocks.output(table, "selectedScenarioRunIds").emit(["run-head-001"]);
      fixture.detectChanges();
      await user.click(screen.getByRole("button", { name: "Re-run" }));

      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      ngMocks.output(rerunDialog, "rerunRequested").emit({
        mode: "official",
        finalProductId: "fp-final-123",
        rtpCommitId: "rtp-abc",
        stopServices: true,
      });

      expect(
        mockScenarioRunService.bulkRerunFromFinalProduct
      ).toHaveBeenCalledWith("project-123", {
        finalProductId: "fp-final-123",
        rtpCommitId: "rtp-abc",
        scenariosToBeRepushed: ["run-head-001"],
      });
    });

    it("shows success toast after official bulk rerun succeeds", async () => {
      mockScenarioRunService.bulkRerunFromFinalProduct.mockReturnValue(
        of({ successfulRepushes: [], failedRepushes: [] })
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Bulk Rerun" }));
      const table = ngMocks.find(fixture, MultiSelectScenarioRunTableComponent);
      ngMocks.output(table, "selectedScenarioRunIds").emit(["run-head-001"]);
      fixture.detectChanges();
      await user.click(screen.getByRole("button", { name: "Re-run" }));

      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      ngMocks.output(rerunDialog, "rerunRequested").emit({
        mode: "official",
        finalProductId: "fp-final-123",
        rtpCommitId: "rtp-abc",
        stopServices: true,
      });

      expect(mockToastService.showSuccess).toHaveBeenCalledWith(
        "Bulk rerun successfully submitted."
      );
    });

    it("shows error toast when official bulk rerun fails", async () => {
      mockScenarioRunService.bulkRerunFromFinalProduct.mockReturnValue(
        throwError(() => new Error("Server error"))
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Bulk Rerun" }));
      const table = ngMocks.find(fixture, MultiSelectScenarioRunTableComponent);
      ngMocks.output(table, "selectedScenarioRunIds").emit(["run-head-001"]);
      fixture.detectChanges();
      await user.click(screen.getByRole("button", { name: "Re-run" }));

      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      ngMocks.output(rerunDialog, "rerunRequested").emit({
        mode: "official",
        finalProductId: "fp-final-123",
        rtpCommitId: "rtp-abc",
        stopServices: true,
      });

      expect(mockToastService.showError).toHaveBeenCalledWith(
        "Failed to submit bulk rerun."
      );
    });
  });

  describe("preFilledFactoryProductId", () => {
    it("passes the shared factory product ID to the rerun dialog when all selected runs share the same factory product", async () => {
      const panelWithFp: ScenarioRunsPanelViewModel = {
        ...MOCK_PANEL,
        head: {
          ...MOCK_PANEL.head,
          id: "run-2",
          factoryProductId: "fp-shared",
        },
      };
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        panels: [MOCK_PANEL, panelWithFp],
      });

      await user.click(screen.getByRole("button", { name: "Bulk Rerun" }));
      const table = ngMocks.find(fixture, MultiSelectScenarioRunTableComponent);
      ngMocks
        .output(table, "selectedScenarioRunIds")
        .emit(["run-head-001", "run-2"]);
      fixture.detectChanges();

      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      expect(ngMocks.input(rerunDialog, "factoryProductId")).toBeUndefined();
    });

    it("passes undefined factory product ID when selected runs have different factory products", async () => {
      const panelWithDifferentFp: ScenarioRunsPanelViewModel = {
        ...MOCK_PANEL,
        head: {
          ...MOCK_PANEL.head,
          id: "run-2",
          factoryProductId: "fp-different",
        },
      };
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        panels: [MOCK_PANEL, panelWithDifferentFp],
      });

      await user.click(screen.getByRole("button", { name: "Bulk Rerun" }));
      const table = ngMocks.find(fixture, MultiSelectScenarioRunTableComponent);
      ngMocks
        .output(table, "selectedScenarioRunIds")
        .emit(["run-head-001", "run-2"]);
      fixture.detectChanges();

      const rerunDialog = ngMocks.find(fixture, RerunDialogComponent);
      expect(ngMocks.input(rerunDialog, "factoryProductId")).toBeUndefined();
    });
  });
});
