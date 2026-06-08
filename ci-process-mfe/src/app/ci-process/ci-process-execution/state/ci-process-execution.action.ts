import { createAction, props } from "@ngrx/store";
import { BuildAndTestProcessExecution } from "@mxflow/features/business-process";

export const getCiProcessExecution = createAction(
  "[Ci Process Execution][Data] Getting business process execution",
  props<{ id: string; projectId: string }>()
);

export const getCiProcessExecutionSuccessfully = createAction(
  "[Ci Process Execution][Data] Getting business process Successfully",
  props<{ ciProcessExecution: BuildAndTestProcessExecution }>()
);

export const getCiProcessExecutionFailure = createAction(
  "[Ci Process Execution][Data] Getting business process Failure",
  props<{ errorMessage: string }>()
);
