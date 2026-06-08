import { render, screen } from "@testing-library/angular";
import { MockComponent, MockDirective, ngMocks } from "ng-mocks";
import { DatePipe } from "@angular/common";
import {
  UnderValidationStageDetailsComponent,
  UnderValidationStageData,
} from "./under-validation-stage-details.component";
import { ScenarioRunsComponent } from "@mxevolve/domains/test/widget";
import { PaginatedCommitsDifferenceComponent } from "../paginated-commits-difference/paginated-commits-difference.component";
import { MergeRequestPrioritySelectorComponent } from "../merge-request-priority-selector/merge-request-priority-selector.component";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  MxevolveIllustrationComponent,
  MxevolveIconComponent,
} from "@mxevolve/shared/ui/primitive";
import { Tag } from "primeng/tag";

const mockToastService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const BASE_DATA: UnderValidationStageData = {
  mergeRequestState: "QUEUED",
  developmentName: "feature/my-branch",
  destinationBranch: "main",
  projectId: "project-1",
  mergeRequestId: "mr-001",
  repositoryId: "repo-1",
  sourceBranch: "feature/my-branch",
};

async function renderComponent(data: Partial<UnderValidationStageData> = {}) {
  const result = await render(UnderValidationStageDetailsComponent, {
    inputs: { data: { ...BASE_DATA, ...data } },
    componentImports: [
      DatePipe,
      MockComponent(Tag),
      MockComponent(ScenarioRunsComponent),
      MockComponent(PaginatedCommitsDifferenceComponent),
      MockComponent(MergeRequestPrioritySelectorComponent),
      MockComponent(MxevolveIllustrationComponent),
      MockComponent(MxevolveIconComponent),
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

describe("UnderValidationStageDetailsComponent", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("Queue info cards (always shown)", () => {
    it("shows queue position when provided", async () => {
      await renderComponent({ mergeRequestState: "QUEUED", queuePosition: 3 });
      expect(screen.getByText("3")).toBeTruthy();
    });

    it("hides queue position card when queuePosition is undefined", async () => {
      await renderComponent({
        mergeRequestState: "QUEUED",
        queuePosition: undefined,
        isLastBuildInBulkMode: false,
      });
      expect(screen.queryByText("Place in Queue")).toBeNull();
    });

    it("shows merge mode as Sequential Mode", async () => {
      await renderComponent({
        mergeRequestState: "QUEUED",
        isLastBuildInBulkMode: false,
      });
      expect(screen.getByText("Sequential Mode")).toBeTruthy();
    });

    it("shows merge mode as Bulk Mode", async () => {
      await renderComponent({
        mergeRequestState: "QUEUED",
        isLastBuildInBulkMode: true,
      });
      expect(screen.getByText("Bulk Mode")).toBeTruthy();
    });

    it("shows N/A when isLastBuildInBulkMode is not set", async () => {
      await renderComponent({
        mergeRequestState: "QUEUED",
      });
      expect(screen.getByText("N/A")).toBeTruthy();
    });

    it("shows merge priority when provided", async () => {
      await renderComponent({
        mergeRequestState: "QUEUED",
        mergeRequestPriority: "HIGH",
      });
      expect(screen.getByText("High")).toBeTruthy();
    });

    it("shows Medium priority by default when no priority is provided", async () => {
      await renderComponent({
        mergeRequestState: "QUEUED",
        isLastBuildInBulkMode: false,
      });
      expect(screen.getByText("Medium")).toBeTruthy();
    });

    it("shows queue info even in non-queued states", async () => {
      await renderComponent({
        mergeRequestState: "UNDER_VALIDATION",
        isLastBuildInBulkMode: false,
      });
      expect(screen.getByText("Sequential Mode")).toBeTruthy();
    });
  });

  describe("QUEUED state", () => {
    it("shows Please Wait illustration", async () => {
      await renderComponent({ mergeRequestState: "QUEUED" });
      expect(screen.getByText("Please Wait")).toBeTruthy();
      expect(screen.getByText("Your merge is in queue")).toBeTruthy();
    });

    it("shows illustration component", async () => {
      await renderComponent({ mergeRequestState: "QUEUED" });
      expect(document.querySelector("mxevolve-illustration")).toBeTruthy();
    });

    it("shows priority selector in QUEUED state", async () => {
      await renderComponent({ mergeRequestState: "QUEUED" });
      expect(
        document.querySelector("mxevolve-merge-request-priority-selector")
      ).toBeTruthy();
    });

    it("passes correct authorization data to showIfAuthorized", async () => {
      await renderComponent({ mergeRequestState: "QUEUED" });
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

    it("passes correct model to priority selector", async () => {
      await renderComponent({
        mergeRequestState: "QUEUED",
        mergeRequestPriority: "HIGH",
      });
      const selector = ngMocks.find(MergeRequestPrioritySelectorComponent);
      expect(ngMocks.input(selector, "mergeRequest")).toEqual({
        id: "mr-001",
        projectId: "project-1",
        mergeRequestPriority: "HIGH",
      });
    });

    it("does not show Rebase section in QUEUED state", async () => {
      await renderComponent({ mergeRequestState: "QUEUED" });
      expect(screen.queryByText("Rebase")).toBeNull();
    });
  });

  describe("UNDER_VALIDATION state (Rebase section)", () => {
    it("shows Rebase heading", async () => {
      await renderComponent({ mergeRequestState: "UNDER_VALIDATION" });
      expect(screen.getByText("Rebase")).toBeTruthy();
    });

    it("shows Rebase Status as Successful", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "UNDER_VALIDATION",
      });
      expect(fixture.componentInstance.rebaseStatusLabel()).toBe("Successful");
    });

    it("does not show priority selector in non-QUEUED state", async () => {
      await renderComponent({ mergeRequestState: "UNDER_VALIDATION" });
      expect(
        document.querySelector("mxevolve-merge-request-priority-selector")
      ).toBeNull();
    });

    it("does not show commits table", async () => {
      await renderComponent({ mergeRequestState: "UNDER_VALIDATION" });
      expect(
        document.querySelector("mxevolve-paginated-commits-difference")
      ).toBeNull();
    });

    it("does not show scenario runs when no builds", async () => {
      await renderComponent({
        mergeRequestState: "UNDER_VALIDATION",
        builds: [],
      });
      expect(document.querySelector("mxevolve-scenario-runs")).toBeNull();
    });

    it("shows scenario runs when builds exist", async () => {
      await renderComponent({
        mergeRequestState: "UNDER_VALIDATION",
        builds: [
          { id: "build-1", scenarioExecutionId: "exec-1", bulkMode: false },
        ],
      });
      expect(document.querySelector("mxevolve-scenario-runs")).toBeTruthy();
    });

    it("passes correct inputs to scenario runs", async () => {
      await renderComponent({
        mergeRequestState: "UNDER_VALIDATION",
        builds: [
          { id: "build-1", scenarioExecutionId: "exec-1", bulkMode: false },
        ],
      });
      const scenarioRuns = ngMocks.find(ScenarioRunsComponent);
      expect(ngMocks.input(scenarioRuns, "projectId")).toBe("project-1");
      expect(ngMocks.input(scenarioRuns, "scenarioRunIds")).toEqual(["exec-1"]);
      expect(ngMocks.input(scenarioRuns, "showEnvironmentDetails")).toBe(false);
      expect(ngMocks.input(scenarioRuns, "showActionButtons")).toBe(false);
      expect(ngMocks.input(scenarioRuns, "showTopBarActions")).toBe(false);
      expect(ngMocks.input(scenarioRuns, "detailsExpandedByDefault")).toBe(
        true
      );
    });
  });

  describe("REBASE_CONFLICT state", () => {
    it("shows Rebase Status as Failed", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "UNDER_VALIDATION_FAILED",
        failureReason: "REBASE_CONFLICT",
      });
      expect(fixture.componentInstance.rebaseStatusLabel()).toBe("Failed");
      expect(fixture.componentInstance.rebaseStatusSeverity()).toBe("danger");
    });

    it("shows commits difference widget", async () => {
      await renderComponent({
        mergeRequestState: "UNDER_VALIDATION_FAILED",
        failureReason: "REBASE_CONFLICT",
      });
      expect(
        document.querySelector("mxevolve-paginated-commits-difference")
      ).toBeTruthy();
    });

    it("passes correct inputs to commits difference", async () => {
      await renderComponent({
        mergeRequestState: "UNDER_VALIDATION_FAILED",
        failureReason: "REBASE_CONFLICT",
      });
      const commits = ngMocks.find(PaginatedCommitsDifferenceComponent);
      expect(ngMocks.input(commits, "projectId")).toBe("project-1");
      expect(ngMocks.input(commits, "repositoryId")).toBe("repo-1");
      expect(ngMocks.input(commits, "source")).toBe("main");
      expect(ngMocks.input(commits, "destination")).toBe("feature/my-branch");
    });

    it("does not show scenario runs for rebase conflict", async () => {
      await renderComponent({
        mergeRequestState: "UNDER_VALIDATION_FAILED",
        failureReason: "REBASE_CONFLICT",
      });
      expect(document.querySelector("mxevolve-scenario-runs")).toBeNull();
    });
  });

  describe("VALIDATION_FAILED state", () => {
    it("shows Rebase Status as Successful (rebase passed, CQG failed)", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "UNDER_VALIDATION_FAILED",
        failureReason: "CQG_FAILURE",
      });
      expect(fixture.componentInstance.rebaseStatusLabel()).toBe("Successful");
    });

    it("does not show commits table for non-rebase failure", async () => {
      await renderComponent({
        mergeRequestState: "UNDER_VALIDATION_FAILED",
        failureReason: "CQG_FAILURE",
      });
      expect(
        document.querySelector("mxevolve-paginated-commits-difference")
      ).toBeNull();
    });

    it("shows scenario runs when builds with scenarioExecutionId exist", async () => {
      await renderComponent({
        mergeRequestState: "UNDER_VALIDATION_FAILED",
        failureReason: "CQG_FAILURE",
        builds: [
          { id: "build-1", scenarioExecutionId: "exec-1", bulkMode: false },
        ],
      });
      expect(document.querySelector("mxevolve-scenario-runs")).toBeTruthy();
    });
  });

  describe("rebaseFailureReason computed", () => {
    it("returns dash when rebase is not failed", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "UNDER_VALIDATION",
      });
      expect(fixture.componentInstance.rebaseFailureReason()).toBe("-");
    });

    it("returns reason text for REBASE_CONFLICT", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "UNDER_VALIDATION_FAILED",
        failureReason: "REBASE_CONFLICT",
      });
      expect(fixture.componentInstance.rebaseFailureReason()).toBe(
        "Lorem ipsum Lorem ipsum"
      );
    });

    it("returns dash for non-rebase failure reasons", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "UNDER_VALIDATION_FAILED",
        failureReason: "CQG_FAILURE",
      });
      expect(fixture.componentInstance.rebaseFailureReason()).toBe("-");
    });
  });

  describe("mergeRequestPriority computed", () => {
    it("returns Critical for CRITICAL priority", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "QUEUED",
        mergeRequestPriority: "CRITICAL",
      });
      expect(fixture.componentInstance.mergeRequestPriority()).toBe("Critical");
    });

    it("returns Medium for MEDIUM priority", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "QUEUED",
        mergeRequestPriority: "MEDIUM",
      });
      expect(fixture.componentInstance.mergeRequestPriority()).toBe("Medium");
    });

    it("returns Low for LOW priority", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "QUEUED",
        mergeRequestPriority: "LOW",
      });
      expect(fixture.componentInstance.mergeRequestPriority()).toBe("Low");
    });
  });
});
