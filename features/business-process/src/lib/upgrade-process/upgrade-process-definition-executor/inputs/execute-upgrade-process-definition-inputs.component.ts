import { Component } from "@angular/core";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import {
  BusinessProcessEnvironmentDefinitionSelectorComponent,
  BusinessProcessFactoryProductSelectorComponent,
  BusinessProcessInfraGroupSelectorComponent,
  BusinessProcessScenarioDefinitionSelectorComponent,
  BusinessProcessUpgradeJumpSelectorComponent,
} from "@mxflow/ui/inputs";
import { InputText } from "primeng/inputtext";
import { RadioButton } from "primeng/radiobutton";
import { ExecuteUpgradeProcessDefinitionInputs } from "./execute-upgrade-process-definition-inputs";

import { MandatoryFieldModule } from "@mxflow/ui/alert";
import { DefinitionInputComponent } from "../../../definition-input/definition-input.component";
import { DefinitionInputGroupComponent } from "../../../definition-input-group/definition-input-group.component";
import { InputValidationMode } from "../../../definition-input/input-validation-mode";
import { DisplayMode } from "../../../definition-input/display-mode";
import { InputAccessMode } from "../../../definition-input/input-access-mode";
import { DefinitionInputsValidators } from "../../../definition-input/validators/definition-inputs-validators";
import { ProvidedInput } from "../../../business-process-definition/business-process-definition";
import { WhitespaceValidators } from "@mxflow/validator";
import { UpgradeProcessConfigurationParamsInputsComponent } from "../../upgrade-process-configuration-params-inputs/upgrade-process-configuration-params-inputs.component";
import { BusinessProcessNotificationsRecipientsInputComponent } from "../../../business-process-notifications-recipients-input/business-process-notifications-recipients-input.component";

@Component({
  selector: "mxevolve-execute-upgrade-process-definition-inputs",
  imports: [
    BusinessProcessEnvironmentDefinitionSelectorComponent,
    BusinessProcessFactoryProductSelectorComponent,
    BusinessProcessInfraGroupSelectorComponent,
    BusinessProcessScenarioDefinitionSelectorComponent,
    DefinitionInputComponent,
    DefinitionInputGroupComponent,
    FormsModule,
    InputText,
    RadioButton,
    ReactiveFormsModule,
    MandatoryFieldModule,
    BusinessProcessUpgradeJumpSelectorComponent,
    UpgradeProcessConfigurationParamsInputsComponent,
    BusinessProcessNotificationsRecipientsInputComponent,
  ],
  templateUrl: "execute-upgrade-process-definition-inputs.component.html",
})
export class ExecuteUpgradeProcessDefinitionInputsComponent {
  protected readonly InputAccessMode = InputAccessMode;
  protected readonly DisplayMode = DisplayMode;

  projectId: string;

  isFormInitialized = false;
  form: FormGroup;

  nameFormControl: FormControl;
  officialFormControl: FormControl;
  conversionFactoryProductFormControl: FormControl;
  repositoryIdFormControl: FormControl;
  businessProcessQualityLevelFormControl: FormControl;
  parentMxArchivalBranchNameFormControl: FormControl;
  upgradeJumpFormControl: FormControl;
  createBranchFormControl: FormControl;
  configurationBranchNameFormControl: FormControl;
  configurationParentBranchNameFormControl: FormControl;
  qualityGateExecutionInfraGroupIdFormControl: FormControl;
  binaryConversionInfraGroupIdFormControl: FormControl;
  qualityGateScenarioDefinitionIdsFormControl: FormControl;
  binaryConversionTestScenarioIdFormControl: FormControl;
  referenceFactoryProductFormControl: FormControl;
  referenceCommitIdFormControl: FormControl;
  referenceEnvironmentDefinitionIdFormControl: FormControl;
  referenceEnvironmentInfraGroupIdFormControl: FormControl;
  notificationsRecipientsFormControl: FormControl;

  mxParametersFormControls: FormControl[] = [];
  configurationParametersFormControls: FormControl[] = [];
  infraParametersFormControls: FormControl[] = [];
  testParametersFormControls: FormControl[] = [];
  referenceEnvironmentParametersFormControls: FormControl[] = [];

