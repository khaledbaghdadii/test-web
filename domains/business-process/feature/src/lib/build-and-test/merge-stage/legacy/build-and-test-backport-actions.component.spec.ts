import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of } from "rxjs";
import {
  BuildAndTestProcessStateUpdaterService,
  BuildAndTestUserInputService,
} from "@mxevolve/domains/business-process/data-access";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import { BuildAndTestBackportActionsComponent } from "./build-and-test-backport-actions.component";

describe("BuildAndTestBackportActionsComponent", () => {
  const userInputService = {
    repushBackportMergeRequest: jest.fn(),
  };
  const stateUpdater = {
    reloadProcessDetails: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    userInputService.repushBackportMergeRequest.mockReturnValue(of(undefined));
  });

  it("disables repush when backend says backport cannot be repushed", async () => {
    await renderComponent({ canRepushBackport: false });

    expect(
      screen.getByRole("button", { name: "Repush Backport Merge Request" })
    ).toBeDisabled();
  });

  it("disables repush when the CI process failed", async () => {
    await renderComponent({ processStatus: ExecutionStatus.FAILED });

    expect(
      screen.getByRole("button", { name: "Repush Backport Merge Request" })
    ).toBeDisabled();
  });

  it("repushes the backport merge request and reloads the process", async () => {
    await renderComponent();

    await userEvent.click(screen.getByText("Repush Backport Merge Request"));

    expect(userInputService.repushBackportMergeRequest).toHaveBeenCalledWith({
      projectId: "project-1",
      processId: "process-1",
      mergeConfigurationId: "merge-config-1",
    });
    expect(stateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
      "process-1",
      "project-1"
    );
  });

  function renderComponent(
    overrides: Partial<{
      canRepushBackport: boolean;
      processStatus: ExecutionStatus;
    }> = {}
  ) {
    return render(BuildAndTestBackportActionsComponent, {
      inputs: {
        projectId: "project-1",
        processId: "process-1",
        mergeConfigurationId: "merge-config-1",
        canRepushBackport: overrides.canRepushBackport ?? true,
        processStatus: overrides.processStatus ?? ExecutionStatus.RUNNING,
      },
      componentProviders: [
        { provide: BuildAndTestUserInputService, useValue: userInputService },
        { provide: BuildAndTestProcessStateUpdaterService, useValue: stateUpdater },
      ],
    });
  }
});
