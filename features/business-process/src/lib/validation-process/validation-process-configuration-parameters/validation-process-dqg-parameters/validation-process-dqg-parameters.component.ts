import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { InputTextModule } from "primeng/inputtext";
import { RadioButtonModule } from "primeng/radiobutton";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { AsyncPipe } from "@angular/common";
import { map, Observable, startWith } from "rxjs";
import { DqgFromNewBranchParametersComponent } from "./dqg-from-new-branch-parameters/dqg-from-new-branch-parameters.component";
import { FinalProductFromExistingBranchComponent } from "../final-product-from-existing-branch/final-product-from-existing-branch.component";
import { DefinitionInputComponent } from "../../../definition-input/definition-input.component";
import { DisplayMode } from "../../../definition-input/display-mode";
import { InputAccessMode } from "../../../definition-input/input-access-mode";

@Component({
  selector: "mxevolve-validation-process-dqg-parameters",
  templateUrl: "validation-process-dqg-parameters.component.html",
  imports: [
    DefinitionInputComponent,
    InputTextModule,
    RadioButtonModule,
    ReactiveFormsModule,
    AsyncPipe,
    DqgFromNewBranchParametersComponent,
    FinalProductFromExistingBranchComponent,
  ],
})
export class ValidationProcessDqgParametersComponent
  implements OnInit, OnDestroy
{
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) repositoryIdFormControl: FormControl;
  @Input({ required: true }) createBranchFormControl: FormControl;
  @Input({ required: true }) archivalBranchNameFormControl: FormControl;
  @Input({ required: true }) parentBranchFormControl: FormControl;
  @Input({ required: true }) finalProductIdFromControl: FormControl;
  @Input({ required: true }) rtpCommitIdFromControl: FormControl;
  @Input({ required: true }) configCommitIdFromControl: FormControl;
  @Input({ required: true }) displayMode: DisplayMode;
  @Input({ required: true }) inputAccessMode: InputAccessMode;
  @Input() prefilledInputsToShow: string[] = [];

  isCreateBranchSelected$: Observable<boolean>;
  isUseExistingBranchSelected$: Observable<boolean>;

  forceShowCreateBranch = false;

  ngOnInit(): void {
    this.initialize();

    this.isCreateBranchSelected$ =
      this.createBranchFormControl.valueChanges.pipe(
        startWith(this.createBranchFormControl.value),
        map((value) => value === true)
      );

    this.isUseExistingBranchSelected$ =
      this.createBranchFormControl.valueChanges.pipe(
        startWith(this.createBranchFormControl.value),
        map((value) => value === false)
      );

    this.forceShowCreateBranch =
      this.prefilledInputsToShow.includes("createBranch");
  }

  private initialize() {
    this.enableCreateBranchSelection();
    this.mapCreateBranchControlValueToBoolean();
  }

  private enableCreateBranchSelection() {
    this.createBranchFormControl.enable();
  }

  private mapCreateBranchControlValueToBoolean() {
    if (
      this.createBranchFormControl.value === true ||
      this.createBranchFormControl.value === "true"
    ) {
      this.createBranchFormControl.setValue(true);
    }
    if (
      this.createBranchFormControl.value === false ||
      this.createBranchFormControl.value === "false"
    ) {
      this.createBranchFormControl.setValue(false);
    }
  }

  ngOnDestroy() {
    this.clearCreateBranchSelection();
    this.disableCreateBranchSelection();
  }

  private clearCreateBranchSelection() {
    this.createBranchFormControl.setValue(undefined);
  }

  private disableCreateBranchSelection() {
    this.createBranchFormControl.disable();
  }

  protected readonly DisplayMode = DisplayMode;
}
