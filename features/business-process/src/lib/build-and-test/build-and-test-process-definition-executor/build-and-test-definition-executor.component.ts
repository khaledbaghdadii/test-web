import { Component, inject, Input, ViewChild } from "@angular/core";
import { BusinessProcessDefinition } from "@mxflow/features/business-process";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { ErrorAlertComponent } from "@mxflow/ui/alert";
import { PrimeTemplate } from "primeng/api";
import { Router } from "@angular/router";
import { BuildAndTestProcessExecutorService } from "./service/build-and-test-process-executor.service";
import { ExecuteBuildAndTestProcessInputComponent } from "./input/execute-build-and-test-process-input.component";
import { ExecuteBuildAndTestProcessRequest } from "./service/execute-build-and-test-process-request";
import { ExecuteBuildAndTestProcessResponse } from "./service/execute-build-and-test-process-response";

@Component({
  selector: "mxevolve-build-and-test-definition-executor",
  imports: [
    Button,
    Dialog,
    ErrorAlertComponent,
    PrimeTemplate,
    ExecuteBuildAndTestProcessInputComponent,
  ],
  templateUrl: "build-and-test-definition-executor.component.html",
})
export class BuildAndTestDefinitionExecutorComponent {
  executorService = inject(BuildAndTestProcessExecutorService);
  router = inject(Router);

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) definition: BusinessProcessDefinition;

  isVisible = false;
  isExecuting = false;

  errorMessage: string | undefined;

  @ViewChild(ExecuteBuildAndTestProcessInputComponent)
  inputComponent: ExecuteBuildAndTestProcessInputComponent;

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

  executeBuildAndTestDefinition() {
    if (this.inputComponent.form.valid) {
      this.isExecuting = true;
      this.errorMessage = undefined;

      this.executorService
        .executeBuildAndTestProcessDefinition(
          this.projectId,
          this.getExecuteBuildAndTestProcessRequest()
        )
        .subscribe({
          next: (response: ExecuteBuildAndTestProcessResponse) => {
            this.isExecuting = false;
            this.hideExecutorModal();
            this.router
              .navigateByUrl(this.getBuildAndTestExecutionUrl(response))
              .then();
          },
          error: (error: { message: string | undefined }) => {
            this.isExecuting = false;
            this.errorMessage = error.message;
          },
        });
    }
  }

  private getBuildAndTestExecutionUrl(
    response: ExecuteBuildAndTestProcessResponse
  ): string {
    return `app/${this.projectId}/business-process/build-and-test-processes/execution/${response.id}`;
  }

  private getExecuteBuildAndTestProcessRequest(): ExecuteBuildAndTestProcessRequest {
    const inputs = this.inputComponent.getExecuteBuildAndTestProcessInput();

    return {
      definitionId: this.definition.id,
      name: inputs.name,
      repositoryId: inputs.repositoryId,
      configurationBranchName: inputs.configurationBranchName,
      configurationParentBranch: inputs.configurationParentBranch,
      buildAndTestInfraGroup: inputs.buildAndTestInfraGroup,
      buildEnvironmentInfraGroup: inputs.buildEnvironmentInfraGroup,
      userStoryIds: inputs.userStoryIds,
      notificationsRecipients: inputs.notificationsRecipients,
      buildEnvironmentScenarioDefinitionId: inputs.buildScenarioDefinitionId,
      skipPrepareBuildEnvironment: inputs.skipPrepareBuildEnvironment,
    };
  }
}
