import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, Subject, throwError } from "rxjs";
import { ReactiveFormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";

import {
  MxevolveIconComponent,
  StepperComponent,
  StepComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import {
  FurtherAnalysisService,
  QualityGateValidationService,
  SendChangesForReviewService,
  UpgradeProcessStateUpdaterService,
  FactoryProductUpdateService,
} from "@mxevolve/domains/business-process/data-access";
import {
  StageStatus,
  QualityGateValidationDecision,
  QualityGateValidationResult,
} from "@mxevolve/domains/business-process/util";
import { QualityGateValidationFormComponent } from "../quality-gate-validation-form/quality-gate-validation-form.component";
import { MergeRequestDetailsFormComponent } from "../merge-request-details-form/merge-request-details-form.component";
import { KeepEnvironmentsTableComponent } from "../keep-environments-table/keep-environments-table.component";
import { FactoryProductSubmissionFormComponent } from "../factory-product-submission-form/factory-product-submission-form.component";
import { ProceedFromQualityGateWizardComponent } from "./proceed-from-quality-gate-wizard.component";
import { ComponentFixture } from "@angular/core/testing";
import {
  MergeConfiguration,
  Reviewer,
} from "@mxevolve/domains/scm/data-access";

const MOCK_MERGE_CONFIGURATION = {
  id: "mc-1",
  projectId: "proj-1",
  branchName: "main",
  mergeConfigurationDefinition: {
    id: "mcd-1",
    repositoryId: "repo-1",
    branchPattern: "main",
  },
};

const REQUIRED_INPUTS = {
  projectId: "proj-1",
  processId: "proc-1",
  developmentId: "dev-1",
  supportsResourceManagement: true,
  parentBranchName: "main",
  stageStatus: StageStatus.PENDING_INPUT,
  keptResourcesDecisionMade: false,
};

const MOCK_IMPORTS = [
  ReactiveFormsModule,
  Button,
  Dialog,
  StepperComponent,
  StepComponent,
  MockComponent(MxevolveIconComponent),
  MockComponent(QualityGateValidationFormComponent),
  MockComponent(MergeRequestDetailsFormComponent),
  MockComponent(KeepEnvironmentsTableComponent),
  MockComponent(FactoryProductSubmissionFormComponent),
];

const mockQualityGateService = {
  markQualityGatePassed: jest.fn(),
  markQualityGateFailed: jest.fn(),
};

const mockSendChangesForReviewService = {
  sendChangesForReview: jest.fn(),
};

const mockToastMessageService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const mockUpgradeProcessStateUpdater = {
  reloadProcessDetails: jest.fn(),
};

const mockFurtherAnalysisService = {
  markResourcesForFurtherAnalysis: jest.fn(),
};

const mockFactoryProductUpdateService = {
  updateFactoryProduct: jest.fn(),
  getFactoryProductUpdates: jest.fn(),
};

async function renderComponent(inputs = {}) {
  return render(ProceedFromQualityGateWizardComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      {
        provide: QualityGateValidationService,
        useValue: mockQualityGateService,
      },
      {
        provide: SendChangesForReviewService,
        useValue: mockSendChangesForReviewService,
      },
      {
        provide: UpgradeProcessStateUpdaterService,
        useValue: mockUpgradeProcessStateUpdater,
      },
      {
        provide: FurtherAnalysisService,
        useValue: mockFurtherAnalysisService,
      },
      {
        provide: FactoryProductUpdateService,
        useValue: mockFactoryProductUpdateService,
      },
    ],
    providers: [
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });
}

async function setQualityGateValue(
  fixture: ComponentFixture<ProceedFromQualityGateWizardComponent>,
  decision: QualityGateValidationDecision,
  comment = "",
  deleteBranch: { shouldDelete: boolean; developmentId: string } | null = null
) {
  const qgComponent = ngMocks.find(fixture, QualityGateValidationFormComponent);
  ngMocks.change(qgComponent, {
    validationDecision: decision,
    comment,
    deleteBranch,
  });
  if (decision === QualityGateValidationDecision.VALIDATION_PASSED) {
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled()
    );
  } else if (
    decision === QualityGateValidationDecision.FAILED_AND_STOP_THE_PROCESS
  ) {
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Stop Process" })
      ).not.toBeDisabled()
    );
  }
}

async function setMergeRequestValue(
  fixture: ComponentFixture<ProceedFromQualityGateWizardComponent>,
  values: {
    mergeRequestTitle?: string;
    destinationBranch?: MergeConfiguration;
    reviewers?: Reviewer[];
    deleteBranch?: { shouldDelete: boolean; developmentId: string } | null;
  } = {}
) {
  const mrComponent = ngMocks.find(fixture, MergeRequestDetailsFormComponent);
  ngMocks.change(mrComponent, {
    mergeRequestTitle: values.mergeRequestTitle ?? "My merge request",
    destinationBranch: values.destinationBranch ?? MOCK_MERGE_CONFIGURATION,
    reviewers: values.reviewers ?? [],
    deleteBranch: values.deleteBranch ?? null,
  });
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Send" })).not.toBeDisabled()
  );
}

describe("ProceedFromQualityGateWizardComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQualityGateService.markQualityGatePassed.mockReturnValue(of(void 0));
    mockQualityGateService.markQualityGateFailed.mockReturnValue(of(void 0));
    mockSendChangesForReviewService.sendChangesForReview.mockReturnValue(
      of(void 0)
    );
    mockFurtherAnalysisService.markResourcesForFurtherAnalysis.mockReturnValue(
      of(void 0)
    );
    mockFactoryProductUpdateService.getFactoryProductUpdates.mockReturnValue(
      of({ actions: [] })
    );
    mockFactoryProductUpdateService.updateFactoryProduct.mockReturnValue(
      of({ success: true, skipped: false, files: [] })
    );
  });
  describe("Next Step button", () => {
    it("is enabled when stage status is PENDING_INPUT", async () => {
      await renderComponent();

      expect(
        screen.getByRole("button", { name: "Next Step" })
      ).not.toBeDisabled();
    });

    it("is disabled when stage status is not PENDING_INPUT", async () => {
      await renderComponent({ stageStatus: StageStatus.RUNNING });

      expect(screen.getByRole("button", { name: "Next Step" })).toBeDisabled();
    });
  });

  describe("dialog opening", () => {
    it("opens the dialog when Next Step is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(screen.getByText("Validate QG")).toBeInTheDocument();
      expect(screen.getByText("Merge Request")).toBeInTheDocument();
      expect(screen.getByText("Keep Environments")).toBeInTheDocument();
      expect(
        screen.getByText("Factory Product Submission")
      ).toBeInTheDocument();
    });

    it("renders quality gate validation component with correct inputs", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));

      const qgComponent = ngMocks.find(
        fixture,
        QualityGateValidationFormComponent
      ).componentInstance;
      expect(qgComponent.projectId).toBe("proj-1");
      expect(qgComponent.processId).toBe("proc-1");
      expect(qgComponent.supportsResourceManagement).toBe(true);
    });

    it("shows dialog header as Validate Quality Gate", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(screen.getByText("Validate Quality Gate")).toBeInTheDocument();
    });

    it("shows a disabled Next button when no decision is selected", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    });
  });

  describe("dialog opening with existing passed decision", () => {
    const passedResult: QualityGateValidationResult = {
      decision: QualityGateValidationDecision.VALIDATION_PASSED,
      requester: "",
      comment: "Looks good",
    };

    it("opens to the keep environments step when keep environments decision is not yet made", async () => {
      const user = userEvent.setup();
      await renderComponent({
        validationResult: passedResult,
        keptResourcesDecisionMade: false,
      });

      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(
        document.querySelector("mxevolve-keep-environments-table")
      ).toBeTruthy();
      expect(
        document.querySelector("mxevolve-merge-request-details-form")
      ).toBeFalsy();
    });

    it("opens directly to the merge request step when keep environments decision is already made", async () => {
      const user = userEvent.setup();
      await renderComponent({
        validationResult: passedResult,
        keptResourcesDecisionMade: true,
      });

      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(
        document.querySelector("mxevolve-merge-request-details-form")
      ).toBeTruthy();
      expect(
        document.querySelector("mxevolve-quality-gate-validation-form")
      ).toBeFalsy();
    });

    it("disables the quality gate validation control", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        validationResult: passedResult,
      });

      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(
        fixture.componentInstance.qualityGateValidationControl.disabled
      ).toBe(true);
    });

    it("sets quality gate validation to the existing passed decision", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        validationResult: passedResult,
      });

      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(
        fixture.componentInstance.qualityGateValidationControl.value
      ).toEqual({
        validationDecision: QualityGateValidationDecision.VALIDATION_PASSED,
        comment: "Looks good",
        deleteBranch: null,
      });
    });

    it("when the user opens the wizard with an existing passed quality gate decision, then the latest factory product state should be loaded", async () => {
      const user = userEvent.setup();

      await renderComponent({ validationResult: passedResult });

      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(
        mockFactoryProductUpdateService.getFactoryProductUpdates
      ).toHaveBeenCalledWith("proj-1", "proc-1");
    });

    it("when the user reopens the wizard after a successful factory product submission, then the latest state should be loaded again and the submission should remain readonly", async () => {
      mockFactoryProductUpdateService.getFactoryProductUpdates.mockReturnValue(
        of({
          actions: [createFactoryProductAction()],
        })
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        validationResult: passedResult,
        keptResourcesDecisionMade: false,
      });

      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(
        mockFactoryProductUpdateService.getFactoryProductUpdates
      ).toHaveBeenCalledTimes(1);

      expect(fixture.componentInstance.factoryProductMode()).toBe("readonly");

      fixture.componentInstance.dialogVisible.set(false);
      fixture.detectChanges();

      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(
        mockFactoryProductUpdateService.getFactoryProductUpdates
      ).toHaveBeenCalledTimes(2);

      expect(fixture.componentInstance.factoryProductMode()).toBe("readonly");
    });
  });

  describe("validate QG step - passed", () => {
    it("shows Next button after selecting Passed", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled()
      );
    });
  });

  describe("validate QG step - failed", () => {
    it("shows Stop Process button after selecting Failed", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.FAILED_AND_STOP_THE_PROCESS
      );

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Stop Process" })
        ).not.toBeDisabled()
      );
    });

    it("shows success toast after marking as failed", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.FAILED_AND_STOP_THE_PROCESS
      );
      await user.click(screen.getByRole("button", { name: "Stop Process" }));

      await waitFor(() =>
        expect(mockToastMessageService.showSuccess).toHaveBeenCalledWith(
          "Quality gate marked as failed."
        )
      );
    });

    it("closes the dialog after marking as failed", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.FAILED_AND_STOP_THE_PROCESS
      );
      await user.click(screen.getByRole("button", { name: "Stop Process" }));

      await waitFor(() =>
        expect(
          screen.queryByText("Validate Quality Gate")
        ).not.toBeInTheDocument()
      );
    });

    it("sends the comment when marking as failed", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.FAILED_AND_STOP_THE_PROCESS,
        "Not good enough"
      );
      await user.click(screen.getByRole("button", { name: "Stop Process" }));

      await waitFor(() =>
        expect(
          mockQualityGateService.markQualityGateFailed
        ).toHaveBeenCalledWith(
          expect.objectContaining({ comment: "Not good enough" })
        )
      );
    });

    it("sends correct shouldCleanDevelopment when marking as failed", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.FAILED_AND_STOP_THE_PROCESS,
        "",
        {
          shouldDelete: true,
          developmentId: "dev-123",
        }
      );
      await user.click(screen.getByRole("button", { name: "Stop Process" }));

      await waitFor(() =>
        expect(
          mockQualityGateService.markQualityGateFailed
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            shouldCleanDevelopment: true,
            developmentId: "dev-123",
          })
        )
      );
    });

    it("shows error toast when marking as failed fails", async () => {
      mockQualityGateService.markQualityGateFailed.mockReturnValue(
        throwError(() => new Error("Server error"))
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.FAILED_AND_STOP_THE_PROCESS
      );
      await user.click(screen.getByRole("button", { name: "Stop Process" }));

      await waitFor(() =>
        expect(mockToastMessageService.showError).toHaveBeenCalledWith(
          "Server error"
        )
      );
    });

    it("reloads process details after marking as failed", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.FAILED_AND_STOP_THE_PROCESS
      );
      await user.click(screen.getByRole("button", { name: "Stop Process" }));

      await waitFor(() =>
        expect(
          mockUpgradeProcessStateUpdater.reloadProcessDetails
        ).toHaveBeenCalledWith("proc-1", "proj-1")
      );
    });

    it("does not reload process details when marking as failed fails", async () => {
      mockQualityGateService.markQualityGateFailed.mockReturnValue(
        throwError(() => new Error("Server error"))
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.FAILED_AND_STOP_THE_PROCESS
      );
      await user.click(screen.getByRole("button", { name: "Stop Process" }));

      await waitFor(() =>
        expect(mockToastMessageService.showError).toHaveBeenCalled()
      );
      expect(
        mockUpgradeProcessStateUpdater.reloadProcessDetails
      ).not.toHaveBeenCalled();
    });

    it("shows loading state while marking as failed", async () => {
      const failSubject = new Subject<void>();
      mockQualityGateService.markQualityGateFailed.mockReturnValue(failSubject);
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.FAILED_AND_STOP_THE_PROCESS
      );
      await user.click(screen.getByRole("button", { name: "Stop Process" }));

      expect(
        screen.getByRole("button", { name: "Stop Process" })
      ).toBeDisabled();

      failSubject.next();
      failSubject.complete();

      await waitFor(() =>
        expect(
          screen.queryByText("Validate Quality Gate")
        ).not.toBeInTheDocument()
      );
    });
  });

  describe("factory product step", () => {
    async function goToFactoryProductStep(
      fixture: ComponentFixture<ProceedFromQualityGateWizardComponent>,
      user: ReturnType<typeof userEvent.setup>
    ) {
      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
    }

    it("when the user validates the quality gate, and clicks on next, then the factory product submission form should be shown", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await goToFactoryProductStep(fixture, user);

      expect(
        document.querySelector("mxevolve-factory-product-submission-form")
      ).toBeTruthy();

      expect(
        document.querySelector(".p-dialog-title")?.textContent?.trim()
      ).toBe("Factory Product Submission");
    });

    it("when the user opens the factory product submission step, then the form should be initialized with the expected values", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        initialFactoryProductId: "fp-1",
      });

      await goToFactoryProductStep(fixture, user);

      const formComponent = ngMocks.find(
        fixture,
        FactoryProductSubmissionFormComponent
      ).componentInstance;
      expect(formComponent.projectId).toBe("proj-1");
      expect(formComponent.developmentId).toBe("dev-1");
      expect(formComponent.initialFactoryProductId).toBe("fp-1");
    });

    it("when the user completes the factory product submission step and clicks on next, then the keep environments step should be shown", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await goToFactoryProductStep(fixture, user);
      await user.click(screen.getByRole("button", { name: "Next" }));

      expect(
        document.querySelector("mxevolve-keep-environments-table")
      ).toBeTruthy();
    });

    it("when the user clicks on back from the factory product submission step, then the quality gate validation step should be shown", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await goToFactoryProductStep(fixture, user);
      await user.click(screen.getByRole("button", { name: "Back" }));

      expect(
        document.querySelector("mxevolve-quality-gate-validation-form")
      ).toBeTruthy();
    });
  });

  describe("keep environments step", () => {
    it("shows the keep environments table after factory product submission", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      expect(
        document.querySelector("mxevolve-keep-environments-table")
      ).toBeTruthy();
      expect(
        document.querySelector("mxevolve-merge-request-details-form")
      ).toBeFalsy();
    });

    it("shows the dialog header as Keep Environments", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      expect(
        document.querySelector(".p-dialog-title")?.textContent?.trim()
      ).toBe("Keep Environments");
    });

    it("passes the correct inputs to the keep environments table", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      const tableComponent = ngMocks.find(
        fixture,
        KeepEnvironmentsTableComponent
      ).componentInstance;
      expect(tableComponent.mode).toBe("edit");
      expect(tableComponent.projectId).toBe("proj-1");
      expect(tableComponent.processId).toBe("proc-1");
    });

    it("shows the table in edit mode when navigating back from merge request without resources decision made", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Back" }));

      const tableComponent = ngMocks.find(
        fixture,
        KeepEnvironmentsTableComponent
      ).componentInstance;
      expect(tableComponent.mode).toBe("edit");
    });

    it("shows the table in readonly mode when navigating back from merge request with resources decision already made", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        validationResult: {
          decision: QualityGateValidationDecision.VALIDATION_PASSED,
          requester: "",
          comment: "OK",
        },
        keptResourcesDecisionMade: true,
      });

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await user.click(screen.getByRole("button", { name: "Back" }));

      const tableComponent = ngMocks.find(
        fixture,
        KeepEnvironmentsTableComponent
      ).componentInstance;
      expect(tableComponent.mode).toBe("readonly");
    });
  });

  describe("keep environments selection preservation", () => {
    it("passes the previously selected environment ids back to the table when navigating away and back", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));

      fixture.componentInstance.onSelectionChanged({
        environmentIds: ["env-1", "env-2"],
        scenarioIds: [],
      });

      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Back" }));

      const tableComponent = ngMocks.find(
        fixture,
        KeepEnvironmentsTableComponent
      ).componentInstance;
      expect(tableComponent.preselectedEnvironmentIds).toEqual([
        "env-1",
        "env-2",
      ]);
      expect(tableComponent.preselectedScenarioIds).toEqual([]);
    });

    it("passes the previously selected scenario ids back to the table when navigating away and back", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));

      fixture.componentInstance.onSelectionChanged({
        environmentIds: [],
        scenarioIds: ["scn-1", "scn-2"],
      });

      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Back" }));

      const tableComponent = ngMocks.find(
        fixture,
        KeepEnvironmentsTableComponent
      ).componentInstance;
      expect(tableComponent.preselectedEnvironmentIds).toEqual([]);
      expect(tableComponent.preselectedScenarioIds).toEqual(["scn-1", "scn-2"]);
    });
  });

  describe("merge request step", () => {
    it("renders merge request details component with correct inputs", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      const mrComponent = ngMocks.find(
        fixture,
        MergeRequestDetailsFormComponent
      ).componentInstance;
      expect(mrComponent.projectId).toBe("proj-1");
      expect(mrComponent.processId).toBe("proc-1");
      expect(mrComponent.developmentId).toBe("dev-1");
      expect(mrComponent.supportsResourceManagement).toBe(true);
    });

    it("shows Back and Send buttons", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
    });

    it("navigates back to keep environments step when Back is clicked", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Back" }));

      expect(
        document.querySelector("mxevolve-keep-environments-table")
      ).toBeTruthy();
    });

    it("disables Send button when merge request form is invalid", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      fixture.componentInstance.mergeRequestControl.setErrors({
        invalid: true,
      });

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Send" })).toBeDisabled()
      );
    });
  });

  describe("merge request submission", () => {
    async function openMergeRequestStepWithExistingDecision() {
      const user = userEvent.setup();
      const result = await renderComponent({
        validationResult: {
          decision: QualityGateValidationDecision.VALIDATION_PASSED,
          requester: "",
          comment: "Approved",
        },
        keptResourcesDecisionMade: true,
      });
      await user.click(screen.getByRole("button", { name: "Next Step" }));
      return { user, fixture: result.fixture };
    }

    it("shows success toast after submitting with existing decision", async () => {
      const { user, fixture } =
        await openMergeRequestStepWithExistingDecision();

      await setMergeRequestValue(fixture);
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() =>
        expect(mockToastMessageService.showSuccess).toHaveBeenCalledWith(
          "Changes sent for review."
        )
      );
    });

    it("closes dialog after successful submission", async () => {
      const { user, fixture } =
        await openMergeRequestStepWithExistingDecision();

      await setMergeRequestValue(fixture);
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() =>
        expect(screen.queryByText("Merge Request")).not.toBeInTheDocument()
      );
    });

    it("shows error toast when submission fails", async () => {
      mockSendChangesForReviewService.sendChangesForReview.mockReturnValue(
        throwError(() => new Error("Failed to send"))
      );
      const { user, fixture } =
        await openMergeRequestStepWithExistingDecision();

      await setMergeRequestValue(fixture);
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() =>
        expect(mockToastMessageService.showError).toHaveBeenCalledWith(
          "Failed to send"
        )
      );
    });

    it("reloads process details after submitting with existing decision", async () => {
      const { user, fixture } =
        await openMergeRequestStepWithExistingDecision();

      await setMergeRequestValue(fixture);
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() =>
        expect(
          mockUpgradeProcessStateUpdater.reloadProcessDetails
        ).toHaveBeenCalledWith("proc-1", "proj-1")
      );
    });

    it("does not reload process details when submission fails", async () => {
      mockSendChangesForReviewService.sendChangesForReview.mockReturnValue(
        throwError(() => new Error("Failed to send"))
      );
      const { user, fixture } =
        await openMergeRequestStepWithExistingDecision();

      await setMergeRequestValue(fixture);
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() =>
        expect(mockToastMessageService.showError).toHaveBeenCalled()
      );
      expect(
        mockUpgradeProcessStateUpdater.reloadProcessDetails
      ).not.toHaveBeenCalled();
    });

    it("enables Send button when merge request form is valid", async () => {
      const { fixture } = await openMergeRequestStepWithExistingDecision();

      await setMergeRequestValue(fixture);

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Send" })).not.toBeDisabled()
      );
    });
  });

  describe("merge request submission without existing decision", () => {
    it("marks QG as passed then sends merge request", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      await setMergeRequestValue(fixture);
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() => {
        expect(
          mockQualityGateService.markQualityGatePassed
        ).toHaveBeenCalledWith("proj-1", "proc-1", undefined);
        expect(
          mockSendChangesForReviewService.sendChangesForReview
        ).toHaveBeenCalled();
      });
    });

    it("shows success toast after QG pass and MR creation", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      await setMergeRequestValue(fixture, { mergeRequestTitle: "My MR" });
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() =>
        expect(mockToastMessageService.showSuccess).toHaveBeenCalledWith(
          "Changes sent for review."
        )
      );
    });

    it("shows error toast when QG pass fails", async () => {
      mockQualityGateService.markQualityGatePassed.mockReturnValue(
        throwError(() => new Error("QG pass error"))
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      await setMergeRequestValue(fixture);
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() =>
        expect(mockToastMessageService.showError).toHaveBeenCalledWith(
          "QG pass error"
        )
      );
    });

    it("reloads process details after QG pass and MR creation", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      await setMergeRequestValue(fixture);
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() =>
        expect(
          mockUpgradeProcessStateUpdater.reloadProcessDetails
        ).toHaveBeenCalledWith("proc-1", "proj-1")
      );
    });

    it("reloads process details when QG pass fails", async () => {
      mockQualityGateService.markQualityGatePassed.mockReturnValue(
        throwError(() => new Error("QG pass error"))
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      await setMergeRequestValue(fixture);
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() =>
        expect(mockToastMessageService.showError).toHaveBeenCalled()
      );
      expect(
        mockUpgradeProcessStateUpdater.reloadProcessDetails
      ).toHaveBeenCalled();
    });

    it("reloads process details when quality gate is marked as passed but opening a merge request fails", async () => {
      mockSendChangesForReviewService.sendChangesForReview.mockReturnValue(
        throwError(() => new Error("merge request creation error"))
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      await setMergeRequestValue(fixture);
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() =>
        expect(mockToastMessageService.showError).toHaveBeenCalled()
      );
      expect(
        mockUpgradeProcessStateUpdater.reloadProcessDetails
      ).toHaveBeenCalled();
    });

    it("includes the comment when marking QG as passed", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED,
        "All good"
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      await setMergeRequestValue(fixture, { mergeRequestTitle: "My MR" });
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() =>
        expect(
          mockQualityGateService.markQualityGatePassed
        ).toHaveBeenCalledWith("proj-1", "proc-1", "All good")
      );
    });

    it("shows loading state during submission", async () => {
      const passSubject = new Subject<void>();
      mockQualityGateService.markQualityGatePassed.mockReturnValue(passSubject);
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      await setMergeRequestValue(fixture, { mergeRequestTitle: "My MR" });
      await user.click(screen.getByRole("button", { name: "Send" }));

      expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

      passSubject.next();
      passSubject.complete();

      await waitFor(() =>
        expect(mockToastMessageService.showSuccess).toHaveBeenCalled()
      );
    });

    it("sends correct merge request payload", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      await setMergeRequestValue(fixture, {
        mergeRequestTitle: "Custom MR Title",
        destinationBranch: MOCK_MERGE_CONFIGURATION,
        reviewers: [
          { name: "reviewer1", displayName: "Reviewer One" },
          { name: "reviewer2", displayName: "Reviewer Two" },
        ],
        deleteBranch: { shouldDelete: true, developmentId: "dev-456" },
      });
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() =>
        expect(
          mockSendChangesForReviewService.sendChangesForReview
        ).toHaveBeenCalledWith({
          projectId: "proj-1",
          processId: "proc-1",
          mergeJobTitle: "Custom MR Title",
          mergeConfigurationId: "mc-1",
          mergeJobReviewers: ["reviewer1", "reviewer2"],
          shouldCleanDevelopment: true,
          developmentId: "dev-1",
          supportsResourceManagement: true,
        })
      );
    });
  });

  describe("resource marking on submission", () => {
    it("marks resources for further analysis when environments are selected in a new decision flow", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));

      fixture.componentInstance.onSelectionChanged({
        environmentIds: ["env-1"],
        scenarioIds: ["scn-1"],
      });

      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await setMergeRequestValue(fixture);
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() => {
        expect(
          mockFurtherAnalysisService.markResourcesForFurtherAnalysis
        ).toHaveBeenCalledWith("proj-1", "proc-1", {
          environmentIds: ["env-1"],
          scenarioIds: ["scn-1"],
        });
      });
    });

    it("marks resources for further analysis when environments are selected in an existing decision flow", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        validationResult: {
          decision: QualityGateValidationDecision.VALIDATION_PASSED,
          requester: "",
          comment: "OK",
        },
        keptResourcesDecisionMade: false,
      });

      await user.click(screen.getByRole("button", { name: "Next Step" }));

      fixture.componentInstance.onSelectionChanged({
        environmentIds: ["env-1"],
        scenarioIds: ["scn-1"],
      });

      await user.click(screen.getByRole("button", { name: "Next" }));
      await setMergeRequestValue(fixture);
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() => {
        expect(
          mockFurtherAnalysisService.markResourcesForFurtherAnalysis
        ).toHaveBeenCalledWith("proj-1", "proc-1", {
          environmentIds: ["env-1"],
          scenarioIds: ["scn-1"],
        });
      });
    });

    it("does not mark resources when no environments are selected", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      await setMergeRequestValue(fixture);
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() => {
        expect(
          mockSendChangesForReviewService.sendChangesForReview
        ).toHaveBeenCalled();
      });
      expect(
        mockFurtherAnalysisService.markResourcesForFurtherAnalysis
      ).not.toHaveBeenCalled();
    });

    it("does not mark resources when resources decision was already made", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        validationResult: {
          decision: QualityGateValidationDecision.VALIDATION_PASSED,
          requester: "",
          comment: "OK",
        },
        keptResourcesDecisionMade: true,
      });

      await user.click(screen.getByRole("button", { name: "Next Step" }));

      await setMergeRequestValue(fixture);
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() => {
        expect(
          mockSendChangesForReviewService.sendChangesForReview
        ).toHaveBeenCalled();
      });
      expect(
        mockFurtherAnalysisService.markResourcesForFurtherAnalysis
      ).not.toHaveBeenCalled();
    });
  });

  describe("form clearing when dialog is closed", () => {
    it("resets the quality gate validation when dialog is reopened", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED,
        "test"
      );

      const closeButton = document.querySelector(".p-dialog-header-close");
      await user.click(closeButton!);
      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(
        fixture.componentInstance.qualityGateValidationControl.value
      ).toBeNull();
    });

    it("resets the merge request when dialog is reopened", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await setMergeRequestValue(fixture, {
        mergeRequestTitle: "Title to clear",
      });

      const closeButton = document.querySelector(".p-dialog-header-close");
      await user.click(closeButton!);
      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(fixture.componentInstance.mergeRequestControl.value).toBeNull();
    });

    it("resets the environment selection when dialog is reopened", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));

      fixture.componentInstance.onSelectionChanged({
        environmentIds: ["env-1"],
        scenarioIds: ["scn-1"],
      });

      const closeButton = document.querySelector(".p-dialog-header-close");
      await user.click(closeButton!);
      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(fixture.componentInstance.selectedEnvironments()).toEqual({
        environmentIds: [],
        scenarioIds: [],
      });
    });

    it("resets the keep environments mode to edit when dialog is reopened", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));

      const closeButton = document.querySelector(".p-dialog-header-close");
      await user.click(closeButton!);
      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(fixture.componentInstance.keepEnvironmentsMode()).toBe("edit");
    });

    it("returns to the validate QG step when dialog is reopened", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));

      const closeButton = document.querySelector(".p-dialog-header-close");
      await user.click(closeButton!);
      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(
        document.querySelector("mxevolve-quality-gate-validation-form")
      ).toBeTruthy();
      expect(
        document.querySelector("mxevolve-merge-request-details-form")
      ).toBeFalsy();
    });

    it("clears loading state when dialog is reopened", async () => {
      const failSubject = new Subject<void>();
      mockQualityGateService.markQualityGateFailed.mockReturnValue(failSubject);
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.FAILED_AND_STOP_THE_PROCESS
      );
      await user.click(screen.getByRole("button", { name: "Stop Process" }));

      const closeButton = document.querySelector(".p-dialog-header-close");
      await user.click(closeButton!);

      mockQualityGateService.markQualityGateFailed.mockReturnValue(of(void 0));
      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Next" })).not.toHaveAttribute(
        "aria-busy",
        "true"
      );
    });
  });

  describe("stepper navigation", () => {
    it("returns to validate QG step when Back is clicked from keep environments step", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Back" }));

      expect(
        document.querySelector("mxevolve-quality-gate-validation-form")
      ).toBeTruthy();
    });

    it("navigates back to keep environments step in readonly mode when Back is clicked from merge request with existing decision", async () => {
      const user = userEvent.setup();
      await renderComponent({
        validationResult: {
          decision: QualityGateValidationDecision.VALIDATION_PASSED,
          requester: "",
          comment: "OK",
        },
        keptResourcesDecisionMade: true,
      });

      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(
        document.querySelector("mxevolve-merge-request-details-form")
      ).toBeTruthy();

      await user.click(screen.getByRole("button", { name: "Back" }));

      expect(
        document.querySelector("mxevolve-keep-environments-table")
      ).toBeTruthy();
    });
  });

  describe("factory product update on submit", () => {
    async function fillFactoryProductAndProceedToFinalStep(
      fixture: ComponentFixture<ProceedFromQualityGateWizardComponent>,
      user: ReturnType<typeof userEvent.setup>,
      factoryProductValue: {
        factoryProductId?: string;
        commitMessage?: string;
        selectedConfigurationFilePaths?: string[];
        skipSubmission?: boolean;
      } = {}
    ) {
      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));

      const fpComponent = ngMocks.find(
        fixture,
        FactoryProductSubmissionFormComponent
      );
      ngMocks.change(fpComponent, {
        factoryProductId: factoryProductValue.factoryProductId ?? "fp-1",
        commitMessage: factoryProductValue.commitMessage ?? "commit",
        selectedConfigurationFilePaths:
          factoryProductValue.selectedConfigurationFilePaths ?? ["file-1"],
        skipSubmission: factoryProductValue.skipSubmission ?? false,
      });

      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await setMergeRequestValue(fixture);
    }

    it("when the user provides factory product submission details and sends the review request, then the submitted factory product values should be used", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await fillFactoryProductAndProceedToFinalStep(fixture, user, {
        factoryProductId: "fp-99",
        commitMessage: "my commit",
        selectedConfigurationFilePaths: ["a.yaml", "b.yaml"],
      });
      await user.click(screen.getByRole("button", { name: "Send" }));

      const expectedRequest = expect.objectContaining({
        projectId: "proj-1",
        processId: "proc-1",
        factoryProductId: "fp-99",
        commitMessage: "my commit",
        filesToUpdate: ["a.yaml", "b.yaml"],
        skipUpdate: false,
      });

      await waitFor(expectUpdateFactoryProductCalledWith(expectedRequest));
    });

    it("when the user chooses to skip the factory product submission and sends the review request, then the submission should be marked as skipped", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await fillFactoryProductAndProceedToFinalStep(fixture, user, {
        skipSubmission: true,
      });
      await user.click(screen.getByRole("button", { name: "Send" }));

      const expectedRequest = expect.objectContaining({
        skipUpdate: true,
      });
      await waitFor(expectUpdateFactoryProductCalledWith(expectedRequest));
    });

    it("when the user sends the review request, then the factory product submission should be processed before the review request is sent", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      const callOrder: string[] = [];

      mockFactoryProductUpdateService.updateFactoryProduct.mockImplementation(
        () => {
          callOrder.push("updateFactoryProduct");
          return of({ success: true, skipped: false, files: [] });
        }
      );

      mockSendChangesForReviewService.sendChangesForReview.mockImplementation(
        () => {
          callOrder.push("sendChangesForReview");
          return of(void 0);
        }
      );

      await fillFactoryProductAndProceedToFinalStep(fixture, user);
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() => expect(callOrder).toHaveLength(2));

      expect(callOrder).toEqual([
        "updateFactoryProduct",
        "sendChangesForReview",
      ]);
    });

    it("when the factory product submission fails for one or more files, then the user should see the failures and the review request should not be sent", async () => {
      mockFactoryProductUpdateService.updateFactoryProduct.mockReturnValue(
        of({
          success: false,
          skipped: false,
          files: [
            {
              configurationFilePath: "path/one.yml",
              commitId: "",
              status: "FAILURE",
              failureMessage: "conflict detected",
            },
            {
              configurationFilePath: "path/two.yml",
              commitId: "c2",
              status: "SUCCESS",
            },
            {
              configurationFilePath: "path/three.yml",
              commitId: "",
              status: "FAILURE",
              failureMessage: "invalid content",
            },
          ],
        })
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await fillFactoryProductAndProceedToFinalStep(fixture, user);
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() =>
        expect(mockToastMessageService.showError).toHaveBeenCalled()
      );

      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "path/one.yml: conflict detected\npath/three.yml: invalid content"
      );
      expect(
        mockSendChangesForReviewService.sendChangesForReview
      ).not.toHaveBeenCalled();
    });

    it("when the user navigates between wizard steps, then the factory product state should not be loaded again", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      expect(
        mockFactoryProductUpdateService.getFactoryProductUpdates
      ).toHaveBeenCalledTimes(1);

      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );

      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));

      await user.click(screen.getByRole("button", { name: "Back" }));
      await user.click(screen.getByRole("button", { name: "Back" }));
      await user.click(screen.getByRole("button", { name: "Back" }));

      expect(
        mockFactoryProductUpdateService.getFactoryProductUpdates
      ).toHaveBeenCalledTimes(1);
    });

    it("when the user reopens the wizard, then the latest factory product state should be loaded again", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      expect(
        mockFactoryProductUpdateService.getFactoryProductUpdates
      ).toHaveBeenCalledTimes(1);

      fixture.componentInstance.dialogVisible.set(false);
      fixture.detectChanges();

      await user.click(screen.getByRole("button", { name: "Next Step" }));

      expect(
        mockFactoryProductUpdateService.getFactoryProductUpdates
      ).toHaveBeenCalledTimes(2);
    });

    it("when the user navigates away from the factory product submission step and returns to it, then the entered values should be preserved", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));

      const fpValue = {
        factoryProductId: "fp-99",
        commitMessage: "in memory",
        selectedConfigurationFilePaths: ["path/one.yml"],
        skipSubmission: false,
      };
      fixture.componentInstance.factoryProductSubmissionControl.setValue(
        fpValue
      );

      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Back" }));

      expect(
        mockFactoryProductUpdateService.getFactoryProductUpdates
      ).toHaveBeenCalledTimes(1);
      expect(
        fixture.componentInstance.factoryProductSubmissionControl.value
      ).toEqual(fpValue);
    });

    it("when no previous factory product actions exist, then the factory product submission step should be editable", async () => {
      mockFactoryProductUpdateService.getFactoryProductUpdates.mockReturnValue(
        of({ actions: [] })
      );

      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        initialFactoryProductId: "fp-suggested",
      });

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));

      const fpComponent = ngMocks.find(
        fixture,
        FactoryProductSubmissionFormComponent
      ).componentInstance;

      await waitFor(() => expect(fpComponent.mode).toBe("edit"));

      expect(
        fixture.componentInstance.factoryProductSubmissionControl.value
      ).toEqual({
        factoryProductId: "fp-suggested",
        commitMessage: "",
        selectedConfigurationFilePaths: [],
        skipSubmission: false,
      });
    });

    it("when the latest factory product submission was successful, then the factory product submission step should be readonly", async () => {
      mockFactoryProductUpdateService.getFactoryProductUpdates.mockReturnValue(
        of({
          actions: [createFactoryProductAction()],
        })
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));

      const fpComponent = ngMocks.find(
        fixture,
        FactoryProductSubmissionFormComponent
      ).componentInstance;

      await waitFor(() => expect(fpComponent.mode).toBe("readonly"));

      expect(
        fixture.componentInstance.factoryProductSubmissionControl.value
      ).toEqual({
        factoryProductId: "fp-1",
        commitMessage: "done",
        selectedConfigurationFilePaths: [],
        skipSubmission: false,
      });
    });

    it("when the latest factory product submission failed, then the factory product submission step should remain editable", async () => {
      mockFactoryProductUpdateService.getFactoryProductUpdates.mockReturnValue(
        of({
          actions: [
            createFactoryProductAction({
              status: "FAILURE",
              commitMessage: "retry",
            }),
          ],
        })
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));

      const fpComponent = ngMocks.find(
        fixture,
        FactoryProductSubmissionFormComponent
      ).componentInstance;

      await waitFor(() => expect(fpComponent.mode).toBe("edit"));

      expect(
        fixture.componentInstance.factoryProductSubmissionControl.value
      ).toEqual({
        factoryProductId: "fp-1",
        commitMessage: "retry",
        selectedConfigurationFilePaths: [],
        skipSubmission: false,
      });
    });

    it("when the latest factory product action is a failed skip submission, then the factory product submission step should remain editable", async () => {
      mockFactoryProductUpdateService.getFactoryProductUpdates.mockReturnValue(
        of({
          actions: [
            {
              id: "a1",
              projectId: "proj-1",
              processId: "proc-1",
              actionType: "SKIP_FAP_UPDATE",
              status: "FAILURE",
              occurredAt: "2026-01-01T00:00:00Z",
              details: {},
            },
          ],
        })
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));

      const fpComponent = ngMocks.find(
        fixture,
        FactoryProductSubmissionFormComponent
      ).componentInstance;

      await waitFor(() => expect(fpComponent.mode).toBe("edit"));
    });

    it("when the latest factory product action is a successful skip submission, then the factory product submission step should be readonly", async () => {
      mockFactoryProductUpdateService.getFactoryProductUpdates.mockReturnValue(
        of({
          actions: [
            {
              id: "a1",
              projectId: "proj-1",
              processId: "proc-1",
              actionType: "SKIP_FAP_UPDATE",
              status: "SUCCESS",
              occurredAt: "2026-01-01T00:00:00Z",
              details: {},
            },
          ],
        })
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));

      const fpComponent = ngMocks.find(
        fixture,
        FactoryProductSubmissionFormComponent
      ).componentInstance;

      await waitFor(() => expect(fpComponent.mode).toBe("readonly"));

      expect(
        fixture.componentInstance.factoryProductSubmissionControl.value
      ).toEqual({
        factoryProductId: undefined,
        commitMessage: "",
        selectedConfigurationFilePaths: [],
        skipSubmission: true,
      });
    });

    it("when the factory product state cannot be loaded, then the factory product submission step should remain editable", async () => {
      const loadError = new Error("Failed to load");

      mockFactoryProductUpdateService.getFactoryProductUpdates.mockReturnValue(
        throwError(() => loadError)
      );

      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        initialFactoryProductId: "fp-suggested",
      });

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));

      const fpComponent = ngMocks.find(
        fixture,
        FactoryProductSubmissionFormComponent
      ).componentInstance;

      await waitFor(() => expect(fpComponent.mode).toBe("edit"));

      expect(
        fixture.componentInstance.factoryProductSubmissionControl.value
      ).toEqual({
        factoryProductId: "fp-suggested",
        commitMessage: "",
        selectedConfigurationFilePaths: [],
        skipSubmission: false,
      });
    });

    it("when the factory product submission was already completed successfully, then no new factory product submission should be performed", async () => {
      mockFactoryProductUpdateService.getFactoryProductUpdates.mockReturnValue(
        of({
          actions: [createFactoryProductAction()],
        })
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await setMergeRequestValue(fixture);
      await user.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() => {
        expect(
          mockSendChangesForReviewService.sendChangesForReview
        ).toHaveBeenCalled();
      });
      expect(
        mockFactoryProductUpdateService.updateFactoryProduct
      ).not.toHaveBeenCalled();
    });

    it("uses the latest factory product action returned by the backend to determine the submission mode", async () => {
      mockFactoryProductUpdateService.getFactoryProductUpdates.mockReturnValue(
        of({
          actions: [
            createFactoryProductAction({
              id: "a2",
              occurredAt: "2026-02-01T00:00:00Z",
              status: "SUCCESS",
              commitMessage: "success",
            }),
            createFactoryProductAction({
              id: "a1",
              occurredAt: "2026-01-01T00:00:00Z",
              status: "FAILURE",
              commitMessage: "failed",
            }),
          ],
        })
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await setQualityGateValue(
        fixture,
        QualityGateValidationDecision.VALIDATION_PASSED
      );
      await user.click(screen.getByRole("button", { name: "Next" }));

      const fpComponent = ngMocks.find(
        fixture,
        FactoryProductSubmissionFormComponent
      ).componentInstance;

      await waitFor(() => expect(fpComponent.mode).toBe("readonly"));
    });
  });

  function createFactoryProductAction({
    id = "a1",
    actionType = "SUBMIT_FAP",
    occurredAt = "2026-01-01T00:00:00Z",
    status = "SUCCESS",
    commitMessage = "done",
  }: {
    id?: string;
    actionType?: string;
    occurredAt?: string;
    status?: "SUCCESS" | "FAILURE" | "NA";
    commitMessage?: string;
  } = {}) {
    return {
      id,
      projectId: "proj-1",
      processId: "proc-1",
      actionType,
      status,
      occurredAt,
      details: {
        factoryProductId: "fp-1",
        commitMessage,
        files: [],
      },
    };
  }

  function expectUpdateFactoryProductCalledWith(expectedRequest: unknown) {
    return () =>
      expect(
        mockFactoryProductUpdateService.updateFactoryProduct
      ).toHaveBeenCalledWith(expectedRequest);
  }
});
