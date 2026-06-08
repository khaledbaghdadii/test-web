import { Injectable } from "@angular/core";
import { ValidationProcessExecutionApiModel } from "./model/validation-process-execution-api-model";
import { ValidationProcessExecution } from "./model/validation-process-execution";
import { ValidationProcessExecutionStageStatus } from "./model/stage/validation-process-execution-stage-status";
import { ValidationProcessStage } from "./model/stage/validation-process-stage";
import { Stage, StageStatus } from "@mxflow/ui/horizontal-timeline";
import {
  BusinessProcessExecutionStatus,
  QualityGateValidationDecision,
} from "@mxflow/features/business-process";
import { ValidationResultApiModel } from "./model/stage/execute-quality-gate/validation-result-api-model";
import { ValidationResult } from "./model/stage/execute-quality-gate/validation-result";

@Injectable({ providedIn: "root" })
export class ValidationProcessExecutionMapperService {
  toMasterValidationExecution(
    masterValidationExecutionApiModel: ValidationProcessExecutionApiModel
  ): ValidationProcessExecution {
    return {
      ...masterValidationExecutionApiModel,
      status:
        masterValidationExecutionApiModel.status as BusinessProcessExecutionStatus,
      input: {
        ...masterValidationExecutionApiModel.input,
      },
      createBranchStage: {
        ...masterValidationExecutionApiModel.createBranchStage,
        status: masterValidationExecutionApiModel.createBranchStage
          .status as ValidationProcessExecutionStageStatus,
        route: "create-branch",
      },
      executeQualityGatesStage: {
        ...masterValidationExecutionApiModel.executeQualityGatesStage,
        status: masterValidationExecutionApiModel.executeQualityGatesStage
          .status as ValidationProcessExecutionStageStatus,
        validationResult: this.toValidationResult(
          masterValidationExecutionApiModel.executeQualityGatesStage
            .validationResult
        ),
        route: "execute-quality-gates",
      },
      tagArchivalBranchStage: {
        ...masterValidationExecutionApiModel.tagArchivalBranchStage,
        status: masterValidationExecutionApiModel.tagArchivalBranchStage
          .status as ValidationProcessExecutionStageStatus,
        route: "tag-archival",
      },
      integrateFixesStage: {
        ...masterValidationExecutionApiModel.integrateFixesStage,
        status: masterValidationExecutionApiModel.integrateFixesStage
          .status as ValidationProcessExecutionStageStatus,
        route: "integrate-fixes",
        stopActionMaker:
          masterValidationExecutionApiModel.integrateFixesStage.stopActionMaker,
        skipActionMaker:
          masterValidationExecutionApiModel.integrateFixesStage.skipActionMaker,
      },
    };
  }

  toValidationResult(validationResult: ValidationResultApiModel) {
    if (validationResult == null) {
      return null;
    }

    return {
      requester: validationResult.requester,
      decision: validationResult.decision as QualityGateValidationDecision,
      comment: validationResult.comment,
    } as ValidationResult;
  }

  toTimelineStages(
    masterValidationExecutionStages: ValidationProcessStage[]
  ): Stage[] {
    return masterValidationExecutionStages.map(
      (masterValidationStage: ValidationProcessStage) => {
        return {
          name: masterValidationStage.name,
          status: masterValidationStage.status as unknown as StageStatus,
          startDate: masterValidationStage.startDate,
          endDate: masterValidationStage.endDate,
        };
      }
    );
  }

  toTimelineStage(masterValidationStage: ValidationProcessStage): Stage {
    return {
      name: masterValidationStage.name,
      status: masterValidationStage.status as unknown as StageStatus,
      startDate: masterValidationStage.startDate,
      endDate: masterValidationStage.endDate,
    };
  }
}
