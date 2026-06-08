const ScenarioExecutionGroupPermissionWarningMessage: {
  [key: string]: string;
} = {
  SHOULD_HOUSKEEP_BEFORE_NEXT_LAUNCH:
    "Running new tests will clean all previous test environments.\nN.B: The build environment is kept till the end of the process",
};

export default ScenarioExecutionGroupPermissionWarningMessage;
