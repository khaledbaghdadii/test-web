import { Component, OnDestroy, OnInit, input } from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { RadioButton } from "primeng/radiobutton";
import { FinalProductFromExistingBranchComponent } from "../from-existing-branch/final-product-from-existing-branch.component";
import { DqgFromNewBranchParametersComponent } from "./from-new-branch/dqg-from-new-branch-parameters.component";
import {
  ProvidedDefinitionInput,
  isProvidedByDefinition,
  shouldShowInForm,
} from "@mxevolve/domains/business-process/util";
import { releaseControl } from "../parameter-controls";

/**
 * DQG configuration parameters: the "Create Branch?" decision and whichever
 * sub-form it selects.
 *
 * New-architecture rebuild of the legacy
 * `ValidationProcessDqgParametersComponent`. The existing-branch path is shared
 * with MQG; only the create-branch sub-form differs.
 */
@Component({
  selector: "mxevolve-validation-dqg-parameters",
  templateUrl: "./validation-dqg-parameters.component.html",
  imports: [
    ReactiveFormsModule,
    RadioButton,
    DqgFromNewBranchParametersComponent,
    FinalProductFromExistingBranchComponent,
  ],
})
export class ValidationDqgParametersComponent implements OnInit, OnDestroy {
  readonly projectId = input.required<string>();
  readonly providedInputs = input.required<readonly ProvidedDefinitionInput[]>();
  readonly repositoryId = input.required<string>();
  readonly createBranchFormControl =
    input.required<FormControl<boolean | null>>();
  readonly archivalBranchNameFormControl =
    input.required<FormControl<string | null>>();
  readonly finalProductIdFormControl =
    input.required<FormControl<string | null>>();
  readonly configCommitIdFormControl =
    input.required<FormControl<string | null>>();
  readonly rtpCommitIdFormControl =
    input.required<FormControl<string | null>>();

  protected readonly Validators = Validators;

  /**
   * Whether the "Create Branch?" radio group is offered for editing. See the MQG
   * twin: legacy gated it with `ACCESS_INVALID_INPUTS_ONLY` so a
   * definition-prefilled `createBranch` stayed hidden, and the decision is taken
   * once so answering the question does not make it disappear.
   */
  protected showCreateBranch = false;

  ngOnInit(): void {
    this.createBranchFormControl().enable({ emitEvent: false });
    this.showCreateBranch = shouldShowInForm(
      this.createBranchFormControl(),
      "ACCESS_INVALID_INPUTS_ONLY",
      this.notProvided("createBranch")
    );
  }

  ngOnDestroy(): void {
    releaseControl(this.createBranchFormControl());
  }

  protected notProvided(inputId: string): boolean {
    return !isProvidedByDefinition(this.providedInputs(), inputId);
  }
}
