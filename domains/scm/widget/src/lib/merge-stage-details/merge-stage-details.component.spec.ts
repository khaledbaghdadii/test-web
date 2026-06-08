import { render, screen } from "@testing-library/angular";
import {
  MergeStageDetailsComponent,
  MergeStageData,
} from "./merge-stage-details.component";

const BASE_DATA: MergeStageData = {
  mergeRequestState: "MERGED",
  developmentName: "feature/my-branch",
  destinationBranch: "main",
  endDate: "2026-05-01T10:00:00Z",
};

async function renderComponent(data: Partial<MergeStageData> = {}) {
  return render(MergeStageDetailsComponent, {
    inputs: { data: { ...BASE_DATA, ...data } },
  });
}

describe("MergeStageDetailsComponent", () => {
  describe("header", () => {
    it("shows Successful header for MERGED state", async () => {
      await renderComponent({
        mergeRequestState: "MERGED",
        destinationBranch: "main",
      });
      expect(screen.getByTestId("merge-header").textContent).toContain(
        "Merge into 'main' is Successful!"
      );
    });

    it("shows Failed header for MERGE_FAILED state", async () => {
      await renderComponent({
        mergeRequestState: "MERGE_FAILED",
        destinationBranch: "main",
      });
      expect(screen.getByTestId("merge-header").textContent).toContain(
        "Merge into 'main' is Failed!"
      );
    });
  });

  describe("merge status", () => {
    it("shows Successful tag for MERGED state", async () => {
      await renderComponent({ mergeRequestState: "MERGED" });
      expect(screen.getByText("Successful")).toBeTruthy();
    });

    it("shows Failed tag for MERGE_FAILED state", async () => {
      await renderComponent({ mergeRequestState: "MERGE_FAILED" });
      expect(screen.getByText("Failed")).toBeTruthy();
    });

    it("returns success severity for MERGED state", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "MERGED",
      });
      expect(fixture.componentInstance.mergeStatusSeverity()).toBe("success");
    });

    it("returns danger severity for MERGE_FAILED state", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "MERGE_FAILED",
      });
      expect(fixture.componentInstance.mergeStatusSeverity()).toBe("danger");
    });
  });

  describe("failure reason", () => {
    it("shows failure reason message for TECHNICAL_FAILURE", async () => {
      await renderComponent({
        mergeRequestState: "MERGE_FAILED",
        failureReason: "TECHNICAL_FAILURE",
      });
      expect(screen.getByTestId("merge-failure-reason").textContent).toContain(
        "Merge failed due to a technical failure"
      );
    });

    it("shows dash failure reason when no reason provided", async () => {
      await renderComponent({ mergeRequestState: "MERGED" });
      expect(
        screen.getByTestId("merge-failure-reason").textContent?.trim()
      ).toBe("-");
    });

    it("shows PR_DECLINED failure message", async () => {
      await renderComponent({
        mergeRequestState: "MERGE_FAILED",
        failureReason: "PR_DECLINED",
      });
      expect(screen.getByTestId("merge-failure-reason").textContent).toContain(
        "Merge failed due to declined pull request"
      );
    });

    it("shows same declined message for PR_UNAPPROVED", async () => {
      await renderComponent({
        mergeRequestState: "MERGE_FAILED",
        failureReason: "PR_UNAPPROVED",
      });
      expect(screen.getByTestId("merge-failure-reason").textContent).toContain(
        "Merge failed due to declined pull request"
      );
    });

    it("shows deleted message for PR_DELETED", async () => {
      await renderComponent({
        mergeRequestState: "MERGE_FAILED",
        failureReason: "PR_DELETED",
      });
      expect(screen.getByTestId("merge-failure-reason").textContent).toContain(
        "Merge failed due to deleted merge request"
      );
    });

    it("shows deleted message for MERGE_REQUEST_NOT_FOUND", async () => {
      await renderComponent({
        mergeRequestState: "MERGE_FAILED",
        failureReason: "MERGE_REQUEST_NOT_FOUND",
      });
      expect(screen.getByTestId("merge-failure-reason").textContent).toContain(
        "Merge failed due to deleted merge request"
      );
    });

    it("shows unmergeable message for PR_NOT_MERGEABLE", async () => {
      await renderComponent({
        mergeRequestState: "MERGE_FAILED",
        failureReason: "PR_NOT_MERGEABLE",
      });
      expect(screen.getByTestId("merge-failure-reason").textContent).toContain(
        "Merge failed due to unmergeable merge request"
      );
    });

    it("shows raw reason for unknown failure reason", async () => {
      await renderComponent({
        mergeRequestState: "MERGE_FAILED",
        failureReason: "UNKNOWN_REASON",
      });
      expect(screen.getByTestId("merge-failure-reason").textContent).toContain(
        "UNKNOWN_REASON"
      );
    });
  });

  describe("in-progress state", () => {
    it("shows In Progress header for MERGING state", async () => {
      await renderComponent({
        mergeRequestState: "MERGING",
        destinationBranch: "main",
      });
      expect(screen.getByTestId("merge-header").textContent).toContain(
        "Merge into 'main' is In Progress"
      );
    });

    it("returns info severity for in-progress state", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "MERGING",
      });
      expect(fixture.componentInstance.mergeStatusSeverity()).toBe("info");
    });

    it("shows In Progress label for in-progress state", async () => {
      const { fixture } = await renderComponent({
        mergeRequestState: "MERGING",
      });
      expect(fixture.componentInstance.mergeStatusLabel()).toBe("In Progress");
    });
  });
});
