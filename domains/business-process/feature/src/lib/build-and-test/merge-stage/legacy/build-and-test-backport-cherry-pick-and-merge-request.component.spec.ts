import { render, screen } from "@testing-library/angular";
import { MockComponent } from "ng-mocks";
import {
  BuildAndTestBackport,
  CherryPickStatus,
} from "@mxevolve/domains/business-process/util";
import { MergeRequestStepperComponent } from "@mxevolve/domains/scm/widget";
import { BuildAndTestBackportCherryPickAndMergeRequestComponent } from "./build-and-test-backport-cherry-pick-and-merge-request.component";
import { BuildAndTestBackportManualCherryPickComponent } from "./build-and-test-backport-manual-cherry-pick.component";

describe("BuildAndTestBackportCherryPickAndMergeRequestComponent", () => {
  it("shows the automatic cherry-pick in-progress message", async () => {
    await renderComponent(CherryPickStatus.AUTOMATIC_CHERRY_PICK_IN_PROGRESS);

    expect(
      screen.getByText(
        "Automatic cherry picking is in progress. Please refresh the page for the latest update."
      )
    ).toBeInTheDocument();
  });

  it("renders manual cherry-pick when automatic cherry-pick failed", async () => {
    await renderComponent(CherryPickStatus.AUTOMATIC_CHERRY_PICK_FAILED);

    expect(
      document.querySelector(
        "mxevolve-build-and-test-backport-manual-cherry-pick"
      )
    ).toBeTruthy();
  });

  it("renders the backport merge request stepper once commits are picked", async () => {
    await renderComponent(CherryPickStatus.COMMITS_CHERRY_PICKED);

    expect(document.querySelector("mxevolve-merge-request-stepper")).toBeTruthy();
  });

  function renderComponent(cherryPickStatus: CherryPickStatus) {
    return render(BuildAndTestBackportCherryPickAndMergeRequestComponent, {
      inputs: {
        projectId: "project-1",
        processId: "process-1",
        repositoryId: "repository-1",
        backport: {
          initializeDevelopmentState: {},
          applyBackportDevelopmentState: { cherryPickStatus },
          mergeDevelopmentState: { latestMergeJobId: "merge-job-1" },
        } as BuildAndTestBackport,
      },
      componentImports: [
        MockComponent(BuildAndTestBackportManualCherryPickComponent),
        MockComponent(MergeRequestStepperComponent),
      ],
    });
  }
});
