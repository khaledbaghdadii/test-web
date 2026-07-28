import { render, screen, waitFor } from "@testing-library/angular";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { Message } from "primeng/message";
import { ReactiveFormsModule } from "@angular/forms";
import { MockComponent, ngMocks } from "ng-mocks";
import { ComponentFixture } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { userEvent } from "@testing-library/user-event";
import { ValidationProceedToNextStepComponent } from "./proceed-to-next-step.component";
import { MergeRequestDetailsFormComponent } from "../../upgrade-process/merge-request-details-form/merge-request-details-form.component";
import {
  ValidationProcessStageStatus,
  ValidationProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";
import { CommitsService } from "@mxevolve/domains/scm/data-access";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";

const MOCK_IMPORTS = [
  Button,
  Dialog,
  Message,
  ReactiveFormsModule,
  MockComponent(MergeRequestDetailsFormComponent),
  MockComponent(MxevolveIconComponent),
];

const REQUIRED_INPUTS = {
  projectId: "projectId",
  processId: "processId",
  stageStatus: ValidationProcessStageStatus.PENDING_INPUT,
  developmentId: "developmentId",
  repositoryId: "repositoryId",
  originBranch: "archival-branch",
  parentBranchName: "parentBranchName",
  supportsResourceManagement: true,
};

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

const CUSTOM_MR_TITLE = "Custom MR Title";

const CUSTOM_REVIEWERS = [
  { name: "reviewer1", displayName: "Reviewer One" },
  { name: "reviewer2", displayName: "Reviewer Two" },
];

const mockStateUpdater = {
  sendChangesForReview: jest.fn(),
  skipIntegrateChanges: jest.fn(),
  reloadProcessDetails: jest.fn(),
};

const mockCommitsService = {
  getCommitDifferences: jest.fn(),
};

const mockToastMessageService = {
  showError: jest.fn(),
  showSuccess: jest.fn(),
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return await render(ValidationProceedToNextStepComponent, {
    imports: MOCK_IMPORTS,
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      { provide: CommitsService, useValue: mockCommitsService },
    ],
    providers: [
      {
        provide: ValidationProcessStateUpdaterService,
        useValue: mockStateUpdater,
      },
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });
}

function setValidMergeRequestDetails(
  fixture: ComponentFixture<ValidationProceedToNextStepComponent>
) {
  fixture.componentInstance.mergeRequestControl.setErrors(null);
  fixture.componentInstance.mergeRequestControl.setValue({
    mergeRequestTitle: CUSTOM_MR_TITLE,
    destinationBranch: MOCK_MERGE_CONFIGURATION,
    reviewers: CUSTOM_REVIEWERS,
    deleteBranch: { shouldDelete: true, developmentId: "developmentId" },
  });
}

describe("ValidationProceedToNextStepComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStateUpdater.sendChangesForReview.mockReturnValue(of(void 0));
    mockStateUpdater.skipIntegrateChanges.mockReturnValue(of(void 0));
    mockCommitsService.getCommitDifferences.mockReturnValue(of([]));
  });

  it("enables the Next Step button when stage status is pending input", async () => {
    await renderComponent();
    expect(
      screen.getByRole("button", { name: "Next Step" })
    ).not.toBeDisabled();
  });

  it("disables the Next Step button when stage status is not pending input", async () => {
    await renderComponent({
      stageStatus: ValidationProcessStageStatus.RUNNING,
    });
    expect(screen.getByRole("button", { name: "Next Step" })).toBeDisabled();
  });

  it("prompts the user to fill the merge request details", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByRole("button", { name: "Next Step" }));

    expect(
      ngMocks.find(fixture, MergeRequestDetailsFormComponent)
    ).toBeTruthy();
  });

  it("offers Send for Review when there are commit differences", async () => {
    mockCommitsService.getCommitDifferences.mockReturnValue(
      of([{ commitId: "abc" }])
    );
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByRole("button", { name: "Next Step" }));
    setValidMergeRequestDetails(fixture);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Send for Review" })
      ).toBeEnabled()
    );
  });

  it("sends changes for review with the mapped request when Send for Review is clicked", async () => {
    mockCommitsService.getCommitDifferences.mockReturnValue(
      of([{ commitId: "abc" }])
    );
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByRole("button", { name: "Next Step" }));
    setValidMergeRequestDetails(fixture);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Send for Review" })
      ).toBeEnabled()
    );

    await user.click(screen.getByRole("button", { name: "Send for Review" }));

    expect(mockStateUpdater.sendChangesForReview).toHaveBeenCalledWith({
      projectId: "projectId",
      processId: "processId",
      mergeConfigurationId: "mc-1",
      mergeJobTitle: CUSTOM_MR_TITLE,
      mergeJobReviewers: ["reviewer1", "reviewer2"],
      shouldCleanDevelopment: true,
      developmentId: "developmentId",
    });
  });

  it("offers Skip Integration when there are no commit differences", async () => {
    mockCommitsService.getCommitDifferences.mockReturnValue(of([]));
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByRole("button", { name: "Next Step" }));
    setValidMergeRequestDetails(fixture);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Skip Integration" })
      ).toBeInTheDocument()
    );
  });

  it("skips the integration step with the mapped request when Skip Integration is clicked", async () => {
    mockCommitsService.getCommitDifferences.mockReturnValue(of([]));
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByRole("button", { name: "Next Step" }));
    setValidMergeRequestDetails(fixture);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Skip Integration" })
      ).toBeInTheDocument()
    );

    await user.click(screen.getByRole("button", { name: "Skip Integration" }));

    expect(mockStateUpdater.skipIntegrateChanges).toHaveBeenCalledWith(
      "projectId",
      "processId",
      {
        destinationBranch: "main",
        shouldCleanDevelopment: true,
        developmentId: "developmentId",
      }
    );
  });

  it("shows a success message and reloads process details after skipping integration", async () => {
    mockCommitsService.getCommitDifferences.mockReturnValue(of([]));
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByRole("button", { name: "Next Step" }));
    setValidMergeRequestDetails(fixture);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Skip Integration" })
      ).toBeInTheDocument()
    );

    await user.click(screen.getByRole("button", { name: "Skip Integration" }));

    expect(mockToastMessageService.showSuccess).toHaveBeenCalledWith(
      "Integration step skipped."
    );
    expect(mockStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
      "processId",
      "projectId"
    );
  });

  it("shows an error message when sending changes for review fails", async () => {
    mockCommitsService.getCommitDifferences.mockReturnValue(
      of([{ commitId: "abc" }])
    );
    mockStateUpdater.sendChangesForReview.mockReturnValue(
      throwError(() => new Error("boom"))
    );
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByRole("button", { name: "Next Step" }));
    setValidMergeRequestDetails(fixture);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Send for Review" })
      ).toBeEnabled()
    );

    await user.click(screen.getByRole("button", { name: "Send for Review" }));

    expect(mockToastMessageService.showError).toHaveBeenCalledWith("boom");
  });
});
