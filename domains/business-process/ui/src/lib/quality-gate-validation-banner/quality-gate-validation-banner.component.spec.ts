import { fireEvent, render, screen } from "@testing-library/angular";
import { QualityGateValidationBannerComponent } from "./quality-gate-validation-banner.component";
import {
  QualityGateValidationDecision,
  QualityGateValidationResult,
} from "@mxevolve/domains/business-process/util";

describe("QualityGateValidationBannerComponent", () => {
  it("renders a success badge when decision is PASSED", async () => {
    await render(QualityGateValidationBannerComponent, {
      inputs: {
        validationResult: {
          decision: QualityGateValidationDecision.VALIDATION_PASSED,
          comment: "test",
          requester: "user1",
        } as QualityGateValidationResult,
      },
    });

    expect(screen.getByText("Passed")).toBeTruthy();
  });

  it("renders a danger badge when decision is FAILED", async () => {
    await render(QualityGateValidationBannerComponent, {
      inputs: {
        validationResult: {
          decision: QualityGateValidationDecision.FAILED_AND_STOP_THE_PROCESS,
          comment: "test",
          requester: "user1",
        } as QualityGateValidationResult,
      },
    });

    expect(screen.getByText("Failed")).toBeTruthy();
  });

  it("displays full comment when comment is within truncation limit", async () => {
    const shortComment = "A".repeat(80);
    await render(QualityGateValidationBannerComponent, {
      inputs: {
        validationResult: {
          decision: QualityGateValidationDecision.VALIDATION_PASSED,
          comment: shortComment,
          requester: "user1",
        } as QualityGateValidationResult,
      },
    });

    expect(screen.getByText(shortComment)).toBeTruthy();
    expect(screen.queryByText("see more")).toBeNull();
  });

  it("truncates comment and shows see more when comment exceeds 80 chars", async () => {
    const longComment = "A".repeat(81);
    await render(QualityGateValidationBannerComponent, {
      inputs: {
        validationResult: {
          decision: QualityGateValidationDecision.VALIDATION_PASSED,
          comment: longComment,
          requester: "user1",
        } as QualityGateValidationResult,
      },
    });

    expect(screen.getByText("A".repeat(80) + "...")).toBeTruthy();
    expect(screen.getByText("see more")).toBeTruthy();
  });

  it("expands comment when see more is clicked", async () => {
    const longComment = "A".repeat(81);
    await render(QualityGateValidationBannerComponent, {
      inputs: {
        validationResult: {
          decision: QualityGateValidationDecision.VALIDATION_PASSED,
          comment: longComment,
          requester: "user1",
        } as QualityGateValidationResult,
      },
    });

    fireEvent.click(screen.getByText("see more"));

    expect(screen.getByText(longComment)).toBeTruthy();
    expect(screen.getByText("see less")).toBeTruthy();
  });

  it("collapses comment when see less is clicked", async () => {
    const longComment = "A".repeat(81);
    await render(QualityGateValidationBannerComponent, {
      inputs: {
        validationResult: {
          decision: QualityGateValidationDecision.VALIDATION_PASSED,
          comment: longComment,
          requester: "user1",
        } as QualityGateValidationResult,
      },
    });

    fireEvent.click(screen.getByText("see more"));
    fireEvent.click(screen.getByText("see less"));

    expect(screen.getByText("A".repeat(80) + "...")).toBeTruthy();
    expect(screen.getByText("see more")).toBeTruthy();
  });

  it("shows dash when comment is undefined", async () => {
    await render(QualityGateValidationBannerComponent, {
      inputs: {
        validationResult: {
          decision: QualityGateValidationDecision.VALIDATION_PASSED,
          comment: undefined,
          requester: "user1",
        } as QualityGateValidationResult,
      },
    });

    const commentSection = screen.getByText("Comment").closest("div")!;
    expect(commentSection.textContent).toContain("-");
  });

  it("shows dash when comment is empty string", async () => {
    await render(QualityGateValidationBannerComponent, {
      inputs: {
        validationResult: {
          decision: QualityGateValidationDecision.VALIDATION_PASSED,
          comment: "",
          requester: "user1",
        } as QualityGateValidationResult,
      },
    });

    const commentSection = screen.getByText("Comment").closest("div")!;
    expect(commentSection.textContent).toContain("-");
  });

  it("shows dash when requester is undefined", async () => {
    await render(QualityGateValidationBannerComponent, {
      inputs: {
        validationResult: {
          decision: QualityGateValidationDecision.VALIDATION_PASSED,
          comment: "test",
        } as QualityGateValidationResult,
      },
    });

    const validatedBySection = screen.getByText("Validated by").closest("div")!;
    expect(validatedBySection.textContent).toContain("-");
  });

  it("renders all three sections with separators when all fields present", async () => {
    await render(QualityGateValidationBannerComponent, {
      inputs: {
        validationResult: {
          decision: QualityGateValidationDecision.VALIDATION_PASSED,
          comment: "All good",
          requester: "admin",
        } as QualityGateValidationResult,
      },
    });

    expect(screen.getByText("Quality Gate Validation Status")).toBeTruthy();
    expect(screen.getByText("Comment")).toBeTruthy();
    expect(screen.getByText("Validated by")).toBeTruthy();
  });

  it("renders a fallback badge for unknown decision value", async () => {
    await render(QualityGateValidationBannerComponent, {
      inputs: {
        validationResult: {
          decision: "SOME_UNKNOWN_VALUE" as QualityGateValidationDecision,
          comment: "test",
          requester: "user1",
        } as QualityGateValidationResult,
      },
    });

    expect(screen.getByText("Unknown")).toBeTruthy();
  });
});
