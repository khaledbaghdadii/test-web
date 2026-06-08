import { BusinessProcessExecutionStatus } from "./business-process-execution-status";

interface BusinessProcessExecutionStatusFilter {
  text: string;
  value: BusinessProcessExecutionStatus;
}

export const businessProcessExecutionStatusFilters: BusinessProcessExecutionStatusFilter[] =
  [
    { text: "Not Started", value: BusinessProcessExecutionStatus.NOT_STARTED },
    { text: "Running", value: BusinessProcessExecutionStatus.RUNNING },
    { text: "Passed", value: BusinessProcessExecutionStatus.PASSED },
    { text: "Failed", value: BusinessProcessExecutionStatus.FAILED },
    {
      text: "Pending Input",
      value: BusinessProcessExecutionStatus.PENDING_INPUT,
    },
    { text: "Stopped", value: BusinessProcessExecutionStatus.STOPPED },
    { text: "Aborting", value: BusinessProcessExecutionStatus.ABORTING },
    { text: "Aborted", value: BusinessProcessExecutionStatus.ABORTED },
  ];