  initializeForm(projectId: string, providedInputs: ProvidedInput[]): void {
    this.projectId = projectId;

    this.nameFormControl = new FormControl(null, [
      Validators.required,
      WhitespaceValidators.notBlank(),
    ]);

    this.officialFormControl = new FormControl(
      null,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.conversionFactoryProductFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "factoryProduct"),
      DefinitionInputsValidators.factoryProductValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.parentMxArchivalBranchNameFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "parentMxArchivalBranch"),
      DefinitionInputsValidators.standardCopiableTextInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.upgradeJumpFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "upgradeJump"),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.repositoryIdFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "repositoryId"),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.businessProcessQualityLevelFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "businessProcessQualityLevel"),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.createBranchFormControl = new FormControl(
      this.mapCreateBranchControlValueToBoolean(
        this.getProvidedInput(providedInputs, "createBranch")
      ),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.configurationBranchNameFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "configurationBranchName"),
      Validators.required
    );

    this.configurationParentBranchNameFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "configurationParentBranch"),
      Validators.required
    );

    this.qualityGateExecutionInfraGroupIdFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "qualityGateExecutionInfraGroupId"),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.binaryConversionInfraGroupIdFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "binaryConversionInfraGroupId"),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.qualityGateScenarioDefinitionIdsFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "testScenarioIds"),
      DefinitionInputsValidators.standardMultiSelectInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.binaryConversionTestScenarioIdFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "technicalUpgradeTestScenarioId"),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.referenceCommitIdFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "referenceCommitId"),
      DefinitionInputsValidators.standardCopiableTextInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.referenceFactoryProductFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "referenceFactoryProduct"),
      DefinitionInputsValidators.factoryProductValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.referenceEnvironmentDefinitionIdFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "referenceEnvironmentDefinitionId"),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.referenceEnvironmentInfraGroupIdFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "referenceEnvironmentInfraGroupId"),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.notificationsRecipientsFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "notificationsRecipients")
    );

    this.mxParametersFormControls = [
      this.conversionFactoryProductFormControl,
      this.parentMxArchivalBranchNameFormControl,
      this.upgradeJumpFormControl,
    ];

    this.configurationParametersFormControls = [
      this.createBranchFormControl,
      this.repositoryIdFormControl,
      this.businessProcessQualityLevelFormControl,
      this.configurationBranchNameFormControl,
      this.configurationParentBranchNameFormControl,
    ];

    this.infraParametersFormControls = [
      this.qualityGateExecutionInfraGroupIdFormControl,
      this.binaryConversionInfraGroupIdFormControl,
    ];

    this.testParametersFormControls = [
      this.binaryConversionTestScenarioIdFormControl,
      this.qualityGateScenarioDefinitionIdsFormControl,
    ];

    this.referenceEnvironmentParametersFormControls = [
      this.referenceFactoryProductFormControl,
      this.referenceEnvironmentDefinitionIdFormControl,
      this.referenceEnvironmentInfraGroupIdFormControl,
      this.referenceCommitIdFormControl,
    ];

    this.form = new FormGroup({
      name: this.nameFormControl,
      official: this.officialFormControl,
      factoryProduct: this.conversionFactoryProductFormControl,
      parentMxArchivalBranch: this.parentMxArchivalBranchNameFormControl,
      upgradeJump: this.upgradeJumpFormControl,
      repositoryId: this.repositoryIdFormControl,
      businessProcessQualityLevel: this.businessProcessQualityLevelFormControl,
      createBranch: this.createBranchFormControl,
      configurationBranchName: this.configurationBranchNameFormControl,
      configurationParentBranch: this.configurationParentBranchNameFormControl,
      qualityGateExecutionInfraGroupId:
        this.qualityGateExecutionInfraGroupIdFormControl,
      binaryConversionInfraGroupId:
        this.binaryConversionInfraGroupIdFormControl,
      testScenarioIds: this.qualityGateScenarioDefinitionIdsFormControl,
      technicalUpgradeTestScenarioId:
        this.binaryConversionTestScenarioIdFormControl,
      referenceCommitId: this.referenceCommitIdFormControl,
      referenceFactoryProduct: this.referenceFactoryProductFormControl,
      referenceEnvironmentDefinitionId:
        this.referenceEnvironmentDefinitionIdFormControl,
      referenceEnvironmentInfraGroupId:
        this.referenceEnvironmentInfraGroupIdFormControl,
      notificationsRecipients: this.notificationsRecipientsFormControl,
    });

    this.isFormInitialized = true;
  }

  resetForm() {
    this.isFormInitialized = false;
  }

  getExecuteUpgradeProcessDefinitionInputs(): ExecuteUpgradeProcessDefinitionInputs {
    return this.form.value;
  }

  private getProvidedInput(providedInputs: ProvidedInput[], inputId: string) {
    return providedInputs.find(
      (providedInput) => providedInput.inputId == inputId
    )?.value;
  }

  private mapCreateBranchControlValueToBoolean(createBranch: string | boolean) {
    if (createBranch === true || createBranch === "true") {
      return true;
    }

    if (createBranch === false || createBranch === "false") {
      return false;
    }

    return undefined;
  }
}
