import { Component, EventEmitter, inject, Input, OnInit } from "@angular/core";
import {
  BuildAndTestProcessBuildAndTestStage,
  BuildAndTestProcessStageStatus,
} from "@mxflow/features/business-process";
import { CiProcessExecutionStateUpdaterService } from "../../../ci-process-execution-details/ci-process-state-updater.service";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { MergeRequest } from "@mxflow/features/scm-management";

@Component({
  selector: "mxflow-build-and-test-actions",
  templateUrl: "build-and-test-actions.component.html",
  standalone: false,
})
export class BuildAndTestActionsComponent implements OnInit {
  @Input() ciProcessExecutionId: string;
  @Input() buildAndTestStage: BuildAndTestProcessBuildAndTestStage;
  @Input() mergeRequestDetails: MergeRequest | null | undefined;

  projectId: string;
  actionsNotAllowed = false;

  showModalEventEmitter = new EventEmitter<void>();
  hideModalEventEmitter = new EventEmitter<void>();

  private readonly processExecutionUpdater = inject(
    CiProcessExecutionStateUpdaterService
  );
  private readonly projectIdResolver = inject(
    ProjectIdRouteParamsResolverService
  );

  ngOnInit(): void {
    this.projectId = this.projectIdResolver.resolve();
    this.actionsNotAllowed =
      this.buildAndTestStage.status !==
      BuildAndTestProcessStageStatus.PENDING_INPUT;
  }

  createMergeRequest() {
    this.showModalEventEmitter.emit();
  }

  mergeRequestCreated() {
    this.processExecutionUpdater.reloadProcessDetails(
      this.ciProcessExecutionId,
      this.projectId
    );
    this.hideModalEventEmitter.emit();
  }

  mergeRequestReopened() {
    this.processExecutionUpdater.reloadProcessDetails(
      this.ciProcessExecutionId,
      this.projectId
    );
  }

  isDecisionMade() {
    return this.buildAndTestStage?.requester != null;
  }
}
