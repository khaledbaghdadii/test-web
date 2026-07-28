import { Injectable } from "@angular/core";
import { ValidationProcessExecutionApiModel } from "./models/validation-process-execution-api-model";
import { ValidationProcessExecution } from "./models/validation-process-execution";
import { ValidationProcessStageStatus } from "./models/stage/validation-process-stage-status";
import { ValidationResultApiModel } from "./models/stage/execute-quality-gate/validation-result-api-model";
import { ValidationResult } from "./models/stage/execute-quality-gate/validation-result";
import {
  ExecutionStatus,
  QualityGateValidationDecision,
} from "@mxevolve/domains/business-process/util";

@Injectable({ providedIn: "root" })
export class ValidationProcessExecutionMapperService {
  toValidationProcessExecution(
    apiModel: ValidationProcessExecutionApiModel
  ): ValidationProcessExecution {
    return {
      ...apiModel,
      status: apiModel.status as ExecutionStatus,
      input: {
        ...apiModel.input,
      },
      createBranchStage: {
        ...apiModel.createBranchStage,
        status: apiModel.createBranchStage
          .status as ValidationProcessStageStatus,
        route: "create-branch",
      },
      executeQualityGatesStage: {
        ...apiModel.executeQualityGatesStage,
        status: apiModel.executeQualityGatesStage
          .status as ValidationProcessStageStatus,
        validationResult: this.toValidationResult(
          apiModel.executeQualityGatesStage.validationResult
        ),
        route: "execute-quality-gates",
      },
      tagArchivalBranchStage: {
        ...apiModel.tagArchivalBranchStage,
        status: apiModel.tagArchivalBranchStage
          .status as ValidationProcessStageStatus,
        route: "tag-archival",
      },
      integrateFixesStage: {
        ...apiModel.integrateFixesStage,
        status: apiModel.integrateFixesStage
          .status as ValidationProcessStageStatus,
        route: "integrate-fixes",
        stopActionMaker: apiModel.integrateFixesStage.stopActionMaker,
        skipActionMaker: apiModel.integrateFixesStage.skipActionMaker,
      },
    };
  }

  toValidationResult(
    validationResult: ValidationResultApiModel
  ): ValidationResult | null {
    if (validationResult == null) {
      return null;
    }
    return {
      requester: validationResult.requester,
      decision: validationResult.decision as QualityGateValidationDecision,
      comment: validationResult.comment,
    };
  }
}
