import { SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE } from "./scenario-execution-group-permission-warning-message";

describe("SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE", () => {
  it("warns that running new tests cleans previous test environments", () => {
    expect(
      SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE[
        "SHOULD_HOUSKEEP_BEFORE_NEXT_LAUNCH"
      ]
    ).toContain("Running new tests will clean all previous test environments");
  });

  it("notes that the build environment is kept until the end of the process", () => {
    expect(
      SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE[
        "SHOULD_HOUSKEEP_BEFORE_NEXT_LAUNCH"
      ]
    ).toContain("The build environment is kept till the end of the process");
  });

  it("has no message for unknown permission codes", () => {
    expect(
      SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE["UNKNOWN_CODE"]
    ).toBeUndefined();
  });
});
