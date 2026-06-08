import { Component, DestroyRef, inject } from "@angular/core";
import {
  DefinitionInputComponent,
  DefinitionInputGroupComponent,
  DefinitionInputsValidators,
  DisplayMode,
  InputAccessMode,
  InputValidationMode,
  ProvidedInput,
  ValidationProcessConfigurationParametersComponent,
  ValidationProcessExecution,
} from "@mxflow/features/business-process";
import { RepushValidationProcessExecutionInput } from "./repush-validation-process-execution-inputs";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { WhitespaceValidators } from "@mxflow/validator";
import {
  BusinessProcessInfraGroupSelectorComponent,
  BusinessProcessScenarioDefinitionSelectorComponent,
} from "@mxflow/ui/inputs";
import { InputText } from "primeng/inputtext";
import { MandatoryFieldModule } from "@mxflow/ui/alert";
import { RadioButton } from "primeng/radiobutton";
import { BusinessProcessNotificationsRecipientsInputComponent } from "../../../business-process-notifications-recipients-input/business-process-notifications-recipients-input.component";
import { ValidationScopeStartCommitIdInputComponent } from "../../validation-scope-start-commit-id-input/validation-scope-start-commit-id-input.component";
import { ValidationScopeStartCommitIdParentBranchResolverService } from "../../validation-process-definition-executor/inputs/validation-scope-start-commit-id-parent-branch-resolver.service";
import { ValidationScopeStartCommitIdStateResolverService } from "../../validation-process-definition-executor/inputs/validation-scope-start-commit-id-state-resolver.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: "mxevolve-repush-validation-process-execution-inputs",
  templateUrl: "./repush-validation-process-execution-inputs.component.html",
  providers: [
    ValidationScopeStartCommitIdParentBranchResolverService,
    ValidationScopeStartCommitIdStateResolverService,
  ],
  imports: [
    BusinessProcessInfraGroupSelectorComponent,
    BusinessProcessScenarioDefinitionSelectorComponent,
    DefinitionInputComponent,
    DefinitionInputGroupComponent,
    InputText,
    MandatoryFieldModule,
    RadioButton,
    ReactiveFormsModule,
    ValidationProcessConfigurationParametersComponent,
    BusinessProcessNotificationsRecipientsInputComponent,
    ValidationScopeStartCommitIdInputComponent,
  ],
})
export class RepushValidationProcessExecutionInputsComponent {
  private readonly validationScopeStartCommitIdVisibilityResolver = inject(
    ValidationScopeStartCommitIdStateResolverService
  );
  private readonly destroyRef = inject(DestroyRef);

  isFormInitialized: boolean;
  projectId: string;
  providedInputs: ProvidedInput[];
  execution: ValidationProcessExecution;
  form: FormGroup<RepushValidationProcessExecutionInputControls>;

  prefilledConfigurationParametersToShow: string[] = [];
  configurationParametersFormControls: FormControl[];
  testFormControls: FormControl[];
  infraFormControls: FormControl[];

  nameFormControl: FormControl;
  officialFormControl: FormControl;
  notificationsRecipientsFormControl: FormControl;
  repositoryFormControl: FormControl;
  createBranchFormControl: FormControl;
  archivalBranchNameFormControl: FormControl;
  parentBranchFormControl: FormControl;
  businessProcessQualityLevelFormControl: FormControl;
  finalProductIdFormControl: FormControl;
  qualityGateExecutionInfraGroupIdFormControl: FormControl;
  configCommitIdFormControl: FormControl;
  rtpCommitIdFormControl: FormControl;
  qualityGateScenarioDefinitionIdsFormControl: FormControl;
  nightlyRepusherEnabledFormControl: FormControl;

  forceShowQualityGateExecutionInfraGroupIdInput = false;
  forceShowQualityGateScenarioDefinitionIdsFormControl = false;
  forceShowNightlyRepusherEnabledInput = false;
  forceShowNotificationsRecipients = false;

  validationScopeStartCommitIdFormControl: FormControl;

  forceShowConfigurationParametersGroup = false;
  forceShowInfraParametersGroup = false;
  forceShowTestParametersGroup = false;
  showValidationScopeParametersSection = false;
  resolvedParentBranch: string | null = null;

