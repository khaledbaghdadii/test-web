import { render, screen, waitFor } from "@testing-library/angular";
import { RetryMergeRequestComponent } from "./retry-merge-request.component";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { ReactiveFormsModule } from "@angular/forms";
import { MergeRequestDetailsFormComponent } from "../merge-request-details-form/merge-request-details-form.component";
import { MockComponent, ngMocks } from "ng-mocks";
import {
  SendChangesForReviewService,
  UpgradeProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { StageStatus } from "@mxevolve/domains/business-process/util";
import { userEvent } from "@testing-library/user-event";
import { ComponentFixture } from "@angular/core/testing";
import { of, Subject, throwError } from "rxjs";

const MOCK_IMPORTS = [
  Button,
  Dialog,
  ReactiveFormsModule,
  MockComponent(MergeRequestDetailsFormComponent),
];

const REQUIRED_INPUTS = {
  projectId: "projectId",
  processId: "processId",
  stageStatus: StageStatus.PENDING_INPUT,
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

const mockSendChangesForReviewService = {
  sendChangesForReview: jest.fn(),
};

const mockUpgradeProcessStateUpdaterService = {
  reloadProcessDetails: jest.fn(),
};

const mockToastMessageService = {
  showError: jest.fn(),
  showSuccess: jest.fn(),
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return await render(RetryMergeRequestComponent, {
    imports: MOCK_IMPORTS,
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      {
        provide: SendChangesForReviewService,
        useValue: mockSendChangesForReviewService,
      },
      {
        provide: UpgradeProcessStateUpdaterService,
        useValue: mockUpgradeProcessStateUpdaterService,
      },
    ],
    providers: [
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });
}

function setInvalidMergeRequestDetails(
  fixture: ComponentFixture<RetryMergeRequestComponent>
) {
  fixture.componentInstance.mergeRequestControl.setErrors({ invalid: true });
}

function setValidMergeRequestDetails(
  fixture: ComponentFixture<RetryMergeRequestComponent>
) {
  fixture.componentInstance.mergeRequestControl.setErrors(null);
  fixture.componentInstance.mergeRequestControl.setValue({
    mergeRequestTitle: CUSTOM_MR_TITLE,
    destinationBranch: MOCK_MERGE_CONFIGURATION,
    reviewers: CUSTOM_REVIEWERS,
    deleteBranch: { shouldDelete: true, developmentId: "developmentId" },
  });
}

describe("Retry merge request component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendChangesForReviewService.sendChangesForReview.mockReturnValue(
      of(void 0)
    );
  });

  it("should be visible when stage status is pending input", async () => {
    await renderComponent();

    expect(screen.getByRole("button", { name: /^Merge/ })).toBeInTheDocument();
  });

  it("should be hidden when stage status is not pending input", async () => {
    await renderComponent({ stageStatus: StageStatus.FAILED });
    expect(
      screen.queryByRole("button", { name: /^Merge/ })
    ).not.toBeInTheDocument();
  });

  it("should prompt the user to fill the merge request details", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByRole("button", { name: /^Merge/ }));

    const mergeRequestDetailsForm = ngMocks.find(
      fixture,
      MergeRequestDetailsFormComponent
    );
    expect(mergeRequestDetailsForm).toBeTruthy();
  });

  it("should keep the submit button disabled until the merge request details form is valid", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByRole("button", { name: /^Merge/ }));

    setInvalidMergeRequestDetails(fixture);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Send" })).toBeDisabled()
    );
  });

  it("should send changes for review when the user submit the merge request details form", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByRole("button", { name: /^Merge/ }));

    setValidMergeRequestDetails(fixture);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Send" })).toBeEnabled()
    );

    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(
      mockSendChangesForReviewService.sendChangesForReview
    ).toHaveBeenCalledWith({
      projectId: "projectId",
      processId: "processId",
      mergeConfigurationId: "mc-1",
      mergeJobTitle: CUSTOM_MR_TITLE,
      mergeJobReviewers: ["reviewer1", "reviewer2"],
      shouldCleanDevelopment: true,
      developmentId: "developmentId",
      supportsResourceManagement: true,
    });
  });

  it("should show a success message and update the upgrade process state when changes are sent for review successfully", async () => {
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
    expect(
      mockUpgradeProcessStateUpdaterService.reloadProcessDetails
    ).toHaveBeenCalledWith("processId", "projectId");
  });

  it("should show an error message when sending changes for review fails", async () => {
    const errorMessage = "Failed to send changes for review.";
    mockSendChangesForReviewService.sendChangesForReview.mockReturnValue(
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

  it("should disable the submit button and show loading state while sending changes for review", async () => {
    const subject = new Subject<void>();
    mockSendChangesForReviewService.sendChangesForReview.mockReturnValue(
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

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Send" })).toBeEnabled()
    );
  });

  it("should re-enable the submit button if sending changes for review fails", async () => {
    const subject = new Subject<void>();
    mockSendChangesForReviewService.sendChangesForReview.mockReturnValue(
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
    subject.error(new Error("Failed to send changes for review."));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Send" })).toBeEnabled()
    );
  });
});
