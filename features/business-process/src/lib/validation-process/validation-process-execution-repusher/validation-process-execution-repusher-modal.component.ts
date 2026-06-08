import { Component, inject, ViewChild } from "@angular/core";
import { RepushValidationProcessExecutionInputsComponent } from "./repush-validation-process-execution-inputs/repush-validation-process-execution-inputs.component";
import { ErrorAlertComponent, ToastMessageService } from "@mxflow/ui/alert";
import { Dialog } from "primeng/dialog";
import { Skeleton } from "primeng/skeleton";
import { Button } from "primeng/button";
import { PrimeTemplate } from "primeng/api";
import {
  BusinessProcessAnalyticsTrackerService,
  BusinessProcessDefinitionService,
  ValidationProcessExecution,
  ValidationProcessExecutionFetcherService,
  ValidationProcessExecutionMapperService,
} from "@mxflow/features/business-process";
import { catchError, switchMap, tap, throwError } from "rxjs";
import { RepushValidationProcessExecutionInput } from "./repush-validation-process-execution-inputs/repush-validation-process-execution-inputs";
import { MASTER_VALIDATION_MFE_PATH } from "@mxflow/config";
import { ProjectUrlPipe } from "@mxflow/features/project";
import { ValidationProcessExecutorService } from "../validation-process-definition-executor/validation-process-executor.service";
import { ExecuteValidationProcessResponse } from "../validation-process-definition-executor/execute-validation-process-response";

@Component({
  selector: "mxevolve-validation-process-execution-repusher-modal",
  imports: [
    RepushValidationProcessExecutionInputsComponent,
    ErrorAlertComponent,
    Dialog,
    Skeleton,
    Button,
    PrimeTemplate,
  ],
  providers: [
    BusinessProcessDefinitionService,
    ValidationProcessExecutionFetcherService,
    ValidationProcessExecutorService,
    ValidationProcessExecutionMapperService,
    ProjectUrlPipe,
  ],
  templateUrl: "./validation-process-execution-repusher-modal.component.html",
})
export class ValidationProcessExecutionRepusherModalComponent {
  private readonly definitionService = inject(BusinessProcessDefinitionService);
  private readonly validationFetcherService = inject(
    ValidationProcessExecutionFetcherService
  );
  private readonly validationExecutorService = inject(
    ValidationProcessExecutorService
  );
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly projectUrlPipe = inject(ProjectUrlPipe);
  private readonly trackerService = inject(
    BusinessProcessAnalyticsTrackerService
  );

  isVisible = false;
  loading = false;
  projectId: string;
  definitionId: string;
  isExecuting: boolean;

  errorMessage: string | undefined;
  @ViewChild(RepushValidationProcessExecutionInputsComponent)
  inputsComponent: RepushValidationProcessExecutionInputsComponent;

  openRepushModal(projectId: string, executionId: string) {
    let parentExecution: ValidationProcessExecution;
    this.loading = true;
    this.isVisible = true;
    this.projectId = projectId;

    this.validationFetcherService
      .getValidationProcessExecution(projectId, executionId)
      .pipe(
        tap((execution) => (parentExecution = execution)),
        tap((execution) => (this.definitionId = execution.definitionId)),
        switchMap((execution: ValidationProcessExecution) =>
          this.definitionService.getBusinessProcessDefinition(
            projectId,
            execution.definitionId
          )
        ),
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

  repushValidationExecution() {
    this.trackerService.trackRepushBusinessProcess();

    if (this.inputsComponent.form.valid) {
      this.isExecuting = true;
      this.validationExecutorService
        .executeValidationProcessDefinition(
          this.projectId,
          this.getRepushRequest(this.inputsComponent.getRepushInputs())
        )
        .subscribe({
          next: (repushedExecution) => {
            this.isExecuting = false;
            this.toastMessageService.showSuccess(
              "Business process execution successfully repushed",
              "",
              {
                link: {
                  linkText: "View",
                  href: this.getRepushedExecutionUrl(repushedExecution),
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
    repushInputs: RepushValidationProcessExecutionInput
  ) {
    return {
      name: repushInputs.name,
      definitionId: this.definitionId,
      official: repushInputs.official,
      notificationsRecipients: repushInputs.notificationsRecipients,
      configurationParameters: {
        repositoryId: repushInputs.repositoryId,
        businessProcessQualityLevel: repushInputs.businessProcessQualityLevel,
        createBranch: repushInputs.createBranch,
        parentBranchName: repushInputs.parentBranchName,
        archivalBranchName: repushInputs.archivalBranchName,
        configCommitId: repushInputs.configCommitId,
        rtpCommitId: repushInputs.rtpCommitId,
        finalProductId: repushInputs.finalProductId,
      },
      testParameters: {
        qualityGateScenarioDefinitionIds:
          repushInputs.qualityGateScenarioDefinitionIds,
        nightlyRepusherEnabled: repushInputs.nightlyRepusherEnabled,
      },
      infrastructureParameters: {
        qualityGateInfraGroupId: repushInputs.qualityGateInfraGroupId,
      },
      validationScopeParameters: {
        startCommitId: repushInputs.validationScopeStartCommitId,
      },
    };
  }

  private getRepushedExecutionUrl(
    repushedExecution: ExecuteValidationProcessResponse
  ) {
    return `${this.projectUrlPipe.transform(
      this.projectId
    )}/business-process/${MASTER_VALIDATION_MFE_PATH}/execution/${
      repushedExecution.id
    }`;
  }
}
