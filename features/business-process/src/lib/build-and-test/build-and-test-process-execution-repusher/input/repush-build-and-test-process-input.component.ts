import { Component, OnDestroy } from "@angular/core";
import {
  BuildAndTestProcessExecution,
  DefinitionInputComponent,
  DefinitionInputGroupComponent,
  DefinitionInputsValidators,
  DisplayMode,
  InputAccessMode,
  InputValidationMode,
  ProvidedInput,
} from "@mxflow/features/business-process";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { RepushBuildAndTestProcessInput } from "./repush-build-and-test-process-input";
import { WhitespaceValidators } from "@mxflow/validator";
import {
  BusinessProcessInfraGroupSelectorComponent,
  BusinessProcessScenarioDefinitionSelectorComponent,
  SkipBuildScenarioRadialInputComponent,
  UserStoryInputComponent,
} from "@mxflow/ui/inputs";
import { InputText } from "primeng/inputtext";
import { MandatoryFieldModule } from "@mxflow/ui/alert";
import { BuildAndTestConfigurationParamsInputsComponent } from "../../build-and-test-configuration-params-inputs/build-and-test-configuration-params-inputs.component";
import { BusinessProcessNotificationsRecipientsInputComponent } from "../../../business-process-notifications-recipients-input/business-process-notifications-recipients-input.component";
import { Subject, takeUntil } from "rxjs";

@Component({
  selector: "mxevolve-repush-build-and-test-process-input",
  imports: [
    BusinessProcessInfraGroupSelectorComponent,
    DefinitionInputComponent,
    DefinitionInputGroupComponent,
    FormsModule,
    InputText,
    ReactiveFormsModule,
    MandatoryFieldModule,
    BuildAndTestConfigurationParamsInputsComponent,
    BusinessProcessNotificationsRecipientsInputComponent,
    SkipBuildScenarioRadialInputComponent,
    BusinessProcessScenarioDefinitionSelectorComponent,
    UserStoryInputComponent,
  ],
  templateUrl: "repush-build-and-test-process-input.component.html",
})
export class RepushBuildAndTestProcessInputComponent implements OnDestroy {
  protected readonly InputAccessMode = InputAccessMode;
  protected readonly DisplayMode = DisplayMode;

  form: FormGroup<RepushBuildAndTestProcessInputControls>;
  projectId: string;
  isFormInitialized = false;

  configurationParametersFormControls: FormControl[] = [];
  buildEnvironmentFormControls: FormControl[] = [];
  userStoriesFormControls: FormControl[] = [];
  infrastructureParametersFormControls: FormControl[] = [];

  nameFormControl: FormControl;
  repositoryFormControl: FormControl;
  configurationParentBranchFormControl: FormControl;
  configurationBranchNameFormControl: FormControl;
  buildScenarioDefinitionFormControl: FormControl;
  skipEnvironmentDeploymentFormControl: FormControl;
  userStoryIdsFormControl: FormControl;
  buildEnvironmentInfraGroupFormControl: FormControl;
  buildAndTestInfraGroupFormControl: FormControl;
  notificationsRecipientsFormControl: FormControl;

  forceShowRepositoryInput = false;
  forceShowConfigurationBranchNameInput = false;
  forceShowConfigurationParentBranchInput = false;
  forceShowBuildEnvironmentInfraGroupInput = false;
  forceShowBuildAndTestInfraGroupInput = false;
  forceShowConfigurationParametersGroup = false;
  forceShowInfrastructureParametersGroup = false;
  forceShowNotificationsRecipients = false;

  private readonly destroy$ = new Subject();

