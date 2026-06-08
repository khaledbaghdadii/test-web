import { Component, inject, DestroyRef } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ExecuteValidationProcessInput } from "./execute-validation-process-input";
import {
  BusinessProcessInfraGroupSelectorComponent,
  BusinessProcessScenarioDefinitionSelectorComponent,
} from "@mxflow/ui/inputs";
import { RadioButton } from "primeng/radiobutton";
import { MandatoryFieldModule } from "@mxflow/ui/alert";
import { InputText } from "primeng/inputtext";
import { WhitespaceValidators } from "@mxflow/validator";
import { DefinitionInputComponent } from "../../../definition-input/definition-input.component";
import { DefinitionInputGroupComponent } from "../../../definition-input-group/definition-input-group.component";
import { DefinitionInputsValidators } from "../../../definition-input/validators/definition-inputs-validators";
import { DisplayMode } from "../../../definition-input/display-mode";
import { InputAccessMode } from "../../../definition-input/input-access-mode";
import { InputValidationMode } from "../../../definition-input/input-validation-mode";
import { ProvidedInput } from "../../../business-process-definition/business-process-definition";
import { ValidationProcessConfigurationParametersComponent } from "../../validation-process-configuration-parameters/validation-process-configuration-parameters.component";
import { BusinessProcessNotificationsRecipientsInputComponent } from "../../../business-process-notifications-recipients-input/business-process-notifications-recipients-input.component";
import { ValidationScopeStartCommitIdInputComponent } from "../../validation-scope-start-commit-id-input/validation-scope-start-commit-id-input.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ValidationScopeStartCommitIdParentBranchResolverService } from "./validation-scope-start-commit-id-parent-branch-resolver.service";
import { ValidationScopeStartCommitIdStateResolverService } from "./validation-scope-start-commit-id-state-resolver.service";

@Component({
  selector: "mxevolve-execute-validation-process-definition-inputs",
  imports: [
    ReactiveFormsModule,
    BusinessProcessInfraGroupSelectorComponent,
    BusinessProcessScenarioDefinitionSelectorComponent,
    DefinitionInputGroupComponent,
    RadioButton,
    MandatoryFieldModule,
    InputText,
    ValidationProcessConfigurationParametersComponent,
    DefinitionInputComponent,
    BusinessProcessNotificationsRecipientsInputComponent,
    ValidationScopeStartCommitIdInputComponent,
  ],
  templateUrl: "./execute-validation-process-input.component.html",
  providers: [
    ValidationScopeStartCommitIdParentBranchResolverService,
    ValidationScopeStartCommitIdStateResolverService,
  ],
})
export class ExecuteValidationProcessInputComponent {
  protected readonly InputAccessMode = InputAccessMode;
  protected readonly DisplayMode = DisplayMode;
  private readonly validationScopeStartCommitIdVisibilityResolver = inject(
    ValidationScopeStartCommitIdStateResolverService
  );
  private readonly destroyRef = inject(DestroyRef);

  form: FormGroup<ExecuteValidationProcessDefinitionInputControls>;
  projectId: string;
  isFormInitialized = false;

  showValidationScopeParameters = false;
  resolvedParentBranch: string | null = null;

  nameFormControl: FormControl;
  officialFormControl: FormControl;
  notificationsRecipientsFormControl: FormControl;
  testScenarioIdsFormControl: FormControl;
  nightlyRepusherEnabledFormControl: FormControl;
  qualityGateExecutionInfraGroupFormControl: FormControl;
  repositoryIdFormControl: FormControl;
  businessProcessQualityLevelFormControl: FormControl;
  createBranchFormControl: FormControl;
  archivalBranchNameFormControl: FormControl;
  parentBranchFormControl: FormControl;
  finalProductIdFromControl: FormControl;
  rtpCommitIdFormControl: FormControl;
  configCommitIdFormControl: FormControl;
  validationScopeStartCommitIdFormControl: FormControl;

  configurationParametersFormControls: FormControl[] = [];
  testFormControls: FormControl[] = [];
  infraFormControls: FormControl[] = [];

