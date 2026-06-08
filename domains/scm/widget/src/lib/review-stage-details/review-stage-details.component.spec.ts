import { render, screen } from "@testing-library/angular";
import { MockComponent, MockDirective, ngMocks } from "ng-mocks";
import {
  ReviewStageDetailsComponent,
  ReviewStageData,
} from "./review-stage-details.component";
import { MergeRequestPrioritySelectorComponent } from "../merge-request-priority-selector/merge-request-priority-selector.component";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { ToastMessageService } from "@mxflow/ui/alert";

const mockToastService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const DEFAULT_DATA: ReviewStageData = {
  mergeRequestId: "MR-123",
  mergeRequestState: "IN_REVIEW",
  destinationBranch: "main",
  pullRequestUrl: "https://bitbucket.example.com/pr/1",
  id: "internal-id-1",
  projectId: "project-1",
  mergeRequestPriority: "MEDIUM",
};

async function renderComponent(data: ReviewStageData = DEFAULT_DATA) {
  const result = await render(ReviewStageDetailsComponent, {
    inputs: { data },
    componentImports: [
      MockComponent(MergeRequestPrioritySelectorComponent),
      MockDirective(ShowElementIfAuthorizedDirective),
    ],
    componentProviders: [
      { provide: ToastMessageService, useValue: mockToastService },
    ],
  });
  ngMocks
    .findInstances(ShowElementIfAuthorizedDirective)
    .forEach((d) => ngMocks.render(d, d));
  result.fixture.detectChanges();
  return result;
}

describe("ReviewStageDetailsComponent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("displays merge request ID", async () => {
    await renderComponent();
    expect(screen.getByText("MR-123")).toBeTruthy();
  });

  it("displays destination branch", async () => {
    await renderComponent();
    expect(screen.getByText("main")).toBeTruthy();
  });

  it("displays View Comments link with correct href", async () => {
    await renderComponent();
    const link = screen.getByText("View Comments");
    expect(link).toBeTruthy();
    expect(link.closest("a")?.getAttribute("href")).toBe(
      "https://bitbucket.example.com/pr/1"
    );
    expect(link.closest("a")?.getAttribute("target")).toBe("_blank");
  });

  it("shows 'Under Review' status for IN_REVIEW state", async () => {
    await renderComponent({ ...DEFAULT_DATA, mergeRequestState: "IN_REVIEW" });
    expect(screen.getByText("Under Review")).toBeTruthy();
  });

  it("shows 'Failed' status for REVIEW_FAILED state", async () => {
    await renderComponent({
      ...DEFAULT_DATA,
      mergeRequestState: "REVIEW_FAILED",
    });
    expect(screen.getByText("Failed")).toBeTruthy();
  });

  it("shows 'Approved' status for MERGED state", async () => {
    await renderComponent({ ...DEFAULT_DATA, mergeRequestState: "MERGED" });
    expect(screen.getByText("Approved")).toBeTruthy();
  });

  it("shows 'Not Mergeable' status with danger severity for IN_REVIEW_NOT_MERGEABLE state", async () => {
    const { fixture } = await renderComponent({
      ...DEFAULT_DATA,
      mergeRequestState: "IN_REVIEW_NOT_MERGEABLE",
    });
    expect(screen.getByText("Not Mergeable")).toBeTruthy();
    expect(fixture.componentInstance.reviewStatusSeverity()).toBe("danger");
  });

  it("shows 'Declined' status with danger severity for DECLINED state", async () => {
    const { fixture } = await renderComponent({
      ...DEFAULT_DATA,
      mergeRequestState: "DECLINED",
    });
    expect(screen.getByText("Declined")).toBeTruthy();
    expect(fixture.componentInstance.reviewStatusSeverity()).toBe("danger");
  });

  it("shows 'Deleted' status with danger severity for DELETED state", async () => {
    const { fixture } = await renderComponent({
      ...DEFAULT_DATA,
      mergeRequestState: "DELETED",
    });
    expect(screen.getByText("Deleted")).toBeTruthy();
    expect(fixture.componentInstance.reviewStatusSeverity()).toBe("danger");
  });

  it("renders the blockchain distribution illustration", async () => {
    await renderComponent();
    const illustration = document.querySelector("mxevolve-illustration");
    expect(illustration).toBeTruthy();
    expect(illustration?.getAttribute("name")).toBe("blockchain_distribution");
  });

  describe("priority selector", () => {
    it("renders priority selector when state is IN_REVIEW", async () => {
      await renderComponent({
        ...DEFAULT_DATA,
        mergeRequestState: "IN_REVIEW",
      });
      expect(
        document.querySelector("mxevolve-merge-request-priority-selector")
      ).toBeTruthy();
    });

    it("does not render priority selector when state is not IN_REVIEW", async () => {
      await renderComponent({ ...DEFAULT_DATA, mergeRequestState: "QUEUED" });
      expect(
        document.querySelector("mxevolve-merge-request-priority-selector")
      ).toBeNull();
    });

    it("passes correct authorization data to showIfAuthorized", async () => {
      await renderComponent({
        ...DEFAULT_DATA,
        mergeRequestState: "IN_REVIEW",
      });
      const directive = ngMocks.findInstances(
        ShowElementIfAuthorizedDirective
      )[0];
      expect(directive.showElementIfAuthorized).toEqual({
        action: "update_priority",
        attributes: {},
        package: "scm",
        resource: "merge_request",
      });
    });
  });
});
