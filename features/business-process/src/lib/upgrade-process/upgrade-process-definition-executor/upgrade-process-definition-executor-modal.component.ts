import { Component, Input, ViewChild } from "@angular/core";
import { UpgradeProcessDefinitionExecutorService } from "../service/upgrade-process-definition-executor.service";
import { Router } from "@angular/router";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { ErrorAlertComponent } from "@mxflow/ui/alert";
import { PrimeTemplate } from "primeng/api";
import { ReactiveFormsModule } from "@angular/forms";
import { ProjectUrlPipe } from "@mxflow/features/project";
import { BINARY_UPGRADE_MFE_PATH } from "@mxflow/config";
import { ExecuteUpgradeProcessDefinitionResponse } from "../service/execute-upgrade-process-definition-response";
import { ExecuteUpgradeProcessDefinitionInputsComponent } from "./inputs/execute-upgrade-process-definition-inputs.component";
import { ExecuteUpgradeProcessDefinitionRequest } from "../service/execute-upgrade-process-definition-request";
import { BusinessProcessDefinition } from "../../business-process-definition/business-process-definition";

@Component({
  selector: "mxevolve-upgrade-process-definition-executor-modal",
  imports: [
    Button,
    Dialog,
    ErrorAlertComponent,
    PrimeTemplate,
    ReactiveFormsModule,
    ExecuteUpgradeProcessDefinitionInputsComponent,
  ],
  providers: [UpgradeProcessDefinitionExecutorService, ProjectUrlPipe],
  templateUrl: "./upgrade-process-definition-executor-modal.component.html",
})
export class UpgradeProcessDefinitionExecutorModalComponent {
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) definition: BusinessProcessDefinition;

  isVisible = false;
  isExecuting = false;

  errorMessage: string | undefined;

  @ViewChild(ExecuteUpgradeProcessDefinitionInputsComponent)
  inputsComponent: ExecuteUpgradeProcessDefinitionInputsComponent;

  constructor(
    private service: UpgradeProcessDefinitionExecutorService,
    private router: Router,
    private projectUrlPipe: ProjectUrlPipe
  ) {}

  openExecutorModal() {
    this.isVisible = true;
    this.inputsComponent.initializeForm(
      this.projectId,
      this.definition.providedInputs
    );
  }

  hideExecutorModal() {
    this.isVisible = false;
    this.inputsComponent.resetForm();
  }

  executeUpgradeDefinition() {
    if (this.inputsComponent.form.valid) {
      this.isExecuting = true;
      this.errorMessage = undefined;

      this.service
        .executeUpgradeProcessDefinition(this.getExecuteUpgradeProcessRequest())
        .subscribe({
          next: (response: ExecuteUpgradeProcessDefinitionResponse) =>
            this.handleExecuteSuccessful(response),
          error: (error) => {
            this.errorMessage = error.message;
            this.isExecuting = false;
          },
        });
    }
  }

  private handleExecuteSuccessful(
    response: ExecuteUpgradeProcessDefinitionResponse
  ) {
    this.isExecuting = false;
    this.hideExecutorModal();
    this.router.navigateByUrl(this.getUpgradeExecutionUrl(response)).then();
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
    const inputs =
      this.inputsComponent.getExecuteUpgradeProcessDefinitionInputs();

    return {
      projectId: this.projectId,
      definitionId: this.definition.id,
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
