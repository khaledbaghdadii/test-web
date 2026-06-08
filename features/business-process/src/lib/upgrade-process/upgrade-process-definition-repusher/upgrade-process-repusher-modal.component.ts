import { Component, inject, ViewChild } from "@angular/core";
import { UpgradeProcessDefinitionExecutorService } from "../service/upgrade-process-definition-executor.service";

import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import {
  ErrorAlertComponent,
  ToastMessageData,
  ToastMessageService,
} from "@mxflow/ui/alert";
import { PrimeTemplate } from "primeng/api";
import { ReactiveFormsModule } from "@angular/forms";
import { ProjectUrlPipe } from "@mxflow/features/project";
import { ExecuteUpgradeProcessDefinitionResponse } from "../service/execute-upgrade-process-definition-response";
import { RepushUpgradeProcessDefinitionInputsComponent } from "./inputs/repush-upgrade-process-definition-inputs.component";
import { ExecuteUpgradeProcessDefinitionRequest } from "../service/execute-upgrade-process-definition-request";
import { BINARY_UPGRADE_MFE_PATH } from "@mxflow/config";
import { catchError, switchMap, tap, throwError } from "rxjs";
import { BusinessProcessDefinitionService } from "../../business-process-definition/business-process-definition.service";
import { Skeleton } from "primeng/skeleton";
import { UpgradeProcessExecutionFetcherService } from "../upgrade-process-execution-fetcher/upgrade-process-execution-fetcher.service";
import { UpgradeProcessExecution } from "../upgrade-process-execution";
import { BusinessProcessAnalyticsTrackerService } from "../../analytics-tracker/business-process-analytics-tracker.service";

@Component({
  selector: "mxevolve-upgrade-process-repusher-modal",
  imports: [
    Button,
    Dialog,
    ErrorAlertComponent,
    PrimeTemplate,
    ReactiveFormsModule,
    RepushUpgradeProcessDefinitionInputsComponent,
    Skeleton,
  ],
  providers: [UpgradeProcessDefinitionExecutorService, ProjectUrlPipe],
  templateUrl: "./upgrade-process-repusher-modal.component.html",
})
export class UpgradeProcessRepusherModalComponent {
  private readonly executorService = inject(
    UpgradeProcessDefinitionExecutorService
  );
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly projectUrlPipe = inject(ProjectUrlPipe);
  private readonly fetcherService = inject(
    UpgradeProcessExecutionFetcherService
  );
  private readonly definitionService = inject(BusinessProcessDefinitionService);
  private readonly trackerService = inject(
    BusinessProcessAnalyticsTrackerService
  );

  isVisible = false;
  loading = false;
  isExecuting = false;

  projectId: string;
  definitionId: string;
  errorMessage: string | undefined;

  @ViewChild(RepushUpgradeProcessDefinitionInputsComponent)
  inputsComponent: RepushUpgradeProcessDefinitionInputsComponent;

  openRepusherModal(projectId: string, executionId: string) {
    this.loading = true;
    this.isVisible = true;
    this.projectId = projectId;

    let originExecution: UpgradeProcessExecution;

    this.fetcherService
      .getUpgradeProcessExecution(projectId, executionId)
      .pipe(
        tap((execution) => (originExecution = execution)),
        tap((execution) => (this.definitionId = execution.definitionId)),
        switchMap((execution) =>
          this.definitionService.getBusinessProcessDefinition(
            projectId,
            execution.definitionId
          )
        ),
        tap((definition) =>
          this.inputsComponent.initializeForm(
            projectId,
            definition.providedInputs,
            originExecution
          )
        ),
        tap(() => (this.loading = false)),
        catchError((error) => {
          this.loading = false;
          this.isVisible = false;
          this.toastMessageService.showError(
            "Something went wrong. Please try again later."
          );
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  hideRepusherModal() {
    this.isVisible = false;
    this.inputsComponent.resetForm();
  }

  repushUpgradeExecution() {
    this.trackerService.trackRepushBusinessProcess();

    if (this.inputsComponent.form.valid) {
      this.isExecuting = true;

      this.executorService
        .executeUpgradeProcessDefinition(this.getExecuteUpgradeProcessRequest())
        .subscribe({
          next: (response: ExecuteUpgradeProcessDefinitionResponse) => {
            this.isExecuting = false;
            this.toastMessageService.showSuccess(
              "Business process execution successfully repushed",
              "",
              {
                link: {
                  linkText: "View",
                  href: this.getUpgradeExecutionUrl(response),
                },
              } as ToastMessageData
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

  private getUpgradeExecutionUrl(
    response: ExecuteUpgradeProcessDefinitionResponse
  ) {
    return `${this.projectUrlPipe.transform(
      this.projectId
    )}/business-process/${BINARY_UPGRADE_MFE_PATH}/execution/${
      response.upgradeProcessExecutionId
    }`;
  }

  private getExecuteUpgradeProcessRequest(): ExecuteUpgradeProcessDefinitionRequest {
    const inputs = this.inputsComponent.getRepushInputs();

    return {
      projectId: this.projectId,
      definitionId: this.definitionId,
      name: inputs.name,
      official: inputs.official,
      notificationsRecipients: inputs.notificationsRecipients,
      mxParameters: {
        parentMxArchivalBranch: inputs.parentMxArchivalBranch,
        upgradeJump: inputs.upgradeJump,
        conversionFactoryProduct: {
          id: inputs.factoryProduct.id,
          mxVersion: inputs.factoryProduct.mxVersion,
          mxBuildId: inputs.factoryProduct.mxBuildId,
          bipVersion: inputs.factoryProduct.bipVersion,
          bipBuildId: inputs.factoryProduct.bipBuildId,
        },
      },
      configurationParameters: {
        repositoryId: inputs.repositoryId,
        createBranch: inputs.createBranch,
        configurationBranchName: inputs.configurationBranchName,
        configurationParentBranchName: inputs.configurationParentBranch,
        businessProcessQualityLevel: inputs.businessProcessQualityLevel,
      },
      infrastructureParameters: {
        qualityGateExecutionInfraGroupId:
          inputs.qualityGateExecutionInfraGroupId,
        binaryConversionInfraGroupId: inputs.binaryConversionInfraGroupId,
      },
      testParameters: {
        binaryConversionScenarioDefinitionId:
          inputs.technicalUpgradeTestScenarioId,
        qualityGateScenarioDefinitionIds: inputs.testScenarioIds,
      },
      referenceEnvironmentParameters: {
        referenceCommitId: inputs.referenceCommitId,
        referenceFactoryProduct: {
          id: inputs.referenceFactoryProduct.id,
          mxVersion: inputs.referenceFactoryProduct.mxVersion,
          mxBuildId: inputs.referenceFactoryProduct.mxBuildId,
          bipVersion: inputs.referenceFactoryProduct.bipVersion,
          bipBuildId: inputs.referenceFactoryProduct.bipBuildId,
        },
        referenceEnvironmentDefinitionId:
          inputs.referenceEnvironmentDefinitionId,
        referenceEnvironmentInfraGroupId:
          inputs.referenceEnvironmentInfraGroupId,
      },
    };
  }
}
