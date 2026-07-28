import { constructBusinessProcessExecutionUri } from "./business-process-global-uri-factory";

const PROJECT_ID = "project-1";

describe("constructBusinessProcessExecutionUri", () => {
  it("builds the upgrade-process execution URL for a binary-upgrade id", () => {
    const url = constructBusinessProcessExecutionUri(
      "binary-upgrade__exec-1",
      PROJECT_ID
    );

    expect(url).toBe(
      `/app/${PROJECT_ID}/business-process/upgrade-processes/execution/binary-upgrade__exec-1`
    );
  });

  it("builds the build-and-test execution URL for a user-story-build-and-test id", () => {
    const url = constructBusinessProcessExecutionUri(
      "user-story-build-and-test__exec-2",
      PROJECT_ID
    );

    expect(url).toBe(
      `/app/${PROJECT_ID}/business-process/build-and-test-processes/execution/user-story-build-and-test__exec-2`
    );
  });

  it("builds the validation-process execution URL for a master-validation id", () => {
    const url = constructBusinessProcessExecutionUri(
      "master-validation__exec-3",
      PROJECT_ID
    );

    expect(url).toBe(
      `/app/${PROJECT_ID}/business-process/validation-processes/execution/master-validation__exec-3`
    );
  });

  it("throws for an id with an unknown family prefix", () => {
    expect(() =>
      constructBusinessProcessExecutionUri("unknown__exec-4", PROJECT_ID)
    ).toThrow("Invalid process execution ID");
  });
});
