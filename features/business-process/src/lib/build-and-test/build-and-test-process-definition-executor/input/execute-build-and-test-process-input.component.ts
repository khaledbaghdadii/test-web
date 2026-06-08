import { Component, OnDestroy } from "@angular/core";
import {
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
import { ExecuteBuildAndTestProcessInput } from "./execute-build-and-test-process-input";
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
import { TrackEventDirective } from "../../../analytics-tracker/track-event.directive";
import { EventAction, EventCategory } from "@mxflow/core/analytics-tracker";
@Component({
  selector: "mxevolve-execute-build-and-test-process-input",
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
    TrackEventDirective,
  ],
  templateUrl: "execute-build-and-test-process-input.component.html",
})
export class ExecuteBuildAndTestProcessInputComponent implements OnDestroy {
  protected readonly InputAccessMode = InputAccessMode;
  protected readonly DisplayMode = DisplayMode;
  protected readonly EventCategory = EventCategory;
  protected readonly EventAction = EventAction;

  form: FormGroup<ExecuteBuildAndTestProcessInputControls>;
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

  initialBuildScenarioDefinitionId = null;

  private readonly destroy$ = new Subject();

  initializeForm(projectId: string, providedInputs: ProvidedInput[]) {
    this.projectId = projectId;

    this.nameFormControl = new FormControl(null, [
      Validators.required,
      WhitespaceValidators.notBlank(),
    ]);

    this.repositoryFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "repositoryId"),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.configurationBranchNameFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "configurationBranchName"),
      DefinitionInputsValidators.standardBranchInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );
    this.configurationParentBranchFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "configurationParentBranch"),
      DefinitionInputsValidators.standardBranchInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.initialBuildScenarioDefinitionId = this.getProvidedInput(
      providedInputs,
      "buildScenarioDefinitionId"
    );

    this.buildScenarioDefinitionFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "buildScenarioDefinitionId"),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.skipEnvironmentDeploymentFormControl = new FormControl(false);

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

    this.userStoryIdsFormControl = new FormControl(null, [
      Validators.required,
      Validators.minLength(1),
    ]);

    this.buildAndTestInfraGroupFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "buildAndTestInfraGroup"),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );
    this.buildEnvironmentInfraGroupFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "buildEnvironmentInfraGroup"),
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );

    this.notificationsRecipientsFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "notificationsRecipients")
    );

    this.configurationParametersFormControls = [
      this.repositoryFormControl,
      this.configurationBranchNameFormControl,
      this.configurationParentBranchFormControl,
    ];
    this.buildEnvironmentFormControls = [
      this.buildScenarioDefinitionFormControl,
      this.skipEnvironmentDeploymentFormControl,
    ];
    this.userStoriesFormControls = [this.userStoryIdsFormControl];
    this.infrastructureParametersFormControls = [
      this.buildEnvironmentInfraGroupFormControl,
      this.buildAndTestInfraGroupFormControl,
    ];

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

  getExecuteBuildAndTestProcessInput(): ExecuteBuildAndTestProcessInput {
    return {
      name: this.nameFormControl.value,
      repositoryId: this.repositoryFormControl.value,
      configurationBranchName: this.configurationBranchNameFormControl.value,
      configurationParentBranch:
        this.configurationParentBranchFormControl.value,
      skipPrepareBuildEnvironment:
        this.skipEnvironmentDeploymentFormControl.value,
      buildScenarioDefinitionId: this.buildScenarioDefinitionFormControl.value,
      userStoryIds: this.userStoryIdsFormControl.value,
      buildEnvironmentInfraGroup:
        this.buildEnvironmentInfraGroupFormControl.value,
      buildAndTestInfraGroup: this.buildAndTestInfraGroupFormControl.value,
      notificationsRecipients: this.notificationsRecipientsFormControl.value,
    } as ExecuteBuildAndTestProcessInput;
  }

  private getProvidedInput(providedInputs: ProvidedInput[], inputId: string) {
    return providedInputs.find(
      (providedInput) => providedInput.inputId == inputId
    )?.value;
  }
}

interface ExecuteBuildAndTestProcessInputControls {
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
