import {
  ValidationScopeVisibilityInput,
  isValidationScopeStartCommitVisible,
} from "./validation-scope-visibility";

/**
 * Base input that satisfies EVERY visibility condition: flag handled by the
 * second argument; official MQG, a resolved parent branch and an archival
 * branch present (createBranch off). Individual matrix cases override one field
 * at a time.
 */
function visibleInput(
  overrides: Partial<ValidationScopeVisibilityInput> = {}
): ValidationScopeVisibilityInput {
  return {
    official: true,
    businessProcessQualityLevel: "MQG",
    createBranch: false,
    parentBranchName: null,
    archivalBranchName: "archival-branch",
    resolvedParentBranch: "develop",
    ...overrides,
  };
}

describe("isValidationScopeStartCommitVisible", () => {
  it("is visible when every condition holds (createBranch off, archival branch present)", () => {
    expect(isValidationScopeStartCommitVisible(visibleInput(), true)).toBe(
      true
    );
  });

  it("is hidden when the archival feature flag is disabled", () => {
    expect(isValidationScopeStartCommitVisible(visibleInput(), false)).toBe(
      false
    );
  });

  it("is hidden when the execution is not official", () => {
    expect(
      isValidationScopeStartCommitVisible(
        visibleInput({ official: false }),
        true
      )
    ).toBe(false);
  });

  it("is hidden when official is missing (not strictly true)", () => {
    expect(
      isValidationScopeStartCommitVisible(
        visibleInput({ official: null }),
        true
      )
    ).toBe(false);
  });

  it("is hidden when the BP quality level is not MQG", () => {
    expect(
      isValidationScopeStartCommitVisible(
        visibleInput({ businessProcessQualityLevel: "DQG" }),
        true
      )
    ).toBe(false);
  });

  it("is hidden when no parent branch can be resolved", () => {
    expect(
      isValidationScopeStartCommitVisible(
        visibleInput({ resolvedParentBranch: null }),
        true
      )
    ).toBe(false);
  });

  describe("createBranch on", () => {
    it("is visible when a parent branch name is chosen", () => {
      expect(
        isValidationScopeStartCommitVisible(
          visibleInput({ createBranch: true, parentBranchName: "main" }),
          true
        )
      ).toBe(true);
    });

    it("is hidden when no parent branch name is chosen", () => {
      expect(
        isValidationScopeStartCommitVisible(
          visibleInput({ createBranch: true, parentBranchName: "" }),
          true
        )
      ).toBe(false);
    });
  });

  describe("createBranch off", () => {
    it("is visible when an archival branch name is present", () => {
      expect(
        isValidationScopeStartCommitVisible(
          visibleInput({
            createBranch: false,
            archivalBranchName: "archival-branch",
          }),
          true
        )
      ).toBe(true);
    });

    it("is hidden when the archival branch name is empty", () => {
      expect(
        isValidationScopeStartCommitVisible(
          visibleInput({ createBranch: false, archivalBranchName: "" }),
          true
        )
      ).toBe(false);
    });
  });
});
