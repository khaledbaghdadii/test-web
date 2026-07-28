import { render, screen, waitFor } from "@testing-library/angular";
import { of, Subject, throwError } from "rxjs";
import userEvent from "@testing-library/user-event";
import { Button } from "primeng/button";
import { ValidationFixIssuesComponent } from "./validation-fix-issues.component";
import {
  ValidationProcessStageStatus,
  ValidationProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";

const MOCK_IMPORTS = [Button];

const REQUIRED_INPUTS = {
  projectId: "projectId",
  processId: "processId",
  stageStatus: ValidationProcessStageStatus.PENDING_INPUT,
};

const mockStateUpdater = {
  reopenMergeRequest: jest.fn(),
  reloadProcessDetails: jest.fn(),
};

const mockToastMessageService = {
  showError: jest.fn(),
  showSuccess: jest.fn(),
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return await render(ValidationFixIssuesComponent, {
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

describe("ValidationFixIssuesComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStateUpdater.reopenMergeRequest.mockReturnValue(of(void 0));
  });

  it("shows the Fix button when stage status is pending input", async () => {
    await renderComponent();
    expect(screen.getByRole("button", { name: "Re-open" })).toBeInTheDocument();
  });

  it("hides the Fix button when stage status is not pending input", async () => {
    await renderComponent({ stageStatus: ValidationProcessStageStatus.FAILED });
    expect(
      screen.queryByRole("button", { name: "Fix" })
    ).not.toBeInTheDocument();
  });

  it("reopens the merge request when the Fix button is clicked", async () => {
    const user = userEvent.setup();
    await renderComponent();
    await user.click(screen.getByRole("button", { name: "Re-open" }));
    expect(mockStateUpdater.reopenMergeRequest).toHaveBeenCalledWith(
      "projectId",
      "processId"
    );
  });

  it("shows a success message when reopening succeeds", async () => {
    const user = userEvent.setup();
    await renderComponent();
    await user.click(screen.getByRole("button", { name: "Re-open" }));
    expect(mockToastMessageService.showSuccess).toHaveBeenCalledWith(
      "Successfully transitioned to fixing issues."
    );
  });

  it("reloads process details when reopening succeeds", async () => {
    const user = userEvent.setup();
    await renderComponent();
    await user.click(screen.getByRole("button", { name: "Re-open" }));
    expect(mockStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
      "processId",
      "projectId"
    );
  });

  it("shows an error message when reopening fails", async () => {
    mockStateUpdater.reopenMergeRequest.mockReturnValue(
      throwError(() => new Error("boom"))
    );
    const user = userEvent.setup();
    await renderComponent();
    await user.click(screen.getByRole("button", { name: "Re-open" }));
    expect(mockToastMessageService.showError).toHaveBeenCalledWith(
      "An error occurred while transitioning to fixing issues."
    );
  });

  it("disables the Fix button while the request is in progress", async () => {
    const subject = new Subject<void>();
    mockStateUpdater.reopenMergeRequest.mockReturnValue(subject.asObservable());
    const user = userEvent.setup();
    await renderComponent();
    await user.click(screen.getByRole("button", { name: "Re-open" }));

    expect(screen.getByRole("button", { name: "Re-open" })).toBeDisabled();

    subject.next();
    subject.complete();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Re-open" })).not.toBeDisabled()
    );
  });
});