  initializeForm(projectId: string, providedInputs: ProvidedInput[]) {
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

    this.notificationsRecipientsFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "notificationsRecipients")
    );

    this.testScenarioIdsFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "testScenarioIds"),
      DefinitionInputsValidators.standardMultiSelectInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.nightlyRepusherEnabledFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "nightlyRepusherEnabled"),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.qualityGateExecutionInfraGroupFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "qualityGateExecutionInfraGroupId"),
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

    this.archivalBranchNameFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "archivalBranchName"),
      Validators.required
    );

    this.parentBranchFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "parentBranch")
    );

    this.finalProductIdFromControl = new FormControl(
      this.getProvidedInput(providedInputs, "finalProductId"),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.rtpCommitIdFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "rtpCommitId"),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.configCommitIdFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "configCommitId"),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.validationScopeStartCommitIdFormControl = new FormControl(null);

    this.configurationParametersFormControls = [
      this.repositoryIdFormControl,
      this.archivalBranchNameFormControl,
      this.parentBranchFormControl,
      this.finalProductIdFromControl,
      this.businessProcessQualityLevelFormControl,
      this.createBranchFormControl,
      this.rtpCommitIdFormControl,
      this.configCommitIdFormControl,
    ];
    this.testFormControls = [
      this.testScenarioIdsFormControl,
      this.nightlyRepusherEnabledFormControl,
    ];
    this.infraFormControls = [this.qualityGateExecutionInfraGroupFormControl];

    this.form = new FormGroup<ExecuteValidationProcessDefinitionInputControls>({
      name: this.nameFormControl,
      official: this.officialFormControl,
      notificationsRecipients: this.notificationsRecipientsFormControl,
      qualityGateInfraGroupId: this.qualityGateExecutionInfraGroupFormControl,
      qualityGateScenarioDefinitionIds: this.testScenarioIdsFormControl,
      nightlyRepusherEnabled: this.nightlyRepusherEnabledFormControl,
      repositoryId: this.repositoryIdFormControl,
      createBranch: this.createBranchFormControl,
      archivalBranchName: this.archivalBranchNameFormControl,
      parentBranchName: this.parentBranchFormControl,
      businessProcessQualityLevel: this.businessProcessQualityLevelFormControl,
      finalProductId: this.finalProductIdFromControl,
      configCommitId: this.configCommitIdFormControl,
      rtpCommitId: this.rtpCommitIdFormControl,
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
          repositoryId: this.repositoryIdFormControl,
        },
        projectId
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ visible, resolvedParentBranch }) => {
        this.showValidationScopeParameters = visible;
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

  resetForm() {
    this.form.reset();
    this.isFormInitialized = false;
  }

  getExecuteValidationProcessDefinitionInputs(): ExecuteValidationProcessInput {
    return {
      name: this.form.getRawValue().name,
      official: this.form.getRawValue().official,
      notificationsRecipients: this.form.getRawValue().notificationsRecipients,
      qualityGateInfraGroupId: this.form.getRawValue().qualityGateInfraGroupId,
      qualityGateScenarioDefinitionIds:
        this.form.getRawValue().qualityGateScenarioDefinitionIds,
      nightlyRepusherEnabled: this.form.getRawValue().nightlyRepusherEnabled,
      repositoryId: this.form.getRawValue().repositoryId,
      createBranch: this.form.getRawValue().createBranch,
      archivalBranchName: this.form.getRawValue().archivalBranchName,
      parentBranchName: this.form.getRawValue().parentBranchName,
      businessProcessQualityLevel:
        this.form.getRawValue().businessProcessQualityLevel,
      finalProductId: this.form.getRawValue().finalProductId,
      configCommitId: this.form.getRawValue().configCommitId,
      rtpCommitId: this.form.getRawValue().rtpCommitId,
      validationScopeStartCommitId:
        this.form.getRawValue().validationScopeStartCommitId,
    };
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

interface ExecuteValidationProcessDefinitionInputControls {
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
