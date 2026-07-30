import { Component, OnDestroy, OnInit, input } from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { RadioButton } from "primeng/radiobutton";
import { FinalProductFromExistingBranchComponent } from "../from-existing-branch/final-product-from-existing-branch.component";
import { MqgFromNewBranchParametersComponent } from "./from-new-branch/mqg-from-new-branch-parameters.component";
import {
  ProvidedDefinitionInput,
  isProvidedByDefinition,
  shouldShowInForm,
} from "@mxevolve/domains/business-process/util";
import { releaseControl } from "../parameter-controls";

/**
 * MQG configuration parameters: the "Create Branch?" decision and whichever
 * sub-form it selects.
 *
 * New-architecture rebuild of the legacy
 * `ValidationProcessMqgParametersComponent`.
 */
@Component({
  selector: "mxevolve-validation-mqg-parameters",
  templateUrl: "./validation-mqg-parameters.component.html",
  imports: [
    ReactiveFormsModule,
    RadioButton,
    MqgFromNewBranchParametersComponent,
    FinalProductFromExistingBranchComponent,
  ],
})
export class ValidationMqgParametersComponent implements OnInit, OnDestroy {
  readonly projectId = input.required<string>();
  readonly providedInputs = input.required<readonly ProvidedDefinitionInput[]>();
  readonly repositoryId = input.required<string>();
  readonly createBranchFormControl =
    input.required<FormControl<boolean | null>>();
  readonly parentBranchNameFormControl =
    input.required<FormControl<string | null>>();
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
   * Whether the "Create Branch?" radio group is offered for editing.
   *
   * Legacy wrapped the group in `mxevolve-definition-input` with
   * `ACCESS_INVALID_INPUTS_ONLY`, so a definition-prefilled `createBranch` was
   * hidden. The gate lives here rather than in a wrapper because the group is a
   * `fieldset`/`legend`, which the wrapper's `label` would duplicate.
   *
   * Decided once, exactly like the wrapper does: the control turns valid the
   * moment the user answers, and the question must not vanish underneath them.
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
