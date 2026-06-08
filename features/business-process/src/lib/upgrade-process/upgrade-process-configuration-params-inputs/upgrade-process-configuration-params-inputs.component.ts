import { Component, inject, Input, OnDestroy, OnInit } from "@angular/core";

import { BusinessProcessRepositorySelectorComponent } from "@mxflow/ui/inputs";
import { DefinitionInputComponent } from "../../definition-input/definition-input.component";
import { RadioButton } from "primeng/radiobutton";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { InputAccessMode } from "../../definition-input/input-access-mode";
import { DisplayMode } from "../../definition-input/display-mode";
import { BranchInputComponent } from "@mxflow/features/scm";
import { ToastMessageService } from "@mxflow/ui/alert";
import { filter, Subject, takeUntil } from "rxjs";
import { Select } from "primeng/select";

@Component({
  selector: "mxevolve-upgrade-process-configuration-params-inputs",
  imports: [
    BusinessProcessRepositorySelectorComponent,
    DefinitionInputComponent,
    RadioButton,
    ReactiveFormsModule,
    BranchInputComponent,
    Select,
  ],
  templateUrl: "./upgrade-process-configuration-params-inputs.component.html",
})
export class UpgradeProcessConfigurationParamsInputsComponent
  implements OnInit, OnDestroy
{
  @Input({ required: true }) repositoryIdFormControl: FormControl;
  @Input({ required: true })
  businessProcessQualityLevelFormControl: FormControl;
  @Input({ required: true }) createBranchFormControl: FormControl;
  @Input({ required: true }) configurationBranchNameFormControl: FormControl;
  @Input({ required: true }) configurationParentBranchFormControl: FormControl;
  @Input({ required: true }) projectId: string;
  @Input() inputAccessMode: InputAccessMode = InputAccessMode.ACCESS_ALL_INPUTS;
  @Input() displayMode: DisplayMode = DisplayMode.FULL_PAGE;
  @Input() forceShowConfigurationBranchName = false;
  @Input() forceShowRepositoryId = false;
  @Input() forceShowBusinessProcessQualityLevel = false;
  @Input() forceShowCreateBranch = false;
  @Input() forceShowConfigurationParentBranch = false;

  private readonly toastService = inject(ToastMessageService);
  private readonly destroy$ = new Subject();
  configurationBranchNameInitialValue: string = "";
  parentBranchNameInitialValue: string = "";

  ngOnInit(): void {
    this.configurationBranchNameInitialValue =
      this.configurationBranchNameFormControl.value;
    this.parentBranchNameInitialValue =
      this.configurationParentBranchFormControl.value;

    this.createBranchFormControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.configurationBranchNameFormControl.reset();
        this.configurationParentBranchFormControl.reset();
      });

    this.repositoryIdFormControl.valueChanges
      .pipe(
        filter((value) => !value),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.createBranchFormControl.reset();
        this.configurationBranchNameFormControl.reset();
        this.configurationParentBranchFormControl.reset();
      });

    if (this.businessProcessQualityLevelFormControl.value === "NA") {
      this.businessProcessQualityLevelFormControl.reset();
    }
  }

  ngOnDestroy() {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  resetConfigurationParamsInputs() {
    this.createBranchFormControl.reset();
    this.configurationBranchNameFormControl.reset();
    this.configurationParentBranchFormControl.reset();
  }

  showConfigBranchError() {
    if (this.createBranchFormControl.value === false) {
      this.toastService.showError(
        "The branch name available in the BP definition doesn't exist in the repository. Please check the name and try again with an existing branch."
      );
    } else {
      this.toastService.showError(
        "The branch name available in the BP definition already exists in the repository. Please update the definition with a unique name to create a new branch."
      );
    }
  }

  showParentBranchError() {
    this.toastService.showError(
      "The branch name you entered doesn't exist in the repository. Please check the name and try again with an existing branch."
    );
  }
}
