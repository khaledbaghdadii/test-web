import { Validators } from "@angular/forms";
import { WhitespaceValidators } from "@mxflow/validator";
import { ExecuteBuildAndTestProcessInputComponent } from "./execute-build-and-test-process-input.component";
import { v4 as uuidv4 } from "uuid";
import {
  DefinitionInputsValidators,
  InputValidationMode,
} from "@mxflow/features/business-process";
import { TestBed } from "@angular/core/testing";

describe("Execute build and test process input component", () => {
  const projectId = uuidv4();
  const name = uuidv4();
  const repositoryId = uuidv4();
  const configurationBranchName = uuidv4();
  const configurationParentBranch = uuidv4();
  const userStoryIds = [uuidv4(), uuidv4()];
  const buildEnvironmentInfraGroup = uuidv4();
  const buildAndTestInfraGroup = uuidv4();
  const skipEnvironmentDeployment = false;
  const buildScenarioDefinitionId = uuidv4();
  const notificationsRecipients = ["user1@example.com", "user2@example.com"];

  let component: ExecuteBuildAndTestProcessInputComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ExecuteBuildAndTestProcessInputComponent],
    }).compileComponents();

    component = TestBed.createComponent(
      ExecuteBuildAndTestProcessInputComponent
    ).componentInstance;
  });

  describe("Upon initialization", () => {
    it("should set the project id and initialized flag", () => {
      component.initializeForm(projectId, []);

      expect(component.projectId).toStrictEqual(projectId);
      expect(component.isFormInitialized).toStrictEqual(true);
    });

    describe("Provided inputs", () => {
      it("should set the repository id value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "repositoryId",
            value: repositoryId,
          },
        ]);

        expect(component.form.controls.repositoryId.value).toEqual(
          repositoryId
        );
      });

      it("should set the configuration branch name value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "configurationBranchName",
            value: configurationBranchName,
          },
        ]);

        expect(component.form.controls.configurationBranchName.value).toEqual(
          configurationBranchName
        );
      });

      it("should set the configuration parent branch value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "configurationParentBranch",
            value: configurationParentBranch,
          },
        ]);

        expect(component.form.controls.configurationParentBranch.value).toEqual(
          configurationParentBranch
        );
      });

      it("should set the skip environment deployment value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "skipEnvironmentDeployment",
            value: skipEnvironmentDeployment,
          },
        ]);
        expect(component.form.controls.skipEnvironmentDeployment.value).toEqual(
          skipEnvironmentDeployment
        );
      });

      it("should set the build scenario definition id value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "buildScenarioDefinitionId",
            value: buildScenarioDefinitionId,
          },
        ]);
        expect(component.form.controls.buildScenarioDefinitionId.value).toEqual(
          buildScenarioDefinitionId
        );
      });

      it("should set the build environment infra group value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "buildEnvironmentInfraGroup",
            value: buildEnvironmentInfraGroup,
          },
        ]);

        expect(
          component.form.controls.buildEnvironmentInfraGroup.value
        ).toEqual(buildEnvironmentInfraGroup);
      });

      it("should set the build and test infra group value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "buildAndTestInfraGroup",
            value: buildAndTestInfraGroup,
          },
        ]);

        expect(component.form.controls.buildAndTestInfraGroup.value).toEqual(
          buildAndTestInfraGroup
        );
      });

      it("should set the notifications recipients value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "notificationsRecipients",
            value: notificationsRecipients,
          },
        ]);

        expect(component.form.controls.notificationsRecipients.value).toEqual(
          notificationsRecipients
        );
      });
    });

    it("should validate that name exists", () => {
      component.initializeForm(projectId, []);

      expect(
        component.form.controls.name.hasValidator(Validators.required)
      ).toBeTruthy();
    });

    it("should validate that name is not blank", () => {
      component.initializeForm(projectId, []);

      expect(
        component.form.controls.name.hasValidator(
          WhitespaceValidators.notBlank()
        )
      ).toBeTruthy();
    });

    it("should validate repository id with standard selectable validators", () => {
      component.initializeForm(projectId, []);

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

    it("should validate configuration branch name with standard branch validators", () => {
      component.initializeForm(projectId, []);

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

    it("should validate configuration parent branch with standard branch validators", () => {
      component.initializeForm(projectId, []);

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

    it("should validate build scenario definition with standard selectable validators", () => {
      component.initializeForm(projectId, []);

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

    it("should stop validating scenario definition if skip environment deployment is true", () => {
      component.initializeForm(projectId, []);
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
      component.initializeForm(projectId, []);
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

    it("should validate that user stories are required and are at least one", () => {
      component.initializeForm(projectId, []);

      expect(
        component.form.controls.userStoryIds.hasValidator(Validators.required)
      ).toBeTruthy();
    });

    it("should validate build environment infra group with standard selectable validators", () => {
      component.initializeForm(projectId, []);

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

    it("should validate build and test infra group with standard selectable validators", () => {
      component.initializeForm(projectId, []);

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

    describe("Form control groups", () => {
      it("should initialize configuration parameters form controls array", () => {
        component.initializeForm(projectId, []);

        expect(component.configurationParametersFormControls).toEqual([
          component.repositoryFormControl,
          component.configurationBranchNameFormControl,
          component.configurationParentBranchFormControl,
        ]);
      });

      it("should initialize user stories form controls array", () => {
        component.initializeForm(projectId, []);

        expect(component.userStoriesFormControls).toEqual([
          component.userStoryIdsFormControl,
        ]);
      });

      it("should initialize infrastructure parameters form controls array", () => {
        component.initializeForm(projectId, []);

        expect(component.infrastructureParametersFormControls).toEqual([
          component.buildEnvironmentInfraGroupFormControl,
          component.buildAndTestInfraGroupFormControl,
        ]);
      });
    });
  });

  it("should reset the form", () => {
    component.initializeForm(projectId, []);
    component.form.patchValue({
      name: name,
      repositoryId: repositoryId,
    });

    component.resetForm();

    expect(component.form.controls.name.value).toBeNull();
    expect(component.form.controls.repositoryId.value).toBeNull();
    expect(component.isFormInitialized).toStrictEqual(false);
  });

  it("should return execute build and test process input from form value", () => {
    component.initializeForm(projectId, []);
    component.form.setValue({
      name: name,
      repositoryId: repositoryId,
      configurationBranchName: configurationBranchName,
      configurationParentBranch: configurationParentBranch,
      skipEnvironmentDeployment: skipEnvironmentDeployment,
      buildScenarioDefinitionId,
      userStoryIds: userStoryIds,
      buildEnvironmentInfraGroup: buildEnvironmentInfraGroup,
      buildAndTestInfraGroup: buildAndTestInfraGroup,
      notificationsRecipients: notificationsRecipients,
    });

    const result = component.getExecuteBuildAndTestProcessInput();

    expect(result).toEqual({
      name: name,
      repositoryId: repositoryId,
      configurationBranchName: configurationBranchName,
      configurationParentBranch: configurationParentBranch,
      skipPrepareBuildEnvironment: skipEnvironmentDeployment,
      buildScenarioDefinitionId,
      userStoryIds: userStoryIds,
      buildEnvironmentInfraGroup: buildEnvironmentInfraGroup,
      buildAndTestInfraGroup: buildAndTestInfraGroup,
      notificationsRecipients: notificationsRecipients,
    });
  });
});
