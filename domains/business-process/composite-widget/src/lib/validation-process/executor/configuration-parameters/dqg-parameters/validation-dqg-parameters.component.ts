import { Component, OnDestroy, OnInit, input } from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { RadioButton } from "primeng/radiobutton";
import { FinalProductFromExistingBranchComponent } from "../from-existing-branch/final-product-from-existing-branch.component";
import { DqgFromNewBranchParametersComponent } from "./from-new-branch/dqg-from-new-branch-parameters.component";
import { injectInputVisibility } from "../../../../shared/input-visibility.store";

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
  /** Executor-owned per-field visibility (VAL-27132 W3, finding V2). */
  protected readonly inputVisibility = injectInputVisibility();

  readonly projectId = input.required<string>();
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
  readonly preselectedFinalProductId = input<string | null>(null);

  protected readonly Validators = Validators;

  ngOnInit(): void {
    this.createBranchFormControl().enable({ emitEvent: false });
  }

  ngOnDestroy(): void {
    const createBranch = this.createBranchFormControl();
    createBranch.reset(null, { emitEvent: false });
    createBranch.disable({ emitEvent: false });
  }
}
