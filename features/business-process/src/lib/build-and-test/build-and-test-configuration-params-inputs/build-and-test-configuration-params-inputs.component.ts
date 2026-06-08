import { Component, inject, Input, OnInit } from "@angular/core";

import { BusinessProcessRepositorySelectorComponent } from "@mxflow/ui/inputs";
import { DefinitionInputComponent } from "../../definition-input/definition-input.component";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { InputAccessMode } from "../../definition-input/input-access-mode";
import { DisplayMode } from "../../definition-input/display-mode";
import { BranchInputComponent } from "@mxflow/features/scm";
import { ToastMessageService } from "@mxflow/ui/alert";

@Component({
  selector: "mxevolve-build-and-test-configuration-params-inputs",
  imports: [
    BusinessProcessRepositorySelectorComponent,
    DefinitionInputComponent,
    ReactiveFormsModule,
    BranchInputComponent,
  ],
  templateUrl: "./build-and-test-configuration-params-inputs.component.html",
})
export class BuildAndTestConfigurationParamsInputsComponent implements OnInit {
  @Input({ required: true }) repositoryIdFormControl: FormControl;
  @Input({ required: true }) configurationBranchNameFormControl: FormControl;
  @Input({ required: true }) configurationParentBranchFormControl: FormControl;
  @Input({ required: true }) projectId: string;
  @Input() inputAccessMode: InputAccessMode = InputAccessMode.ACCESS_ALL_INPUTS;
  @Input() displayMode: DisplayMode = DisplayMode.FULL_PAGE;

  @Input() forceShowConfigurationBranchName = false;
  @Input() forceShowRepositoryId = false;
  @Input() forceShowConfigurationParentBranch = false;

  private readonly toastService = inject(ToastMessageService);

  configurationBranchNameInitialValue: string = "";
  parentBranchNameInitialValue: string = "";

  ngOnInit(): void {
    this.configurationBranchNameInitialValue =
      this.configurationBranchNameFormControl.value;
    this.parentBranchNameInitialValue =
      this.configurationParentBranchFormControl.value;
  }

  resetConfigurationParamsInputs() {
    this.configurationBranchNameFormControl.reset();
    this.configurationParentBranchFormControl.reset();
  }

  showConfigBranchError() {
    this.toastService.showError(
      "The branch name available in the BP definition or pre-filled in the pop-up already exists in the repository. Please update the definition or the pop-up with a unique name to create a new branch."
    );
  }

  showParentBranchError() {
    this.toastService.showError(
      "The branch name available in the BP definition doesn't exist in the repository. Please check the name and try again with an existing branch."
    );
  }
}
