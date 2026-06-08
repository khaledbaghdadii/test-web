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
import { RepushUpgradeProcessDefinitionInputs } from "./repush-upgrade-process-definition-inputs";

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
import { UpgradeProcessExecution } from "../../upgrade-process-execution";

@Component({
  selector: "mxevolve-repush-upgrade-process-definition-inputs",
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
  templateUrl: "repush-upgrade-process-definition-inputs.component.html",
})
export class RepushUpgradeProcessDefinitionInputsComponent {
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

  forceShowFactoryProduct = false;
  forceShowParentMxArchivalBranch = false;
  forceShowUpgradeJump = false;
  forceShowRepositoryId = false;
  forceShowBusinessProcessQualityLevel = false;
  forceShowCreateBranch = false;
  forceShowConfigurationBranchName = false;
  forceShowConfigurationParentBranch = false;
  forceShowQualityGateExecutionInfraGroupId = false;
  forceShowBinaryConversionInfraGroupId = false;
  forceShowTechnicalUpgradeTestScenarioId = false;
  forceShowQualityGateTestScenarioIds = false;
  forceShowReferenceFactoryProduct = false;
  forceShowReferenceCommitId = false;
  forceShowReferenceEnvironmentDefinitionId = false;
  forceShowReferenceEnvironmentInfraGroupId = false;
  forceShowNotificationsRecipients = false;

  forceShowMxParameters = false;
  forceShowConfigurationParameters = false;
  forceShowInfraParameters = false;
  forceShowTestParameters = false;
  forceShowReferenceEnvironmentParameters = false;

