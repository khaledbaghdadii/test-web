/**
 * Inputs to the `validationScopeStartCommitId` visibility decision. Values are
 * taken from the validation executor's reactive-form snapshot plus the parent
 * branch resolved (asynchronously) from the SCM developments lookup.
 */
export interface ValidationScopeVisibilityInput {
  readonly official: unknown;
  readonly businessProcessQualityLevel: unknown;
  readonly createBranch: unknown;
  readonly parentBranchName: unknown;
  readonly archivalBranchName: unknown;
  readonly resolvedParentBranch: string | null;
}

/**
 * Decides whether the conditional `validationScopeStartCommitId` field is shown.
 *
 * Migrated **verbatim** from the legacy
 * `ValidationScopeStartCommitIdStateResolverService.isVisible`
 * (`web/libs/features/business-process/.../validation-scope-start-commit-id-state-resolver.service.ts`):
 *   - the `jira-user-story-archival` feature flag must be enabled, AND
 *   - `official === true`, AND
 *   - `businessProcessQualityLevel === "MQG"`, AND
 *   - a parent branch must be resolvable (`resolvedParentBranch !== null`), AND
 *   - when creating a branch, a parent branch must be chosen
 *     (`!!parentBranchName`); otherwise an archival branch name must be present
 *     (`!!archivalBranchName`).
 */
export function isValidationScopeStartCommitVisible(
  input: ValidationScopeVisibilityInput,
  archivalFlagEnabled: boolean
): boolean {
  if (!archivalFlagEnabled) {
    return false;
  }
  if (input.official !== true) {
    return false;
  }
  if (input.businessProcessQualityLevel !== "MQG") {
    return false;
  }
  if (input.resolvedParentBranch === null) {
    return false;
  }
  if (input.createBranch === true) {
    return !!input.parentBranchName;
  }
  return !!input.archivalBranchName;
}
