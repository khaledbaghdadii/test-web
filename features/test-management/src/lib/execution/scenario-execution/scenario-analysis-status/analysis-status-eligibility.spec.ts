import {
  AnalysisStatusUpdateIneligibilityReason,
  AnalysisStatusUpdateIneligibilityReasonDisplayMessage,
} from "./analysis-status-eligibility";

describe("AnalysisStatusUpdateIneligibilityReasonDisplayMessage", () => {
  it("should return correct message for SCENARIO_EXECUTION_PASSED", () => {
    expect(
      AnalysisStatusUpdateIneligibilityReasonDisplayMessage[
        AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_PASSED
      ]
    ).toBe(
      "The analysis status is automatically set to passed since the scenario execution passed"
    );
  });

  it("should return correct message for SCENARIO_EXECUTION_UNDERWAY", () => {
    expect(
      AnalysisStatusUpdateIneligibilityReasonDisplayMessage[
        AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_UNDERWAY
      ]
    ).toBe(
      "You cannot set the analysis status since the scenario execution is still underway."
    );
  });

  it("should return correct message for LOADING", () => {
    expect(
      AnalysisStatusUpdateIneligibilityReasonDisplayMessage[
        AnalysisStatusUpdateIneligibilityReason.LOADING
      ]
    ).toBe("Refreshing analysis statuses");
  });

  it("should return correct message for SCENARIO_EXECUTION_NOT_FAILED", () => {
    expect(
      AnalysisStatusUpdateIneligibilityReasonDisplayMessage[
        AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_NOT_FAILED
      ]
    ).toBe(
      "You cannot set the analysis status if the scenario execution has not failed"
    );
  });

  it("should return correct message for TRANSITION_NOT_POSSIBLE", () => {
    expect(
      AnalysisStatusUpdateIneligibilityReasonDisplayMessage[
        AnalysisStatusUpdateIneligibilityReason.TRANSITION_NOT_POSSIBLE
      ]
    ).toBe("Transition not possible");
  });

  it("should return correct message for SCENARIO_EXECUTION_NOT_ASSIGNED", () => {
    expect(
      AnalysisStatusUpdateIneligibilityReasonDisplayMessage[
        AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_NOT_ASSIGNED
      ]
    ).toBe(
      "Marking the Analysis Status as Assigned requires setting an assignee"
    );
  });

  it("should return correct message for NO_FAILURE_REASONS_LINKED", () => {
    expect(
      AnalysisStatusUpdateIneligibilityReasonDisplayMessage[
        AnalysisStatusUpdateIneligibilityReason.NO_FAILURE_REASONS_LINKED
      ]
    ).toBe("No Failure Reasons are linked to the scenario execution");
  });

  it("should return correct message for NO_INCIDENT_LINKED", () => {
    expect(
      AnalysisStatusUpdateIneligibilityReasonDisplayMessage[
        AnalysisStatusUpdateIneligibilityReason.NO_INCIDENT_LINKED
      ]
    ).toBe("No Incidents are linked to the scenario execution or test cases");
  });

  it("should return correct message for NO_REGRESSIONS_LINKED", () => {
    expect(
      AnalysisStatusUpdateIneligibilityReasonDisplayMessage[
        AnalysisStatusUpdateIneligibilityReason.NO_REGRESSIONS_LINKED
      ]
    ).toBe("No Regressions are linked to the scenario execution or test cases");
  });

  it("should return correct message for NO_IMPACTS_LINKED", () => {
    expect(
      AnalysisStatusUpdateIneligibilityReasonDisplayMessage[
        AnalysisStatusUpdateIneligibilityReason.NO_IMPACTS_LINKED
      ]
    ).toBe("No Impacts are linked to the scenario execution or test cases");
  });

  it("should return correct message for REGRESSIONS_LINKED", () => {
    expect(
      AnalysisStatusUpdateIneligibilityReasonDisplayMessage[
        AnalysisStatusUpdateIneligibilityReason.REGRESSIONS_LINKED
      ]
    ).toBe("Regressions are linked to the scenario execution or test cases");
  });

  it("should return the correct message for DETECTION_OR_INCIDENT_LINKED", () => {
    expect(
      AnalysisStatusUpdateIneligibilityReasonDisplayMessage[
        AnalysisStatusUpdateIneligibilityReason.DETECTION_OR_INCIDENT_LINKED
      ]
    ).toBe(
      "Cannot set the status to Assigned: a detection or incident is linked to this scenario execution"
    );
  });

  it("should return the correct message for FAILURE_REASONS_LINKED", () => {
    expect(
      AnalysisStatusUpdateIneligibilityReasonDisplayMessage[
        AnalysisStatusUpdateIneligibilityReason.FAILURE_REASONS_LINKED
      ]
    ).toBe(
      "Reasons of failure are linked to the scenario execution or test cases"
    );
  });
});