  initializeForm(
    projectId: string,
    providedInputs: ProvidedInput[],
    execution: UpgradeProcessExecution
  ): void {
    this.projectId = projectId;

    this.initializeNameFormControl(execution);

    this.initializeOfficialityFormControl();

    this.initializeMxParameters(providedInputs, execution);

    this.initializeConfigurationParameters(providedInputs, execution);

    this.initializeInfraGroupParameters(providedInputs, execution);

    this.initializeTestParameters(providedInputs, execution);

    this.initializeReferenceEnvironmentParameters(providedInputs, execution);

    this.initializeNotificationRecipientsInput(providedInputs, execution);

    this.form = new FormGroup({
      name: this.nameFormControl,
      official: this.officialFormControl,
      factoryProduct: this.conversionFactoryProductFormControl,
      parentMxArchivalBranch: this.parentMxArchivalBranchNameFormControl,
      repositoryId: this.repositoryIdFormControl,
      businessProcessQualityLevel: this.businessProcessQualityLevelFormControl,
      upgradeJump: this.upgradeJumpFormControl,
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

  private initializeNotificationRecipientsInput(
    providedInputs: ProvidedInput[],
    execution: UpgradeProcessExecution
  ) {
    this.notificationsRecipientsFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "notificationsRecipients") ||
        execution.notificationsRecipients
    );

    this.forceShowNotificationsRecipients = !this.getProvidedInput(
      providedInputs,
      "notificationsRecipients"
    );
  }

  private initializeReferenceEnvironmentParameters(
    providedInputs: ProvidedInput[],
    execution: UpgradeProcessExecution
  ) {
    this.referenceCommitIdFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "referenceCommitId") ||
        execution.input.referenceCommitId,
      DefinitionInputsValidators.standardCopiableTextInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.referenceFactoryProductFormControl = new FormControl(
      this.getFactoryProductProvidedInput(
        providedInputs,
        "referenceFactoryProduct"
      ) || {
        id: execution.input.referenceFactoryProductId,
        mxVersion: execution.input.referenceMxVersion,
        mxBuildId: execution.input.referenceMxBuildId,
        bipVersion: execution.input.referenceBipVersion,
        bipBuildId: execution.input.referenceBipBuildId,
      },
      DefinitionInputsValidators.factoryProductValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.referenceEnvironmentDefinitionIdFormControl = new FormControl(
      this.getProvidedInput(
        providedInputs,
        "referenceEnvironmentDefinitionId"
      ) || execution.input.referenceEnvironmentDefinitionId,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.referenceEnvironmentInfraGroupIdFormControl = new FormControl(
      this.getProvidedInput(
        providedInputs,
        "referenceEnvironmentInfraGroupId"
      ) || execution.input.referenceEnvironmentInfraGroupId,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.forceShowReferenceCommitId = !this.getProvidedInput(
      providedInputs,
      "referenceCommitId"
    );
    this.forceShowReferenceFactoryProduct =
      !this.getFactoryProductProvidedInput(
        providedInputs,
        "referenceFactoryProduct"
      );
    this.forceShowReferenceEnvironmentDefinitionId = !this.getProvidedInput(
      providedInputs,
      "referenceEnvironmentDefinitionId"
    );
    this.forceShowReferenceEnvironmentInfraGroupId = !this.getProvidedInput(
      providedInputs,
      "referenceEnvironmentInfraGroupId"
    );

    this.referenceEnvironmentParametersFormControls = [
      this.referenceFactoryProductFormControl,
      this.referenceEnvironmentDefinitionIdFormControl,
      this.referenceEnvironmentInfraGroupIdFormControl,
      this.referenceCommitIdFormControl,
    ];

    this.forceShowReferenceEnvironmentParameters =
      this.forceShowReferenceFactoryProduct ||
      this.forceShowReferenceEnvironmentDefinitionId ||
      this.forceShowReferenceEnvironmentInfraGroupId ||
      this.forceShowReferenceCommitId;
  }

  private initializeTestParameters(
    providedInputs: ProvidedInput[],
    execution: UpgradeProcessExecution
  ) {
    this.qualityGateScenarioDefinitionIdsFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "testScenarioIds") ||
        execution.input.testScenarioIds,
      DefinitionInputsValidators.standardMultiSelectInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.binaryConversionTestScenarioIdFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "technicalUpgradeTestScenarioId") ||
        execution.input.binaryConversionTestScenarioId,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.forceShowQualityGateTestScenarioIds = !this.getProvidedInput(
      providedInputs,
      "testScenarioIds"
    );
    this.forceShowTechnicalUpgradeTestScenarioId = !this.getProvidedInput(
      providedInputs,
      "technicalUpgradeTestScenarioId"
    );

    this.testParametersFormControls = [
      this.binaryConversionTestScenarioIdFormControl,
      this.qualityGateScenarioDefinitionIdsFormControl,
    ];

    this.forceShowTestParameters =
      this.forceShowQualityGateTestScenarioIds ||
      this.forceShowTechnicalUpgradeTestScenarioId;
  }

  private initializeInfraGroupParameters(
    providedInputs: ProvidedInput[],
    execution: UpgradeProcessExecution
  ) {
    this.qualityGateExecutionInfraGroupIdFormControl = new FormControl(
      this.getProvidedInput(
        providedInputs,
        "qualityGateExecutionInfraGroupId"
      ) || execution.input.qualityGateExecutionInfraGroupId,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.binaryConversionInfraGroupIdFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "binaryConversionInfraGroupId") ||
        execution.input.binaryConversionInfraGroupId,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.forceShowQualityGateExecutionInfraGroupId = !this.getProvidedInput(
      providedInputs,
      "qualityGateExecutionInfraGroupId"
    );
    this.forceShowBinaryConversionInfraGroupId = !this.getProvidedInput(
      providedInputs,
      "binaryConversionInfraGroupId"
    );

    this.infraParametersFormControls = [
      this.qualityGateExecutionInfraGroupIdFormControl,
      this.binaryConversionInfraGroupIdFormControl,
    ];

    this.forceShowInfraParameters =
      this.forceShowQualityGateExecutionInfraGroupId ||
      this.forceShowBinaryConversionInfraGroupId;
  }

  private initializeConfigurationParameters(
    providedInputs: ProvidedInput[],
    execution: UpgradeProcessExecution
  ) {
    this.repositoryIdFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "repositoryId") ||
        execution.input.repositoryId,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.businessProcessQualityLevelFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "businessProcessQualityLevel") ||
        execution.input.businessProcessQualityLevel,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.createBranchFormControl = new FormControl(
      this.mapCreateBranchControlValueToBoolean(
        this.getProvidedInput(providedInputs, "createBranch") ??
          execution.input.createBranch
      ),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.forceShowRepositoryId = !this.getProvidedInput(
      providedInputs,
      "repositoryId"
    );
    this.forceShowBusinessProcessQualityLevel = !this.getProvidedInput(
      providedInputs,
      "businessProcessQualityLevel"
    );
    this.forceShowCreateBranch =
      this.getProvidedInput(providedInputs, "createBranch") === undefined;

    this.configurationBranchNameFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "configurationBranchName") ||
        execution.input.configurationBranchName,
      Validators.required
    );

    this.forceShowConfigurationBranchName = !this.getProvidedInput(
      providedInputs,
      "configurationBranchName"
    );

    this.configurationParentBranchNameFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "configurationParentBranch") ||
        execution.input.configurationParentBranch,
      Validators.required
    );

    this.forceShowConfigurationParentBranch = !this.getProvidedInput(
      providedInputs,
      "configurationParentBranch"
    );

    this.configurationParametersFormControls = [
      this.createBranchFormControl,
      this.repositoryIdFormControl,
      this.businessProcessQualityLevelFormControl,
      this.configurationBranchNameFormControl,
      this.configurationParentBranchNameFormControl,
    ];

    this.forceShowConfigurationParameters = [
      this.forceShowCreateBranch,
      this.forceShowRepositoryId,
      this.forceShowBusinessProcessQualityLevel,
      this.forceShowConfigurationBranchName,
      this.forceShowConfigurationParentBranch,
    ].some((isShow) => isShow);
  }

  private initializeMxParameters(
    providedInputs: ProvidedInput[],
    execution: UpgradeProcessExecution
  ) {
    this.conversionFactoryProductFormControl = new FormControl(
      this.getFactoryProductProvidedInput(providedInputs, "factoryProduct") || {
        id: execution.input.factoryProductId,
        mxVersion: execution.input.mxVersion,
        mxBuildId: execution.input.mxBuildId,
        bipVersion: execution.input.bipVersion,
        bipBuildId: execution.input.bipBuildId,
      },
      DefinitionInputsValidators.factoryProductValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.parentMxArchivalBranchNameFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "parentMxArchivalBranch") ||
        execution.input.parentMxArchivalBranch,
      DefinitionInputsValidators.standardCopiableTextInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.upgradeJumpFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "upgradeJump") ||
        execution.input.upgradeJump,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.forceShowFactoryProduct = !this.getFactoryProductProvidedInput(
      providedInputs,
      "factoryProduct"
    );
    this.forceShowParentMxArchivalBranch = !this.getProvidedInput(
      providedInputs,
      "parentMxArchivalBranch"
    );
    this.forceShowUpgradeJump = !this.getProvidedInput(
      providedInputs,
      "upgradeJump"
    );

    this.mxParametersFormControls = [
      this.conversionFactoryProductFormControl,
      this.parentMxArchivalBranchNameFormControl,
      this.upgradeJumpFormControl,
    ];

    this.forceShowMxParameters =
      this.forceShowFactoryProduct ||
      this.forceShowParentMxArchivalBranch ||
      this.forceShowUpgradeJump;
  }

  private initializeOfficialityFormControl() {
    this.officialFormControl = new FormControl(
      null,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );
  }

  private initializeNameFormControl(execution: UpgradeProcessExecution) {
    this.nameFormControl = new FormControl(`${execution.name} - Copy`, [
      Validators.required,
      WhitespaceValidators.notBlank(),
    ]);
  }

  resetForm() {
    this.isFormInitialized = false;
  }

  getRepushInputs(): RepushUpgradeProcessDefinitionInputs {
    return this.form.value;
  }

  private getFactoryProductProvidedInput(
    providedInputs: ProvidedInput[],
    inputId: string
  ) {
    const value = this.getProvidedInput(providedInputs, inputId);

    if (value && value["id"] === undefined) {
      return undefined;
    }

    return value;
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

  protected readonly InputAccessMode = InputAccessMode;

  protected readonly DisplayMode = DisplayMode;
}
