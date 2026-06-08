import { Injectable } from "@angular/core";
import {
  BuildAndTestProcessExecution,
  BuildAndTestProcessStageStatus,
  BusinessProcessExecutionStatus,
} from "@mxflow/features/business-process";

@Injectable()
export class CiProcessStageSelectorService {
  getWantedStage(
    ciProcessExecution: BuildAndTestProcessExecution,
    url: string
  ): string {
    if (this.isStageSpecifiedInUrl(ciProcessExecution, url)) {
      return this.getStageNameSpecifiedInUrl(ciProcessExecution, url);
    } else if (this.isTargetStatus(ciProcessExecution)) {
      return this.getTargetStageName(ciProcessExecution);
    } else {
      return this.getFirstStageName(ciProcessExecution);
    }
  }

  private isStageSpecifiedInUrl(
    ciProcessExecution: BuildAndTestProcessExecution,
    url: string
  ) {
    return (
      url.endsWith(ciProcessExecution.createBranchStage.route) ||
      url.endsWith(ciProcessExecution.prepareBuildStage.route) ||
      url.endsWith(ciProcessExecution.buildAndTestStage.route) ||
      url.endsWith(ciProcessExecution.integrateChangesStage.route)
    );
  }

  private getStageNameSpecifiedInUrl(
    ciProcessExecution: BuildAndTestProcessExecution,
    url: string
  ) {
    return this.getCiProcessExecutionStages(ciProcessExecution).filter(
      (stage) => url.endsWith(stage.route)
    )[0].name;
  }

  private getFirstStageName(ciProcessExecution: BuildAndTestProcessExecution) {
    return ciProcessExecution.createBranchStage.name;
  }

  private isTargetStatus(ciProcessExecution: BuildAndTestProcessExecution) {
    return (
      ciProcessExecution.status === BusinessProcessExecutionStatus.FAILED ||
      ciProcessExecution.status === BusinessProcessExecutionStatus.ABORTED ||
      ciProcessExecution.status === BusinessProcessExecutionStatus.STOPPED ||
      ciProcessExecution.status === BusinessProcessExecutionStatus.ABORTING ||
      ciProcessExecution.status === BusinessProcessExecutionStatus.RUNNING ||
      ciProcessExecution.status === BusinessProcessExecutionStatus.PENDING_INPUT
    );
  }

  private getTargetStageName(
    ciProcessExecution: BuildAndTestProcessExecution
  ): string {
    const filteredStage = this.getCiProcessExecutionStages(
      ciProcessExecution
    ).filter(
      (stage) =>
        stage.status === BuildAndTestProcessStageStatus.FAILED ||
        stage.status === BuildAndTestProcessStageStatus.RUNNING ||
        stage.status === BuildAndTestProcessStageStatus.STOPPED ||
        stage.status === BuildAndTestProcessStageStatus.PENDING_INPUT
    );

    return filteredStage.length > 0
      ? filteredStage[0].name
      : this.getFirstStageName(ciProcessExecution);
  }

  private getCiProcessExecutionStages(
    ciProcessExecution: BuildAndTestProcessExecution
  ) {
    return [
      ciProcessExecution.createBranchStage,
      ciProcessExecution.prepareBuildStage,
      ciProcessExecution.buildAndTestStage,
      ciProcessExecution.integrateChangesStage,
    ];
  }
}
