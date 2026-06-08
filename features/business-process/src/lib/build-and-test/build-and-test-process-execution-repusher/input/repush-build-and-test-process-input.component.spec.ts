import { v4 as uuid } from "uuid";
import { RepushBuildAndTestProcessInputComponent } from "./repush-build-and-test-process-input.component";
import { TestBed } from "@angular/core/testing";
import { BuildAndTestProcessExecution } from "../../build-and-test-process-execution";
import {
  DefinitionInputsValidators,
  InputValidationMode,
} from "@mxflow/features/business-process";
import { Validators } from "@angular/forms";
import { WhitespaceValidators } from "@mxflow/validator";

describe("Repush build and test process input component test", () => {
  const projectId = "projectId";

  let component: RepushBuildAndTestProcessInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepushBuildAndTestProcessInputComponent],
    }).compileComponents();

    component = TestBed.createComponent(
      RepushBuildAndTestProcessInputComponent
    ).componentInstance;
  });

  describe("When user opens the repush form", () => {
    it("should set the project id", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );
      expect(component.projectId).toStrictEqual(projectId);
    });

    it("when the modal is rendered, then the system should declare that the form is initialized", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );
      expect(component.isFormInitialized).toBeTruthy();
    });

    it("the system should prefill the name input with the execution name following by ` - Copy`", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );
      expect(component.form.controls.name.value).toEqual("processName - Copy");
    });

    it("the system should validate the name input with required and whitespace validators", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );

      expect(
        component.nameFormControl.hasValidator(Validators.required)
      ).toBeTruthy();
      expect(
        component.nameFormControl.hasValidator(WhitespaceValidators.notBlank())
      ).toBeTruthy();
    });

    it("given that repository input is not provided by the process definition, then the system should prefill the input from the previous execution and render it in the modal", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );

      expect(component.form.controls.repositoryId.value).toEqual(
        "repositoryId"
      );
      expect(component.forceShowRepositoryInput).toBeTruthy();
    });

    it("given that repository input is provided by the process definition, then the system should prefill the input from the process definition and not render it in the modal", () => {
      component.initializeForm(
        projectId,
        [{ inputId: "repositoryId", value: "prefilledRepositoryId" }],
        getBuildAndTestProcessExecution()
      );

      expect(component.form.controls.repositoryId.value).toEqual(
        "prefilledRepositoryId"
      );
      expect(component.forceShowRepositoryInput).toBeFalsy();
    });

    it("the system should validate the repository id input with standard selectable validators", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );

      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.repositoryId.hasValidator(validator)
        ).toBeTruthy();
      });
    });

    it("given that configuration branch name input is not provided by the process definition, then the system should prefill the input from the previous execution and render it in the modal", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );

      expect(component.form.controls.configurationBranchName.value).toEqual(
        "configurationBranchName"
      );
      expect(component.forceShowConfigurationBranchNameInput).toBeTruthy();
    });

    it("given that configuration branch name input is provided by the process definition, then the system should prefill the input from the process definition and not render it in the modal", () => {
      component.initializeForm(
        projectId,
        [
          {
            inputId: "configurationBranchName",
            value: "prefilledConfigurationBranchName",
          },
        ],
        getBuildAndTestProcessExecution()
      );

      expect(component.form.controls.configurationBranchName.value).toEqual(
        "prefilledConfigurationBranchName"
      );
      expect(component.forceShowConfigurationBranchNameInput).toBeFalsy();
    });

    it("the system should validate the configuration branch name input with standard branch validators", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );

      const expectedValidators =
        DefinitionInputsValidators.standardBranchInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.configurationBranchName.hasValidator(
            validator
          )
        ).toBeTruthy();
      });
    });

    it("given that configuration parent branch input is not provided by the process definition, then the system should prefill the input from the previous execution and render it in the modal", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );

      expect(component.form.controls.configurationParentBranch.value).toEqual(
        "configurationParentBranch"
      );
      expect(component.forceShowConfigurationParentBranchInput).toBeTruthy();
    });

    it("given that configuration parent branch input is provided by the process definition, then the system should prefill the input from the process definition and not render it in the modal", () => {
      component.initializeForm(
        projectId,
        [
          {
            inputId: "configurationParentBranch",
            value: "prefilledConfigurationParentBranch",
          },
        ],
        getBuildAndTestProcessExecution()
      );

      expect(component.form.controls.configurationParentBranch.value).toEqual(
        "prefilledConfigurationParentBranch"
      );
      expect(component.forceShowConfigurationParentBranchInput).toBeFalsy();
    });

    it("the system should validate the configuration parent branch input with standard branch validators", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );
      const expectedValidators =
        DefinitionInputsValidators.standardBranchInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );

      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.configurationParentBranch.hasValidator(
            validator
          )
        ).toBeTruthy();
      });
    });

    it("given that build scenario definition input is not provided by the process definition, then the system should prefill the build scenario definition from the previous execution", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );

      expect(component.form.controls.buildScenarioDefinitionId.value).toEqual(
        "scenarioDefinitionId"
      );
    });

    it("given that build scenario definition is provided by the process definition, then the system should prefill the input from the process definition and not render it in the modal", () => {
      component.initializeForm(
        projectId,
        [
          {
            inputId: "buildScenarioDefinitionId",
            value: "prefilledScenarioDefinitionId",
          },
        ],
        getBuildAndTestProcessExecution()
      );

      expect(component.form.controls.buildScenarioDefinitionId.value).toEqual(
        "prefilledScenarioDefinitionId"
      );
    });

    it("given the user skipped the environment deployment in the previous execution when he is repushing that execution the system should not validate the scenario definition id as it is not required", () => {
      const previousExecution = getBuildAndTestProcessExecution();
      previousExecution.input.buildEnvironment.skipEnvironmentDeployment = true;

      component.initializeForm(projectId, [], previousExecution);
      const selectableInputValidator =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );

      selectableInputValidator.forEach((validator) => {
        expect(
          component.form.controls.buildScenarioDefinitionId.hasValidator(
            validator
          )
        ).toBeFalsy();
      });
    });

    it("given the user did not skip the environment deployment in the previous execution when he is repushing that execution the system should validate the scenario definition id as it is required", () => {
      const previousExecution = getBuildAndTestProcessExecution();
      previousExecution.input.buildEnvironment.skipEnvironmentDeployment =
        false;

      component.initializeForm(projectId, [], previousExecution);
      const selectableInputValidator =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      selectableInputValidator.forEach((validator) => {
        expect(
          component.form.controls.buildScenarioDefinitionId.hasValidator(
            validator
          )
        ).toBeTruthy();
      });
    });

    it("should stop validating scenario definition if skip environment deployment is true", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );
      component.form.controls.skipEnvironmentDeployment.setValue(true);

      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.buildScenarioDefinitionId.hasValidator(
            validator
          )
        ).toBeFalsy();
      });
    });

    it("should resume validating scenario definition if skip environment deployment is false", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );
      component.form.controls.skipEnvironmentDeployment.setValue(true);
      component.form.controls.skipEnvironmentDeployment.setValue(false);

      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.buildScenarioDefinitionId.hasValidator(
            validator
          )
        ).toBeTruthy();
      });
    });

    it("the system should validate that the user stories input is required", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );
      expect(
        component.form.controls.userStoryIds.hasValidator(Validators.required)
      ).toBeTruthy();
    });

    it("the system should prefill the user story IDs from the previous execution", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );
      expect(component.form.controls.userStoryIds.value).toEqual([
        "userStoryId1",
        "userStoryId2",
      ]);
    });

    it("given the user skipped build environment in the parent execution, then the system should enable skipping the build environment deployment in the repush form", () => {
      const buildAndTestProcessExecution = getBuildAndTestProcessExecution();
      buildAndTestProcessExecution.input.buildEnvironment.skipEnvironmentDeployment =
        true;
      component.initializeForm(projectId, [], buildAndTestProcessExecution);
      expect(component.skipEnvironmentDeploymentFormControl.value).toBeTruthy();
    });

    it("given that build environment infra group input is not provided by the process definition, then the system should prefill the input from the previous execution and render it in the modal", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );

      expect(component.form.controls.buildEnvironmentInfraGroup.value).toEqual(
        "buildEnvironmentInfraGroup"
      );
      expect(component.forceShowBuildEnvironmentInfraGroupInput).toBeTruthy();
    });

    it("given that build environment infra group input is provided by the process definition, then the system should prefill the input from the process definition and not render it in the modal", () => {
      component.initializeForm(
        projectId,
        [
          {
            inputId: "buildEnvironmentInfraGroup",
            value: "prefilledBuildEnvironmentInfraGroup",
          },
        ],
        getBuildAndTestProcessExecution()
      );

      expect(component.form.controls.buildEnvironmentInfraGroup.value).toEqual(
        "prefilledBuildEnvironmentInfraGroup"
      );
      expect(component.forceShowBuildEnvironmentInfraGroupInput).toBeFalsy();
    });

    it("the system should validate the build environment infra group input with standard selectable validators", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );
      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );

      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.buildEnvironmentInfraGroup.hasValidator(
            validator
          )
        ).toBeTruthy();
      });
    });

    it("given that build and test infra group input is not provided by the process definition, then the system should prefill the input from the previous execution and render it in the modal", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );

      expect(component.form.controls.buildAndTestInfraGroup.value).toEqual(
        "buildAndTestInfraGroup"
      );
      expect(component.forceShowBuildAndTestInfraGroupInput).toBeTruthy();
    });

    it("given that build and test infra group input is provided by the process definition, then the system should prefill the input from the process definition and not render it in the modal", () => {
      component.initializeForm(
        projectId,
        [
          {
            inputId: "buildAndTestInfraGroup",
            value: "prefilledBuildAndTestInfraGroup",
          },
        ],
        getBuildAndTestProcessExecution()
      );

      expect(component.form.controls.buildAndTestInfraGroup.value).toEqual(
        "prefilledBuildAndTestInfraGroup"
      );
      expect(component.forceShowBuildAndTestInfraGroupInput).toBeFalsy();
    });

    it("the system should validate the build and test infra group input with standard selectable validators", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );

      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.buildAndTestInfraGroup.hasValidator(validator)
        ).toBeTruthy();
      });
    });

    it("given that all the configuration parameters are provided, then the system should not show the configuration parameters group", () => {
      component.initializeForm(
        projectId,
        [
          { inputId: "repositoryId", value: uuid() },
          { inputId: "configurationBranchName", value: uuid() },
          { inputId: "configurationParentBranch", value: uuid() },
        ],
        getBuildAndTestProcessExecution()
      );
      expect(component.forceShowConfigurationParametersGroup).toBeFalsy();
    });

    it("given that the repository id input should be shown in the modal, then the system should show the configuration parameters group", () => {
      const providedInputs = [
        "configurationBranchName",
        "configurationParentBranch",
      ];

      component.initializeForm(
        projectId,
        providedInputs.map((providedInput) => ({
          inputId: providedInput,
          value: uuid(),
        })),
        getBuildAndTestProcessExecution()
      );

      expect(component.forceShowConfigurationParametersGroup).toBeTruthy();
    });

    it("given that the configuration branch name input should be shown in the modal, then the system should show the configuration parameters group", () => {
      const providedInputs = ["repositoryId", "configurationParentBranch"];

      component.initializeForm(
        projectId,
        providedInputs.map((providedInput) => ({
          inputId: providedInput,
          value: uuid(),
        })),
        getBuildAndTestProcessExecution()
      );

      expect(component.forceShowConfigurationParametersGroup).toBeTruthy();
    });

    it("given that the configuration parent branch input should be shown in the modal, then the system should show the configuration parameters group", () => {
      const providedInputs = ["repositoryId", "configurationBranchName"];

      component.initializeForm(
        projectId,
        providedInputs.map((providedInput) => ({
          inputId: providedInput,
          value: uuid(),
        })),
        getBuildAndTestProcessExecution()
      );

      expect(component.forceShowConfigurationParametersGroup).toBeTruthy();
    });

    it("given that all the infrastructure parameters are provided, then the system should not show the infrastructure parameters group", () => {
      component.initializeForm(
        projectId,
        [
          { inputId: "buildEnvironmentInfraGroup", value: uuid() },
          { inputId: "buildAndTestInfraGroup", value: uuid() },
        ],
        getBuildAndTestProcessExecution()
      );
      expect(component.forceShowInfrastructureParametersGroup).toBeFalsy();
    });

    it("given that the build environment infra group input should be shown in the modal, then the system should show the infrastructure parameters group", () => {
      component.initializeForm(
        projectId,
        [{ inputId: "buildAndTestInfraGroup", value: uuid() }],
        getBuildAndTestProcessExecution()
      );
      expect(component.forceShowInfrastructureParametersGroup).toBeTruthy();
    });

    it("given that the build and test infra group input should be shown in the modal, then the system should show the infrastructure parameters group", () => {
      component.initializeForm(
        projectId,
        [{ inputId: "buildEnvironmentInfraGroup", value: uuid() }],
        getBuildAndTestProcessExecution()
      );
      expect(component.forceShowInfrastructureParametersGroup).toBeTruthy();
    });

    it("given that notifications recipients input is not provided by the process definition, then the system should prefill the input from the previous execution and render it in the modal", () => {
      component.initializeForm(
        projectId,
        [],
        getBuildAndTestProcessExecution()
      );

      expect(component.form.controls.notificationsRecipients.value).toEqual([
        "user1@example.com",
        "user2@example.com",
      ]);
      expect(component.forceShowNotificationsRecipients).toBeTruthy();
    });

    it("given that notifications recipients input is provided by the process definition, then the system should prefill the input from the process definition and not render it in the modal", () => {
      const notificationsRecipients = [
        "admin@example.com",
        "manager@example.com",
      ];
      component.initializeForm(
        projectId,
        [
          {
            inputId: "notificationsRecipients",
            value: notificationsRecipients,
          },
        ],
        getBuildAndTestProcessExecution()
      );

      expect(component.form.controls.notificationsRecipients.value).toEqual(
        notificationsRecipients
      );
      expect(component.forceShowNotificationsRecipients).toBeFalsy();
    });
  });

  it("given that the user filled the form, when the user decide to repush the process, then the system should use the inputs filled in the form", () => {
    component.initializeForm(projectId, [], getBuildAndTestProcessExecution());

    component.form.patchValue({
      name: "newProcessName",
      repositoryId: "newRepositoryId",
      configurationBranchName: "newConfigurationBranchName",
      configurationParentBranch: "newConfigurationParentBranch",
      skipEnvironmentDeployment: true,
      buildScenarioDefinitionId: "newScenarioDefinitionId",
      userStoryIds: ["newUserStoryId1", "newUserStoryId2"],
      buildEnvironmentInfraGroup: "newBuildEnvironmentInfraGroup",
      buildAndTestInfraGroup: "newBuildAndTestInfraGroup",
      notificationsRecipients: ["new@example.com", "test@example.com"],
    });

    expect(component.getRepushBuildAndTestProcessInput()).toEqual({
      name: "newProcessName",
      userStoryIds: ["newUserStoryId1", "newUserStoryId2"],
      repositoryId: "newRepositoryId",
      configurationBranchName: "newConfigurationBranchName",
      configurationParentBranch: "newConfigurationParentBranch",
      skipEnvironmentDeployment: true,
      buildScenarioDefinitionId: "newScenarioDefinitionId",
      buildEnvironmentInfraGroup: "newBuildEnvironmentInfraGroup",
      buildAndTestInfraGroup: "newBuildAndTestInfraGroup",
      notificationsRecipients: ["new@example.com", "test@example.com"],
    });
  });

  it("given that the user decided to cancel the repush, then the the modal inputs should be reset", () => {
    component.initializeForm(projectId, [], getBuildAndTestProcessExecution());
    component.resetForm();
    expect(component.isFormInitialized).toBeFalsy();
  });

  function getBuildAndTestProcessExecution(): BuildAndTestProcessExecution {
    return {
      id: "processId",
      name: "processName",
      notificationsRecipients: ["user1@example.com", "user2@example.com"],
      input: {
        repositoryId: "repositoryId",
        configurationBranchName: "configurationBranchName",
        configurationParentBranch: "configurationParentBranch",
        buildEnvironment: {
          skipEnvironmentDeployment: false,
          scenarioDefinitionId: "scenarioDefinitionId",
        },
        userStoryIds: ["userStoryId1", "userStoryId2"],
        buildEnvironmentInfraGroup: "buildEnvironmentInfraGroup",
        buildAndTestInfraGroup: "buildAndTestInfraGroup",
      },
    } as BuildAndTestProcessExecution;
  }
});
