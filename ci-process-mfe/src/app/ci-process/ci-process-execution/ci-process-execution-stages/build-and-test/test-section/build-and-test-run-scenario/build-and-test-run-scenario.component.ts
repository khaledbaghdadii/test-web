import { Component, inject, Input, OnDestroy, OnInit } from "@angular/core";
import { concatMap, Subject, takeUntil } from "rxjs";
import { CiProcessExecutionStateUpdaterService } from "../../../../ci-process-execution-details/ci-process-state-updater.service";
import { Store } from "@ngrx/store";
import { getCiProcessExecution } from "../../../../state/ci-process-execution.selector";
import { updateErrorMessage } from "../../../../../state/ci-process.actions";
import { BUILD_AND_TEST_STAGE_ID } from "@mxflow/features/business-process";
import ScenarioExecutionGroupPermissionWarningMessage from "../../model/scenario-execution-group-permission-warning-message";
import { ScmManagementService } from "@mxflow/features/scm";
import { RunScenarioDropdownComponent } from "@mxflow/test-management";

@Component({
  selector: "mxevolve-build-and-test-run-scenario",
  templateUrl: "build-and-test-run-scenario.component.html",
  imports: [RunScenarioDropdownComponent],
})
export class BuildAndTestRunScenarioComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly processStateUpdater = inject(
    CiProcessExecutionStateUpdaterService
  );
  private readonly scmManagementService = inject(ScmManagementService);
  private readonly destroy$ = new Subject<void>();

  @Input({ required: true }) projectId: string;
  processId: string;
  branchName: string;
  executionGroupId: string | null;
  machineGroupId: string | undefined;
  warningMessageMap = ScenarioExecutionGroupPermissionWarningMessage;
  subContextId = BUILD_AND_TEST_STAGE_ID;
  isLoading = true;

  ngOnInit(): void {
    this.store
      .pipe(
        getCiProcessExecution,
        concatMap((ciProcess) => {
          this.processId = ciProcess.id;
          this.executionGroupId =
            ciProcess.buildAndTestStage.scenarioExecutionGroup;
          this.machineGroupId = ciProcess.input.buildAndTestInfraGroup;
          return this.scmManagementService.getDevelopment(
            this.projectId,
            ciProcess.createBranchStage.developmentId
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((development) => {
        this.branchName = development.name;
        this.isLoading = false;
      });
  }

  onScenarioPushed(): void {
    this.processStateUpdater.reloadProcessDetails(
      this.processId,
      this.projectId
    );
  }

  onError(errorMessage: string): void {
    this.store.dispatch(updateErrorMessage({ message: errorMessage }));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
