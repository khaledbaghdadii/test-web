const scenarioExecutionRejectionReasonMap: { [key: string]: string } = {
  LIMIT_REACHED: "Concurrent scenario executions limit has been reached",
  OUTER_CONTEXT_DISALLOWED_ACTIONS: "",
  UNDERWAY_SCENARIO: "",
};

export default scenarioExecutionRejectionReasonMap;
