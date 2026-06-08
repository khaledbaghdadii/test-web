/**
 * Warning messages surfaced by the TPK scenario-runs widget for specific
 * execution-group permission codes. Ported verbatim from the legacy
 * ci-process-mfe ScenarioExecutionGroupPermissionWarningMessage map.
 */
export const SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE: Record<
  string,
  string
> = {
  SHOULD_HOUSKEEP_BEFORE_NEXT_LAUNCH:
    "Running new tests will clean all previous test environments.\nN.B: The build environment is kept till the end of the process",
};
