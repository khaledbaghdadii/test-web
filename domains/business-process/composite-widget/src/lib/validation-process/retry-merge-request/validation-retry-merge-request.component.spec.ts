import { render, screen, waitFor } from "@testing-library/angular";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { ReactiveFormsModule } from "@angular/forms";
import { MockComponent, ngMocks } from "ng-mocks";
import { ComponentFixture } from "@angular/core/testing";
import { of, Subject, throwError } from "rxjs";
import { userEvent } from "@testing-library/user-event";
import { ValidationRetryMergeRequestComponent } from "./validation-retry-merge-request.component";
import { MergeRequestDetailsFormComponent } from "../../upgrade-process/merge-request-details-form/merge-request-details-form.component";
import {
  ValidationProcessStageStatus,
  ValidationProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";

const MOCK_IMPORTS = [
  Button,
  Dialog,
  ReactiveFormsModule,
  MockComponent(MergeRequestDetailsFormComponent),
];

const REQUIRED_INPUTS = {
  projectId: "projectId",
  processId: "processId",
  stageStatus: ValidationProcessStageStatus.PENDING_INPUT,
  developmentId: "developmentId",
  supportsResourceManagement: true,
  parentBranchName: "parentBranchName",
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
  reloadProcessDetails: jest.fn(),
};

const mockToastMessageService = {
  showError: jest.fn(),
  showSuccess: jest.fn(),
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return await render(ValidationRetryMergeRequestComponent, {
    imports: MOCK_IMPORTS,
    inputs: { ...REQUIRED_INPUTS, ...inputs },
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
  fixture: ComponentFixture<ValidationRetryMergeRequestComponent>
) {
  fixture.componentInstance.mergeRequestControl.setErrors(null);
  fixture.componentInstance.mergeRequestControl.setValue({
    mergeRequestTitle: CUSTOM_MR_TITLE,
    destinationBranch: MOCK_MERGE_CONFIGURATION,
    reviewers: CUSTOM_REVIEWERS,
    deleteBranch: { shouldDelete: true, developmentId: "developmentId" },
  });
}

describe("ValidationRetryMergeRequestComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStateUpdater.sendChangesForReview.mockReturnValue(of(void 0));
  });

  it("shows the Merge button when stage status is pending input", async () => {
    await renderComponent();
    expect(screen.getByRole("button", { name: /^Merge/ })).toBeInTheDocument();
  });

  it("hides the Merge button when stage status is not pending input", async () => {
    await renderComponent({ stageStatus: ValidationProcessStageStatus.FAILED });
    expect(
      screen.queryByRole("button", { name: /^Merge/ })
    ).not.toBeInTheDocument();
  });

  it("prompts the user to fill the merge request details", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByRole("button", { name: /^Merge/ }));

    expect(
      ngMocks.find(fixture, MergeRequestDetailsFormComponent)
    ).toBeTruthy();
  });

  it("sends changes for review when the user submits valid merge request details", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByRole("button", { name: /^Merge/ }));
    setValidMergeRequestDetails(fixture);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Send" })).toBeEnabled()
    );

    await user.click(screen.getByRole("button", { name: "Send" }));

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

  it("shows a success message when changes are sent for review", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();
    await user.click(screen.getByRole("button", { name: /^Merge/ }));
    setValidMergeRequestDetails(fixture);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Send" })).toBeEnabled()
    );

    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(mockToastMessageService.showSuccess).toHaveBeenCalledWith(
      "Changes sent for review."
    );
  });

  it("reloads process details when changes are sent for review", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();
    await user.click(screen.getByRole("button", { name: /^Merge/ }));
    setValidMergeRequestDetails(fixture);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Send" })).toBeEnabled()
    );

    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(mockStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
      "processId",
      "projectId"
    );
  });

  it("shows an error message when sending changes for review fails", async () => {
    const errorMessage = "Failed to send changes for review.";
    mockStateUpdater.sendChangesForReview.mockReturnValue(
      throwError(() => new Error(errorMessage))
    );

    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByRole("button", { name: /^Merge/ }));
    setValidMergeRequestDetails(fixture);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Send" })).toBeEnabled()
    );

    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(mockToastMessageService.showError).toHaveBeenCalledWith(
      errorMessage
    );
  });

  it("disables the Send button while sending changes for review", async () => {
    const subject = new Subject<void>();
    mockStateUpdater.sendChangesForReview.mockReturnValue(
      subject.asObservable()
    );

    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByRole("button", { name: /^Merge/ }));
    setValidMergeRequestDetails(fixture);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Send" })).toBeEnabled()
    );

    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    subject.next();
    subject.complete();
  });
});