  initializeForm(
    projectId: string,
    providedInputs: ProvidedInput[],
    parentExecution: BuildAndTestProcessExecution
  ) {
    this.projectId = projectId;

    this.nameFormControl = new FormControl(parentExecution.name + " - Copy", [
      Validators.required,
      WhitespaceValidators.notBlank(),
    ]);

    this.initializeConfigurationParameterInputs(
      providedInputs,
      parentExecution
    );
    this.initializeBuildEnvironmentInputs(providedInputs, parentExecution);
    this.initializeUserStoryInputs(parentExecution);
    this.initializeInfrastructureParametersInputs(
      providedInputs,
      parentExecution
    );
    this.initializeNotificationsRecipients(providedInputs, parentExecution);

    this.form = new FormGroup({
      name: this.nameFormControl,
      repositoryId: this.repositoryFormControl,
      configurationBranchName: this.configurationBranchNameFormControl,
      configurationParentBranch: this.configurationParentBranchFormControl,
      skipEnvironmentDeployment: this.skipEnvironmentDeploymentFormControl,
      buildScenarioDefinitionId: this.buildScenarioDefinitionFormControl,
      userStoryIds: this.userStoryIdsFormControl,
      buildEnvironmentInfraGroup: this.buildEnvironmentInfraGroupFormControl,
      buildAndTestInfraGroup: this.buildAndTestInfraGroupFormControl,
      notificationsRecipients: this.notificationsRecipientsFormControl,
    });

    this.isFormInitialized = true;
  }

  resetForm() {
    this.form.reset();
    this.isFormInitialized = false;
  }