  initializeForm(
    projectId: string,
    providedInputs: ProvidedInput[],
    execution: ValidationProcessExecution
  ): void {
    this.prefilledConfigurationParametersToShow = [];
    this.projectId = projectId;
    this.providedInputs = providedInputs;
    this.execution = execution;

    this.initializeNameFormControl(execution);
    this.initializeOfficialFormControl();
    this.initializeNotificationsRecipientsFormControl(execution);
    this.initializeConfigurationParameters();
    this.initializeTestsParameters();
    this.initializeInfraParameters();
    this.initializeValidationScopeParameters(execution);

    this.form = new FormGroup({
      name: this.nameFormControl,
      official: this.officialFormControl,
      notificationsRecipients: this.notificationsRecipientsFormControl,
      repositoryId: this.repositoryFormControl,
      createBranch: this.createBranchFormControl,
      archivalBranchName: this.archivalBranchNameFormControl,
      parentBranchName: this.parentBranchFormControl,
      qualityGateScenarioDefinitionIds:
        this.qualityGateScenarioDefinitionIdsFormControl,
      businessProcessQualityLevel: this.businessProcessQualityLevelFormControl,
      finalProductId: this.finalProductIdFormControl,
      qualityGateInfraGroupId: this.qualityGateExecutionInfraGroupIdFormControl,
      configCommitId: this.configCommitIdFormControl,
      rtpCommitId: this.rtpCommitIdFormControl,
      nightlyRepusherEnabled: this.nightlyRepusherEnabledFormControl,
      validationScopeStartCommitId:
        this.validationScopeStartCommitIdFormControl,
    });

    this.isFormInitialized = true;

    this.validationScopeStartCommitIdVisibilityResolver
      .resolve(
        {
          official: this.officialFormControl,
          businessProcessQualityLevel:
            this.businessProcessQualityLevelFormControl,
          createBranch: this.createBranchFormControl,
          parentBranch: this.parentBranchFormControl,
          archivalBranchName: this.archivalBranchNameFormControl,
          repositoryId: this.repositoryFormControl,
        },
        projectId
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ visible, resolvedParentBranch }) => {
        this.showValidationScopeParametersSection = visible;
        this.resolvedParentBranch = resolvedParentBranch;
        this.updateCommitIdValidators(visible);
      });
  }

  private updateCommitIdValidators(visible: boolean) {
    if (visible) {
      this.validationScopeStartCommitIdFormControl.setValidators([
        Validators.required,
      ]);
    } else {
      this.validationScopeStartCommitIdFormControl.clearValidators();
      this.validationScopeStartCommitIdFormControl.reset(null, {
        emitEvent: false,
      });
    }
    this.validationScopeStartCommitIdFormControl.updateValueAndValidity({
      emitEvent: false,
    });
  }

  private initializeValidationScopeParameters(
    execution: ValidationProcessExecution
  ) {
    this.validationScopeStartCommitIdFormControl = new FormControl(
      execution.input.validationScopeStartCommitId ?? null
    );
  }

  private initializeNameFormControl(execution: ValidationProcessExecution) {
    this.nameFormControl = new FormControl(execution.name + " - Copy", [
      Validators.required,
      WhitespaceValidators.notBlank(),
    ]);
  }

  private initializeOfficialFormControl() {
    this.officialFormControl = new FormControl(
      null,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );
  }

  private initializeNotificationsRecipientsFormControl(
    execution: ValidationProcessExecution
  ) {
    this.notificationsRecipientsFormControl = new FormControl(
      this.getProvidedInputFromDefinition("notificationsRecipients") ||
        execution.notificationsRecipients
    );

    this.forceShowNotificationsRecipients =
      !this.getProvidedInputFromDefinition("notificationsRecipients");
  }

  private initializeInfraParameters() {
    this.qualityGateExecutionInfraGroupIdFormControl = new FormControl(
      this.getProvidedInputFromDefinition("qualityGateExecutionInfraGroupId") ||
        this.execution.input.qualityGateExecutionInfraGroupId,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.forceShowQualityGateExecutionInfraGroupIdInput =
      !this.getProvidedInputFromDefinition("qualityGateExecutionInfraGroupId");

    this.infraFormControls = [this.qualityGateExecutionInfraGroupIdFormControl];

    this.forceShowInfraParametersGroup =
      this.forceShowQualityGateExecutionInfraGroupIdInput;
  }

  private initializeTestsParameters() {
    this.qualityGateScenarioDefinitionIdsFormControl = new FormControl(
      this.getProvidedInputFromDefinition("testScenarioIds") ||
        this.execution.input.scenarioDefinitionIds,
      DefinitionInputsValidators.standardMultiSelectInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.forceShowQualityGateScenarioDefinitionIdsFormControl =
      !this.getProvidedInputFromDefinition("testScenarioIds");

    this.nightlyRepusherEnabledFormControl = new FormControl(
      this.mapControlValueToBoolean(
        this.getProvidedInputFromDefinition("nightlyRepusherEnabled") ??
          this.execution.input.nightlyRepusherEnabled
      ),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    if (
      this.getProvidedInputFromDefinition("nightlyRepusherEnabled") ===
      undefined
    ) {
      this.forceShowNightlyRepusherEnabledInput = true;
    }

    this.testFormControls = [
      this.qualityGateScenarioDefinitionIdsFormControl,
      this.nightlyRepusherEnabledFormControl,
    ];

    this.forceShowTestParametersGroup = [
      this.forceShowQualityGateScenarioDefinitionIdsFormControl,
      this.forceShowNightlyRepusherEnabledInput,
    ].some((isShow) => isShow);
  }

  private initializeConfigurationParameters() {
    this.repositoryFormControl = new FormControl(
      this.getProvidedInputFromDefinition("repositoryId") ||
        this.execution.input.repositoryId,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.shouldShowPrefilledConfigurationParameter("repositoryId");

    this.createBranchFormControl = new FormControl(
      this.mapControlValueToBoolean(
        this.getProvidedInputFromDefinition("createBranch") ??
          this.execution.input.createBranch
      ),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    if (this.getProvidedInputFromDefinition("createBranch") === undefined) {
      this.prefilledConfigurationParametersToShow.push("createBranch");
    }

    this.archivalBranchNameFormControl = new FormControl(
      this.getProvidedInputFromDefinition("archivalBranchName") ||
        this.execution.input.archivalBranchName,
      Validators.required
    );

    this.shouldShowPrefilledConfigurationParameter("archivalBranchName");

    this.businessProcessQualityLevelFormControl = new FormControl(
      this.getProvidedInputFromDefinition("businessProcessQualityLevel") ||
        this.execution.input.businessProcessQualityLevel,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.shouldShowPrefilledConfigurationParameter(
      "businessProcessQualityLevel"
    );

    if (this.shouldAssesIfTheParentBranchIsNeeded()) {
      this.parentBranchFormControl = new FormControl(
        this.getProvidedInputFromDefinition("parentBranch") ||
          this.execution.input.parentBranch
      );
    } else {
      this.parentBranchFormControl = new FormControl(undefined);
    }

    this.shouldShowPrefilledParentBranch();

    this.finalProductIdFormControl = new FormControl(
      this.getProvidedInputFromDefinition("finalProductId") ||
        this.execution.input.finalProductId,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );
    this.shouldShowPrefilledConfigurationParameter("finalProductId");

    this.configCommitIdFormControl = new FormControl(
      this.getProvidedInputFromDefinition("configCommitId") ||
        this.execution.input.configCommitId,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.shouldShowPrefilledConfigurationParameter("configCommitId");

    this.rtpCommitIdFormControl = new FormControl(
      this.getProvidedInputFromDefinition("rtpCommitId") ||
        this.execution.input.rtpCommitId,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.shouldShowPrefilledConfigurationParameter("rtpCommitId");

    this.configurationParametersFormControls = [
      this.repositoryFormControl,
      this.createBranchFormControl,
      this.archivalBranchNameFormControl,
      this.parentBranchFormControl,
      this.businessProcessQualityLevelFormControl,
      this.finalProductIdFormControl,
      this.configCommitIdFormControl,
      this.rtpCommitIdFormControl,
    ];

    this.forceShowConfigurationParametersGroup = [
      this.prefilledConfigurationParametersToShow.includes("repositoryId"),
      this.prefilledConfigurationParametersToShow.includes("createBranch"),
      this.prefilledConfigurationParametersToShow.includes(
        "archivalBranchName"
      ),
      this.prefilledConfigurationParametersToShow.includes(
        "businessProcessQualityLevel"
      ),
      this.prefilledConfigurationParametersToShow.includes("finalProductId"),
      this.prefilledConfigurationParametersToShow.includes("configCommitId"),
      this.prefilledConfigurationParametersToShow.includes("rtpCommitId"),
      this.prefilledConfigurationParametersToShow.includes("parentBranch"),
    ].some((isShow) => isShow);

    this.forceShowInfraParametersGroup =
      this.forceShowQualityGateExecutionInfraGroupIdInput;
  }

  private shouldShowPrefilledParentBranch() {
    if (this.shouldAssesIfTheParentBranchIsNeeded()) {
      this.shouldShowPrefilledConfigurationParameter("parentBranch");
    }
  }

  private shouldAssesIfTheParentBranchIsNeeded() {
    return (
      this.businessProcessQualityLevelFormControl.value === "MQG" &&
      this.mapControlValueToBoolean(this.createBranchFormControl.value)
    );
  }

  private shouldShowPrefilledConfigurationParameter(key: string) {
    if (!this.getProvidedInputFromDefinition(key)) {
      this.prefilledConfigurationParametersToShow.push(key);
    }
  }

  private getProvidedInputFromDefinition(inputId: string) {
    return this.providedInputs.find(
      (providedInput) => providedInput.inputId == inputId
    )?.value;
  }

  resetForm() {
    this.isFormInitialized = false;
  }

  getRepushInputs(): RepushValidationProcessExecutionInput {
    return {
      name: this.form.getRawValue().name,
      official: this.form.getRawValue().official,
      notificationsRecipients: this.form.getRawValue().notificationsRecipients,
      businessProcessQualityLevel:
        this.form.getRawValue().businessProcessQualityLevel,
      repositoryId: this.form.getRawValue().repositoryId,
      createBranch: this.form.getRawValue().createBranch,
      archivalBranchName: this.form.getRawValue().archivalBranchName,
      parentBranchName: this.form.getRawValue().parentBranchName,
      configCommitId: this.form.getRawValue().configCommitId,
      rtpCommitId: this.form.getRawValue().rtpCommitId,
      finalProductId: this.form.getRawValue().finalProductId,
      qualityGateScenarioDefinitionIds:
        this.form.getRawValue().qualityGateScenarioDefinitionIds,
      nightlyRepusherEnabled: this.form.getRawValue().nightlyRepusherEnabled,
      qualityGateInfraGroupId: this.form.getRawValue().qualityGateInfraGroupId,
      validationScopeStartCommitId:
        this.form.getRawValue().validationScopeStartCommitId,
    };
  }

  private mapControlValueToBoolean(booleanValue: string | boolean) {
    if (booleanValue === true || booleanValue === "true") {
      return true;
    }

    if (booleanValue === false || booleanValue === "false") {
      return false;
    }

    return undefined;
  }

  protected readonly DisplayMode = DisplayMode;
  protected readonly InputAccessMode = InputAccessMode;
}

interface RepushValidationProcessExecutionInputControls {
  name: FormControl<string>;
  official: FormControl<boolean>;
  notificationsRecipients: FormControl<string[]>;
  qualityGateInfraGroupId: FormControl<string>;
  qualityGateScenarioDefinitionIds: FormControl<string[]>;
  nightlyRepusherEnabled: FormControl<boolean>;
  repositoryId: FormControl<string>;
  createBranch: FormControl<boolean>;
  archivalBranchName: FormControl<string>;
  parentBranchName: FormControl<string>;
  businessProcessQualityLevel: FormControl<string>;
  finalProductId: FormControl<string>;
  configCommitId: FormControl<string>;
  rtpCommitId: FormControl<string>;
  validationScopeStartCommitId: FormControl<string>;
}
