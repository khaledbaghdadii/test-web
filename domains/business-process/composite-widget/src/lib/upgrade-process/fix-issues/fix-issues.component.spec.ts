import { render, screen, waitFor } from "@testing-library/angular";
import { FixIssuesComponent } from "./fix-issues.component";
import { Button } from "primeng/button";
import { StageStatus } from "@mxevolve/domains/business-process/util";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import {
  UpgradeProcessStateUpdaterService,
  FixIssuesService,
} from "@mxevolve/domains/business-process/data-access";
import { of, Subject, throwError } from "rxjs";
import userEvent from "@testing-library/user-event";

const MOCK_IMPORTS = [Button];

const REQUIRED_INPUTS = {
  projectId: "projectId",
  processId: "processId",
  stageStatus: StageStatus.PENDING_INPUT,
};

const mockFixIssuesService = {
  fixIssues: jest.fn(),
};

const mockUpgradeProcessStateUpdaterService = {
  reloadProcessDetails: jest.fn(),
};

const mockToastMessageService = {
  showError: jest.fn(),
  showSuccess: jest.fn(),
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return await render(FixIssuesComponent, {
    imports: MOCK_IMPORTS,
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      { provide: FixIssuesService, useValue: mockFixIssuesService },
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
describe("Fix issues component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFixIssuesService.fixIssues.mockReturnValue(of(void 0));
  });

  it("should show the button when stage status is pending input", async () => {
    await renderComponent();
    expect(screen.getByRole("button", { name: "Fix" })).toBeInTheDocument();
  });

  it("should hide the button when stage status is not pending input", async () => {
    await renderComponent({ stageStatus: StageStatus.FAILED });
    expect(
      screen.queryByRole("button", { name: "Fix" })
    ).not.toBeInTheDocument();
  });

  it("should request to fix issues when the user clicks the fix button", async () => {
    const user = userEvent.setup();
    await renderComponent();
    await user.click(screen.getByRole("button", { name: "Fix" }));
    expect(mockFixIssuesService.fixIssues).toHaveBeenCalledWith(
      "projectId",
      "processId"
    );
  });

  it("should show a success message and reload process details when fix issues succeeds", async () => {
    const user = userEvent.setup();
    await renderComponent();
    await user.click(screen.getByRole("button", { name: "Fix" }));

    expect(mockToastMessageService.showSuccess).toHaveBeenCalledWith(
      "Successfully transitioned to fixing issues."
    );
    expect(
      mockUpgradeProcessStateUpdaterService.reloadProcessDetails
    ).toHaveBeenCalledWith("processId", "projectId");
  });

  it("should show an error message if fix issues request fails", async () => {
    const errorMessage =
      "An error occurred while transitioning to fixing issues.";
    mockFixIssuesService.fixIssues.mockReturnValue(
      throwError(() => new Error(errorMessage))
    );
    const user = userEvent.setup();
    await renderComponent();
    await user.click(screen.getByRole("button", { name: "Fix" }));
    expect(mockToastMessageService.showError).toHaveBeenCalledWith(
      errorMessage
    );
  });

  it("should show a loading state  while request is in progress", async () => {
    const subject = new Subject<void>();
    mockFixIssuesService.fixIssues.mockReturnValue(subject.asObservable());

    const user = userEvent.setup();
    await renderComponent();
    await user.click(screen.getByRole("button", { name: "Fix" }));

    expect(screen.getByRole("button", { name: "Fix" })).toBeDisabled();

    subject.next();
    subject.complete();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Fix" })).not.toBeDisabled()
    );
  });

  it("should keep the button enabled if the request to fix issues fails", async () => {
    const subject = new Subject<void>();
    mockFixIssuesService.fixIssues.mockReturnValue(subject.asObservable());
    const user = userEvent.setup();

    await renderComponent();
    await user.click(screen.getByRole("button", { name: "Fix" }));

    expect(screen.getByRole("button", { name: "Fix" })).toBeDisabled();

    subject.error(new Error("fail"));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Fix" })).toBeEnabled()
    );
  });
});
