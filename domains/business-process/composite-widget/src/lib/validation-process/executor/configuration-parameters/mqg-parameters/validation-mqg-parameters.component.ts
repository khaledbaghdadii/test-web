import { Component, OnDestroy, OnInit, input } from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { RadioButton } from "primeng/radiobutton";
import { FinalProductFromExistingBranchComponent } from "../from-existing-branch/final-product-from-existing-branch.component";
import { MqgFromNewBranchParametersComponent } from "./from-new-branch/mqg-from-new-branch-parameters.component";
import {
  ProvidedDefinitionInput,
  isProvidedByDefinition,
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
  readonly preselectedFinalProductId = input<string | null>(null);

  protected readonly Validators = Validators;

  ngOnInit(): void {
    this.createBranchFormControl().enable({ emitEvent: false });
  }

  ngOnDestroy(): void {
    releaseControl(this.createBranchFormControl());
  }

  protected notProvided(inputId: string): boolean {
    return !isProvidedByDefinition(this.providedInputs(), inputId);
  }
}
