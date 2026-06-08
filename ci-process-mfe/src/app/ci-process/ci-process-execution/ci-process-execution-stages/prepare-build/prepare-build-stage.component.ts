import { Component, OnDestroy, OnInit } from "@angular/core";
import { Store } from "@ngrx/store";
import { skipWhile, Subject, takeUntil, tap } from "rxjs";
import { getCiProcessExecution } from "../../state/ci-process-execution.selector";
import { CiProcessActions } from "../../../state";
import {
  BuildAndTestProcessPrepareBuildStage,
  BuildAndTestProcessStageStatus,
} from "@mxflow/features/business-process";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";

@Component({
  selector: "mxflow-prepare-build-stage",
  templateUrl: "prepare-build-stage.component.html",
  standalone: false,
})
export class PrepareBuildStageComponent implements OnInit, OnDestroy {
  prepareBuildStage: BuildAndTestProcessPrepareBuildStage;
  projectId: string;
  ciProcessExecutionId: string;
  isUserInterventionDisabled = true;
  showDecision = false;
  actionRequester: string;
  isStageSkipped: boolean;

  private readonly destroy$ = new Subject();

  constructor(
    private store: Store,
    private projectIdResolver: ProjectIdRouteParamsResolverService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.projectId = this.projectIdResolver.resolve();
    this.store
      .pipe(getCiProcessExecution)
      .pipe(
        skipWhile((ciProcess) => ciProcess.prepareBuildStage.startDate === ""),
        tap((ciProcess) => {
          this.prepareBuildStage = ciProcess.prepareBuildStage;
          this.ciProcessExecutionId = ciProcess.id;
          this.isStageSkipped =
            this.prepareBuildStage.status ==
            BuildAndTestProcessStageStatus.SKIPPED;
          this.isUserInterventionDisabled =
            this.prepareBuildStage.status !==
            BuildAndTestProcessStageStatus.PENDING_INPUT;
          this.showDecision =
            this.prepareBuildStage.status ==
            BuildAndTestProcessStageStatus.STOPPED;
          this.actionRequester = this.prepareBuildStage.requester;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        error: (errorMessage) => {
          this.store.dispatch(
            CiProcessActions.updateErrorMessage({ message: errorMessage })
          );
        },
      });
  }
}
