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
import { Message } from "primeng/message";
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
      MockComponent(Message),
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

    it("forwards the selector saved event as priorityUpdated", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "QUEUED",
        mergeRequestPriority: "HIGH",
      });
      const emitted = jest.fn();
      fixture.componentInstance.priorityUpdated.subscribe(emitted);

      const selector = ngMocks.find(MergeRequestPrioritySelectorComponent);
      ngMocks.output(selector, "saved").emit();

      expect(emitted).toHaveBeenCalled();
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
      expect(screen.getByText("Commits")).toBeTruthy();
      expect(
        screen.getByText(
          "The below commits couldn't be rebased from feature/my-branch to main due to merge conflicts."
        )
      ).toBeTruthy();
      expect(
        document.querySelector("mxevolve-paginated-commits-difference")
      ).toBeTruthy();
    });

    it("shows the failed rebase tag with the cancel icon", async () => {
      await renderComponent({
        mergeRequestState: "UNDER_VALIDATION_FAILED",
        failureReason: "REBASE_CONFLICT",
      });

      expect(screen.getByTestId("rebase-status-tag")).toHaveTextContent(
        "Failed"
      );
      const cancelIcon = ngMocks
        .findAll(MxevolveIconComponent)
        .find((icon) => ngMocks.input(icon, "name") === "cancel");
      expect(cancelIcon).toBeTruthy();
      expect(ngMocks.input(cancelIcon, "size")).toBe("sm");
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

  describe("Sequential vs Bulk scenario executions", () => {
    it("renders only the Sequential Execution section when all builds are sequential", async () => {
      await renderComponent({
        mergeRequestState: "UNDER_VALIDATION",
        builds: [
          {
            id: "build-1",
            scenarioExecutionId: "seq-1",
            bulkMode: false,
            createdOn: "2026-01-01T10:00:00Z",
          },
          {
            id: "build-2",
            scenarioExecutionId: "seq-2",
            bulkMode: false,
            createdOn: "2026-01-01T11:00:00Z",
          },
        ],
      });
      expect(screen.getByText("Sequential Execution")).toBeTruthy();
      expect(screen.queryByText("Bulk Execution")).toBeNull();
      const scenarioRuns = ngMocks.findAll(ScenarioRunsComponent);
      expect(scenarioRuns).toHaveLength(1);
      expect(ngMocks.input(scenarioRuns[0], "scenarioRunIds")).toEqual([
        "seq-1",
        "seq-2",
      ]);
    });

    it("renders only the Bulk Execution section when all builds are bulk", async () => {
      await renderComponent({
        mergeRequestState: "UNDER_VALIDATION",
        builds: [
          {
            id: "build-1",
            scenarioExecutionId: "bulk-1",
            bulkMode: true,
            createdOn: "2026-01-01T10:00:00Z",
          },
        ],
      });
      expect(screen.getByText("Bulk Execution")).toBeTruthy();
      expect(screen.queryByText("Sequential Execution")).toBeNull();
      const scenarioRuns = ngMocks.findAll(ScenarioRunsComponent);
      expect(scenarioRuns).toHaveLength(1);
      expect(ngMocks.input(scenarioRuns[0], "scenarioRunIds")).toEqual([
        "bulk-1",
      ]);
    });

    it("renders both sections when builds mix sequential and bulk", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "UNDER_VALIDATION",
        builds: [
          {
            id: "build-1",
            scenarioExecutionId: "seq-1",
            bulkMode: false,
            createdOn: "2026-01-01T10:00:00Z",
          },
          {
            id: "build-2",
            scenarioExecutionId: "bulk-1",
            bulkMode: true,
            createdOn: "2026-01-01T11:00:00Z",
          },
        ],
      });
      expect(screen.getByText("Sequential Execution")).toBeTruthy();
      expect(screen.getByText("Bulk Execution")).toBeTruthy();
      expect(ngMocks.findAll(ScenarioRunsComponent)).toHaveLength(2);
      expect(fixture.componentInstance.sequentialScenarioRunIds()).toEqual([
        "seq-1",
      ]);
      expect(fixture.componentInstance.bulkScenarioRunIds()).toEqual([
        "bulk-1",
      ]);
    });

    it("sorts scenario executions by createdOn ascending within each mode", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "UNDER_VALIDATION",
        builds: [
          {
            id: "build-1",
            scenarioExecutionId: "seq-late",
            bulkMode: false,
            createdOn: "2026-01-02T10:00:00Z",
          },
          {
            id: "build-2",
            scenarioExecutionId: "seq-early",
            bulkMode: false,
            createdOn: "2026-01-01T10:00:00Z",
          },
          {
            id: "build-3",
            scenarioExecutionId: "bulk-late",
            bulkMode: true,
            createdOn: "2026-01-03T10:00:00Z",
          },
          {
            id: "build-4",
            scenarioExecutionId: "bulk-early",
            bulkMode: true,
            createdOn: "2026-01-01T09:00:00Z",
          },
        ],
      });
      expect(fixture.componentInstance.sequentialScenarioRunIds()).toEqual([
        "seq-early",
        "seq-late",
      ]);
      expect(fixture.componentInstance.bulkScenarioRunIds()).toEqual([
        "bulk-early",
        "bulk-late",
      ]);
    });

    it("ignores builds without a scenarioExecutionId", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "UNDER_VALIDATION",
        builds: [
          {
            id: "build-1",
            scenarioExecutionId: "seq-1",
            bulkMode: false,
            createdOn: "2026-01-01T10:00:00Z",
          },
          { id: "build-2", bulkMode: false, createdOn: "2026-01-01T11:00:00Z" },
        ],
      });
      expect(fixture.componentInstance.sequentialScenarioRunIds()).toEqual([
        "seq-1",
      ]);
      expect(fixture.componentInstance.hasScenarioRuns()).toBe(true);
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

  describe("validationFailureReasonMessage computed", () => {
    it("returns dash when no failure reason", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "UNDER_VALIDATION_FAILED",
      });
      expect(fixture.componentInstance.validationFailureReasonMessage()).toBe(
        "-"
      );
    });

    it.each([
      ["PR_UNAPPROVED", "Validation failed due to unapproved merge request"],
      ["PR_DECLINED", "Validation failed due to declined merge request"],
      ["PR_DELETED", "Validation failed due to deleted merge request"],
      [
        "MERGE_REQUEST_NOT_FOUND",
        "Validation failed due to deleted merge request",
      ],
      ["TECHNICAL_FAILURE", "Validation failed due to a technical failure"],
      ["CQG_FAILURE", "Validation failed due to a CQG failure"],
      [
        "PR_NOT_MERGEABLE",
        "Validation failed due to unmergeable merge request",
      ],
      [
        "SCENARIO_EXECUTION_TIMEOUT",
        "Validation failed due to scenario execution timeout",
      ],
      ["UNKNOWN_REASON", "UNKNOWN_REASON"],
    ])(
      "returns correct message for %s",
      async (failureReason, expectedMessage) => {
        const { fixture } = await renderComponent({
          mergeRequestState: "UNDER_VALIDATION_FAILED",
          failureReason,
        });
        expect(fixture.componentInstance.validationFailureReasonMessage()).toBe(
          expectedMessage
        );
      }
    );
  });

  describe("Validation failure message rendered in HTML", () => {
    it.each([
      ["PR_UNAPPROVED", "Validation failed due to unapproved merge request"],
      ["CQG_FAILURE", "Validation failed due to a CQG failure"],
    ])("shows %s failure reason", async (failureReason, expectedMessage) => {
      await renderComponent({
        mergeRequestState: "UNDER_VALIDATION_FAILED",
        failureReason,
      });
      expect(
        screen.getByTestId("validation-failure-message").textContent?.trim()
      ).toBe(expectedMessage);
      expect(screen.getByRole("heading", { name: "Rebase" })).toBeTruthy();
    });

    it.each([
      [
        "REBASE_CONFLICT failure",
        {
          mergeRequestState: "UNDER_VALIDATION_FAILED",
          failureReason: "REBASE_CONFLICT",
        },
      ],
      ["UNDER_VALIDATION state", { mergeRequestState: "UNDER_VALIDATION" }],
      ["QUEUED state", { mergeRequestState: "QUEUED" }],
    ])("does not show section for %s", async (_, data) => {
      await renderComponent(data);
      expect(screen.queryByTestId("validation-failure-message")).toBeNull();
    });
  });
});
