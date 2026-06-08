import { Component, inject, Input, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { ReactiveFormsModule } from "@angular/forms";
import { ExecuteValidationProcessInputComponent } from "./inputs/execute-validation-process-input.component";
import { ErrorAlertComponent } from "@mxflow/ui/alert";
import { ValidationProcessExecutorService } from "./validation-process-executor.service";
import { ExecuteValidationProcessResponse } from "./execute-validation-process-response";
import { ExecuteValidationProcessRequest } from "./execute-validation-process-request";
import { BusinessProcessDefinition } from "../../business-process-definition/business-process-definition";

@Component({
  selector: "mxevolve-validation-process-definition-executor",
  imports: [
    Button,
    Dialog,
    PrimeTemplate,
    ReactiveFormsModule,
    ExecuteValidationProcessInputComponent,
    ErrorAlertComponent,
  ],
  templateUrl: "validation-process-definition-executor.component.html",
})
export class ValidationProcessDefinitionExecutorComponent {
  executorService = inject(ValidationProcessExecutorService);
  router = inject(Router);

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) definition: BusinessProcessDefinition;

  isVisible = false;
  isExecuting = false;

  errorMessage: string | undefined;

  @ViewChild(ExecuteValidationProcessInputComponent)
  inputComponent: ExecuteValidationProcessInputComponent;

  openExecutorModal() {
    this.isVisible = true;
    this.inputComponent.initializeForm(
      this.projectId,
      this.definition.providedInputs
    );
  }

  hideExecutorModal() {
    this.isVisible = false;
    this.inputComponent.resetForm();
  }

  executeValidationDefinition() {
    if (this.inputComponent.form.valid) {
      this.isExecuting = true;
      this.errorMessage = undefined;

      this.executorService
        .executeValidationProcessDefinition(
          this.projectId,
          this.getExecuteValidationProcessRequest()
        )
        .subscribe({
          next: (response: ExecuteValidationProcessResponse) => {
            this.isExecuting = false;
            this.hideExecutorModal();
            this.router
              .navigateByUrl(this.getValidationExecutionUrl(response))
              .then();
          },
          error: (error) => {
            this.isExecuting = false;
            this.errorMessage = error.message;
          },
        });
    }
  }

  private getValidationExecutionUrl(
    response: ExecuteValidationProcessResponse
  ) {
    return `app/${this.projectId}/business-process/validation-processes/execution/${response.id}`;
  }

  private getExecuteValidationProcessRequest(): ExecuteValidationProcessRequest {
    const inputs =
      this.inputComponent.getExecuteValidationProcessDefinitionInputs();

    return {
      definitionId: this.definition.id,
      name: inputs.name,
      official: inputs.official,
      notificationsRecipients: inputs.notificationsRecipients,
      configurationParameters: {
        repositoryId: inputs.repositoryId,
        businessProcessQualityLevel: inputs.businessProcessQualityLevel,
        createBranch: inputs.createBranch,
        parentBranchName: inputs.parentBranchName,
        archivalBranchName: inputs.archivalBranchName,
        configCommitId: inputs.configCommitId,
        rtpCommitId: inputs.rtpCommitId,
        finalProductId: inputs.finalProductId,
      },
      testParameters: {
        qualityGateScenarioDefinitionIds:
          inputs.qualityGateScenarioDefinitionIds,
        nightlyRepusherEnabled: inputs.nightlyRepusherEnabled,
      },
      infrastructureParameters: {
        qualityGateInfraGroupId: inputs.qualityGateInfraGroupId,
      },
      validationScopeParameters: {
        startCommitId: inputs.validationScopeStartCommitId,
      },
    };
  }
}
