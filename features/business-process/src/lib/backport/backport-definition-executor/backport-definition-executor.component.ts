import { BackportProcessExecutorService } from "./service/backport-process-executor.service";
import { Component, inject, Input, ViewChild } from "@angular/core";
import { BusinessProcessDefinition } from "@mxflow/features/business-process";
import { Router } from "@angular/router";
import { ExecuteBackportProcessInputComponent } from "./input/execute-backport-process-input.component";
import { ExecuteBackportProcessRequest } from "./service/execute-backport-process-request";
import { ExecuteBackportProcessResponse } from "./service/execute-backport-process-response";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { ErrorAlertComponent } from "@mxflow/ui/alert";
import { PrimeTemplate } from "primeng/api";

@Component({
  selector: "mxevolve-backport-definition-executor",
  imports: [
    Button,
    Dialog,
    ErrorAlertComponent,
    PrimeTemplate,
    ExecuteBackportProcessInputComponent,
  ],
  templateUrl: "backport-definition-executor.component.html",
})
export class BackportDefinitionExecutorComponent {
  executorService = inject(BackportProcessExecutorService);
  router = inject(Router);

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) definition: BusinessProcessDefinition;

  isVisible = false;
  isExecuting = false;

  errorMessage: string | undefined;

  @ViewChild(ExecuteBackportProcessInputComponent)
  inputComponent: ExecuteBackportProcessInputComponent;

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

  executeBackportDefinition() {
    if (this.inputComponent.form.valid) {
      this.isExecuting = true;
      this.errorMessage = undefined;

      this.executorService
        .executeBackportProcessDefinition(
          this.projectId,
          this.getExecuteBackportProcessRequest()
        )
        .subscribe({
          next: (response) => {
            this.isExecuting = false;
            this.hideExecutorModal();
            this.router
              .navigateByUrl(this.getBackportExecutionUrl(response))
              .then();
          },
          error: (error) => {
            this.isExecuting = false;
            this.errorMessage = error.message;
          },
        });
    }
  }

  private getExecuteBackportProcessRequest(): ExecuteBackportProcessRequest {
    const inputs = this.inputComponent.getExecuteBackportProcessInput();

    return {
      name: inputs.name,
      definitionId: this.definition.id,
      repositoryId: this.getInputValue("repositoryId"),
      destinationMergeConfigurationId: this.getInputValue(
        "mergeConfigurationId"
      ),
      pullRequestToBeBackported: inputs.pullRequestId,
      pullRequestTitle: inputs.pullRequestTitle,
      pullRequestReviewers: inputs.pullRequestReviewers.map(
        (reviewer) => reviewer.name
      ),
      userStoryIds: inputs.userStoryIds || [],
      buildAndTestInfraGroup: this.getInputValue("buildAndTestInfraGroup"),
      notificationsRecipients: inputs.notificationsRecipients,
    };
  }

  private getInputValue(id: string): string {
    const input = this.definition.providedInputs.find(
      (input) => input.inputId === id
    );
    if (!input?.value) {
      throw new Error(`Required input '${id}' not found or has no value`);
    }
    return input.value;
  }

  private getBackportExecutionUrl(
    response: ExecuteBackportProcessResponse
  ): string {
    return `app/${this.projectId}/business-process/build-and-test-processes/execution/${response.id}`;
  }
}