  ngOnDestroy() {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  getRepushBuildAndTestProcessInput(): RepushBuildAndTestProcessInput {
    return {
      name: this.nameFormControl.value,
      userStoryIds: this.userStoryIdsFormControl.value,
      repositoryId: this.repositoryFormControl.value,
      configurationBranchName: this.configurationBranchNameFormControl.value,
      configurationParentBranch:
        this.configurationParentBranchFormControl.value,
      skipEnvironmentDeployment:
        this.skipEnvironmentDeploymentFormControl.value,
      buildScenarioDefinitionId: this.buildScenarioDefinitionFormControl.value,
      buildEnvironmentInfraGroup:
        this.buildEnvironmentInfraGroupFormControl.value,
      buildAndTestInfraGroup: this.buildAndTestInfraGroupFormControl.value,
      notificationsRecipients: this.notificationsRecipientsFormControl.value,
    } as RepushBuildAndTestProcessInput;
  }

  private initializeConfigurationParameterInputs(
    providedInputs: ProvidedInput[],
    parentExecution: BuildAndTestProcessExecution
  ) {
    this.repositoryFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "repositoryId") ||
        parentExecution.input.repositoryId,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.configurationBranchNameFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "configurationBranchName") ||
        parentExecution.input.configurationBranchName,
      DefinitionInputsValidators.standardBranchInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );
    this.configurationParentBranchFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "configurationParentBranch") ||
        parentExecution.input.configurationParentBranch,
      DefinitionInputsValidators.standardBranchInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.configurationParametersFormControls = [
      this.repositoryFormControl,
      this.configurationBranchNameFormControl,
      this.configurationParentBranchFormControl,
    ];

    this.forceShowRepositoryInput = !this.getProvidedInput(
      providedInputs,
      "repositoryId"
    );
    this.forceShowConfigurationBranchNameInput = !this.getProvidedInput(
      providedInputs,
      "configurationBranchName"
    );
    this.forceShowConfigurationParentBranchInput = !this.getProvidedInput(
      providedInputs,
      "configurationParentBranch"
    );

    this.forceShowConfigurationParametersGroup =
      this.forceShowRepositoryInput ||
      this.forceShowConfigurationBranchNameInput ||
      this.forceShowConfigurationParentBranchInput;
  }

  initialBuildScenarioDefinitionId = null;

  private initializeBuildEnvironmentInputs(
    providedInputs: ProvidedInput[],
    parentExecution: BuildAndTestProcessExecution
  ) {
    this.initialBuildScenarioDefinitionId = this.getProvidedInput(
      providedInputs,
      "buildScenarioDefinitionId"
    );

    this.skipEnvironmentDeploymentFormControl = new FormControl(
      parentExecution.input.buildEnvironment.skipEnvironmentDeployment
    );

    this.skipEnvironmentDeploymentFormControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((skipEnvDeployment) => {
        if (skipEnvDeployment) {
          this.buildScenarioDefinitionFormControl.clearValidators();
        } else {
          this.buildScenarioDefinitionFormControl.addValidators(
            DefinitionInputsValidators.standardSelectableInputValidators(
              InputValidationMode.VALIDATE_ALL_FIELDS
            )
          );
        }
        this.buildScenarioDefinitionFormControl.updateValueAndValidity();
      });

    this.buildScenarioDefinitionFormControl = new FormControl(
      this.initialBuildScenarioDefinitionId ??
        parentExecution.input.buildEnvironment.scenarioDefinitionId,
      this.skipEnvironmentDeploymentFormControl?.value
        ? []
        : DefinitionInputsValidators.standardSelectableInputValidators(
            InputValidationMode.VALIDATE_ALL_FIELDS
          )
    );

    this.buildEnvironmentFormControls = [
      this.buildScenarioDefinitionFormControl,
      this.skipEnvironmentDeploymentFormControl,
    ];
  }

  private initializeUserStoryInputs(
    parentExecution: BuildAndTestProcessExecution
  ) {
    this.userStoryIdsFormControl = new FormControl(
      parentExecution.input.userStoryIds,
      [Validators.required, Validators.minLength(1)]
    );

    this.userStoriesFormControls = [this.userStoryIdsFormControl];
  }

  private initializeInfrastructureParametersInputs(
    providedInputs: ProvidedInput[],
    parentExecution: BuildAndTestProcessExecution
  ) {
    this.buildAndTestInfraGroupFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "buildAndTestInfraGroup") ||
        parentExecution.input.buildAndTestInfraGroup,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.buildEnvironmentInfraGroupFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "buildEnvironmentInfraGroup") ||
        parentExecution.input.buildEnvironmentInfraGroup,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.infrastructureParametersFormControls = [
      this.buildEnvironmentInfraGroupFormControl,
      this.buildAndTestInfraGroupFormControl,
    ];

    this.forceShowBuildEnvironmentInfraGroupInput = !this.getProvidedInput(
      providedInputs,
      "buildEnvironmentInfraGroup"
    );
    this.forceShowBuildAndTestInfraGroupInput = !this.getProvidedInput(
      providedInputs,
      "buildAndTestInfraGroup"
    );
    this.forceShowInfrastructureParametersGroup =
      this.forceShowBuildEnvironmentInfraGroupInput ||
      this.forceShowBuildAndTestInfraGroupInput;
  }

  private initializeNotificationsRecipients(
    providedInputs: ProvidedInput[],
    parentExecution: BuildAndTestProcessExecution
  ) {
    this.notificationsRecipientsFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "notificationsRecipients") ||
        parentExecution.notificationsRecipients
    );

    this.forceShowNotificationsRecipients = !this.getProvidedInput(
      providedInputs,
      "notificationsRecipients"
    );
  }

  private getProvidedInput(providedInputs: ProvidedInput[], inputId: string) {
    return providedInputs.find(
      (providedInput) => providedInput.inputId == inputId
    )?.value;
  }
}

interface RepushBuildAndTestProcessInputControls {
  name: FormControl<string>;
  repositoryId: FormControl<string>;
  configurationBranchName: FormControl<string>;
  configurationParentBranch: FormControl<string>;
  skipEnvironmentDeployment: FormControl<boolean>;
  buildScenarioDefinitionId: FormControl<string>;
  userStoryIds: FormControl<string[]>;
  buildEnvironmentInfraGroup: FormControl<string>;
  buildAndTestInfraGroup: FormControl<string>;
  notificationsRecipients: FormControl<string[]>;
}
