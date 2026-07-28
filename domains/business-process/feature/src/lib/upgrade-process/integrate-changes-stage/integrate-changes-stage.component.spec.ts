import { render, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { IntegrateChangesStageComponent } from "./integrate-changes-stage.component";
import { MergeRequestStepperComponent } from "@mxevolve/domains/scm/widget";
import { FinalProductDetailsComponent } from "@mxevolve/domains/artifact/widget";
import {
  FixIssuesComponent,
  RetryMergeRequestComponent,
} from "@mxevolve/domains/business-process/composite-widget";
import { StageStatus } from "@mxevolve/domains/business-process/util";

const MOCK_IMPORTS = [
  MockComponent(MergeRequestStepperComponent),
  MockComponent(FinalProductDetailsComponent),
  MockComponent(RetryMergeRequestComponent),
  MockComponent(FixIssuesComponent),
];

const REQUIRED_INPUTS = {
  projectId: "project-1",
  processId: "process-1",
  latestMergeRequestId: "merge-req-1",
  developmentId: "development-1",
  stageStatus: StageStatus.PENDING_INPUT,
  supportsResourceManagement: true,
  parentBranchName: "main",
};

async function renderComponent(
  inputs: Partial<typeof REQUIRED_INPUTS> & { finalProductId?: string } = {}
) {
  return render(IntegrateChangesStageComponent, {
    imports: MOCK_IMPORTS,
    inputs: { ...REQUIRED_INPUTS, ...inputs },
  });
}

describe("IntegrateChangesStageComponent", () => {
  it("renders the merge request stepper with the given mergeRequestId", async () => {
    const { fixture } = await renderComponent({
      latestMergeRequestId: "mr-42",
    });

    await waitFor(() => {
      const stepper = ngMocks.find(fixture, MergeRequestStepperComponent);
      expect(ngMocks.input(stepper, "mergeRequestId")).toBe("mr-42");
    });
  });

  it("does not render the Final Product Details section when finalProductId is not set", async () => {
    await renderComponent();

    await waitFor(() => {
      expect(
        document.querySelector("mxevolve-final-product-details")
      ).toBeNull();
    });
  });

  it("renders the Final Product Details section when finalProductId is set", async () => {
    const { fixture } = await renderComponent({ finalProductId: "fp-99" });

    await waitFor(() => {
      expect(
        document.querySelector("mxevolve-final-product-details")
      ).toBeTruthy();
      const details = ngMocks.find(fixture, FinalProductDetailsComponent);
      expect(ngMocks.input(details, "finalProductId")).toBe("fp-99");
      expect(ngMocks.input(details, "projectId")).toBe("project-1");
    });
  });

  it("renders the retry merge request action", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() => {
      const retry = ngMocks.find(fixture, RetryMergeRequestComponent);
      expect(ngMocks.input(retry, "processId")).toBe("process-1");
    });
  });

  it("renders the fix issues action", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() => {
      const fixIssues = ngMocks.find(fixture, FixIssuesComponent);
      expect(ngMocks.input(fixIssues, "processId")).toBe("process-1");
    });
  });
});
