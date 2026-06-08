import { Component, inject, ViewChild } from "@angular/core";
import { ErrorAlertComponent, ToastMessageService } from "@mxflow/ui/alert";
import { BuildAndTestProcessExecutionFetcherService } from "../build-and-test-process-execution-fetcher/build-and-test-process-execution-fetcher.service";
import { BuildAndTestProcessExecutorService } from "../build-and-test-process-definition-executor/service/build-and-test-process-executor.service";
import { catchError, switchMap, tap, throwError } from "rxjs";
import { RepushBuildAndTestProcessInputComponent } from "./input/repush-build-and-test-process-input.component";
import { BuildAndTestProcessExecution } from "../build-and-test-process-execution";
import { RepushBuildAndTestProcessInput } from "./input/repush-build-and-test-process-input";
import { ExecuteBuildAndTestProcessRequest } from "../build-and-test-process-definition-executor/service/execute-build-and-test-process-request";
import { ExecuteBuildAndTestProcessResponse } from "../build-and-test-process-definition-executor/service/execute-build-and-test-process-response";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { Skeleton } from "primeng/skeleton";
import { BusinessProcessDefinitionService } from "../../business-process-definition/business-process-definition.service";
import { BusinessProcessAnalyticsTrackerService } from "../../analytics-tracker/business-process-analytics-tracker.service";

@Component({
  selector: "mxevolve-build-and-test-process-execution-repusher",
  imports: [
    Button,
    Dialog,
    ErrorAlertComponent,
    PrimeTemplate,
    RepushBuildAndTestProcessInputComponent,
    Skeleton,
  ],
  templateUrl: "build-and-test-process-execution-repusher.component.html",
})
export class BuildAndTestProcessExecutionRepusherComponent {
  private readonly definitionFetcherService = inject(
    BusinessProcessDefinitionService
  );
  private readonly executionFetcherService = inject(
    BuildAndTestProcessExecutionFetcherService
  );
  private readonly definitionExecutorService = inject(
    BuildAndTestProcessExecutorService
  );
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly trackerService = inject(
    BusinessProcessAnalyticsTrackerService
  );

  isVisible = false;
  loading = false;
  projectId: string;
  definitionId: string;
  isExecuting: boolean;
  errorMessage?: string;

  @ViewChild(RepushBuildAndTestProcessInputComponent)
  inputsComponent: RepushBuildAndTestProcessInputComponent;

  openRepushModal(projectId: string, executionId: string) {
    let parentExecution: BuildAndTestProcessExecution;
    this.loading = true;
    this.isVisible = true;
    this.projectId = projectId;

    this.executionFetcherService
      .getBuildAndTestProcessExecution(projectId, executionId)
      .pipe(
        tap((execution) => (parentExecution = execution)),
        tap((execution) => (this.definitionId = execution.definitionId)),
        switchMap((execution) => {
          return this.definitionFetcherService.getBusinessProcessDefinition(
            projectId,
            execution.definitionId
          );
        }),
        catchError((error) => {
          this.loading = false;
          this.isVisible = false;
          this.toastMessageService.showError(
            "Something went wrong. Please try again later."
          );
          return throwError(() => error);
        })
      )
      .subscribe((definition) => {
        this.inputsComponent.initializeForm(
          projectId,
          definition.providedInputs,
          parentExecution
        );
        this.loading = false;
      });
  }

  repushBuildAndTestExecution() {
    this.trackerService.trackRepushBusinessProcess();

    if (this.inputsComponent.form.valid) {
      this.isExecuting = true;
      this.definitionExecutorService
        .executeBuildAndTestProcessDefinition(
          this.projectId,
          this.getRepushRequest(
            this.inputsComponent.getRepushBuildAndTestProcessInput()
          )
        )
        .subscribe({
          next: (response) => {
            this.isExecuting = false;
            this.toastMessageService.showSuccess(
              "Business process execution successfully repushed",
              "",
              {
                link: {
                  linkText: "View",
                  href: this.getBuildAndTestExecutionUrl(response),
                },
              }
            );
            this.hideRepusherModal();
          },
          error: (error) => {
            this.isExecuting = false;
            this.errorMessage = error.message;
          },
        });
    }
  }

  hideRepusherModal() {
    this.isVisible = false;
    this.inputsComponent.resetForm();
  }

  private getRepushRequest(
    repushInputs: RepushBuildAndTestProcessInput
  ): ExecuteBuildAndTestProcessRequest {
    return {
      name: repushInputs.name,
      definitionId: this.definitionId,
      repositoryId: repushInputs.repositoryId,
      configurationBranchName: repushInputs.configurationBranchName,
      configurationParentBranch: repushInputs.configurationParentBranch,
      userStoryIds: repushInputs.userStoryIds,
      buildEnvironmentInfraGroup: repushInputs.buildEnvironmentInfraGroup,
      buildAndTestInfraGroup: repushInputs.buildAndTestInfraGroup,
      skipPrepareBuildEnvironment: repushInputs.skipEnvironmentDeployment,
      notificationsRecipients: repushInputs.notificationsRecipients,
      buildEnvironmentScenarioDefinitionId:
        repushInputs.buildScenarioDefinitionId,
    };
  }

  private getBuildAndTestExecutionUrl(
    response: ExecuteBuildAndTestProcessResponse
  ): string {
    return `app/${this.projectId}/business-process/build-and-test-processes/execution/${response.id}`;
  }
}
