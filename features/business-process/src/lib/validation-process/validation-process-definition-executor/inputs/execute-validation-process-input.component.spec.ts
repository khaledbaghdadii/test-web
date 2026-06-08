import { Validators } from "@angular/forms";
import { WhitespaceValidators } from "@mxflow/validator";
import { ExecuteValidationProcessInputComponent } from "./execute-validation-process-input.component";
import { v4 as uuidv4 } from "uuid";
import {
  DefinitionInputsValidators,
  InputValidationMode,
} from "@mxflow/features/business-process";
import { TestBed } from "@angular/core/testing";
import { ValidationScopeStartCommitIdParentBranchResolverService } from "./validation-scope-start-commit-id-parent-branch-resolver.service";
import { ValidationScopeStartCommitIdStateResolverService } from "./validation-scope-start-commit-id-state-resolver.service";
import { of, BehaviorSubject } from "rxjs";

describe("Execute validation process definition inputs component", () => {
  const projectId = uuidv4();
  const name = uuidv4();
  const notificationsRecipients = [uuidv4(), uuidv4()];
  const testScenarioIds = [uuidv4(), uuidv4()];
  const nightlyRepusherEnabled = true;
  const qualityGateExecutionInfraGroupId = uuidv4();
  const repositoryId = uuidv4();
  const businessProcessQualityLevel = "MQG";
  const archivalBranchName = uuidv4();
  const parentBranch = uuidv4();
  const finalProductId = uuidv4();
  const rtpCommitId = uuidv4();
  const configCommitId = uuidv4();
  const validationScopeStartCommitId = uuidv4();

  let component: ExecuteValidationProcessInputComponent;
  let validationScopeStartCommitIdVisibilityResolver: jest.Mocked<ValidationScopeStartCommitIdStateResolverService>;

  beforeEach(() => {
    validationScopeStartCommitIdVisibilityResolver = {
      resolve: jest
        .fn()
        .mockReturnValue(of({ visible: false, resolvedParentBranch: null })),
    } as unknown as jest.Mocked<ValidationScopeStartCommitIdStateResolverService>;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ValidationScopeStartCommitIdParentBranchResolverService,
          useValue: { resolve: jest.fn().mockReturnValue(of(null)) },
        },
        {
          provide: ValidationScopeStartCommitIdStateResolverService,
          useValue: validationScopeStartCommitIdVisibilityResolver,
        },
      ],
    });

    component = TestBed.runInInjectionContext(
      () => new ExecuteValidationProcessInputComponent()
    );
  });

  describe("Upon initialization", () => {
    it("should set the project id", () => {
      component.initializeForm(projectId, []);

      expect(component.projectId).toStrictEqual(projectId);
    });

    it("should set the is form initialized flag to true", () => {
      component.isFormInitialized = false;
      component.initializeForm(projectId, []);

      expect(component.isFormInitialized).toStrictEqual(true);
    });

    describe("Provided inputs", () => {
      it("should set the test scenario ids value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "testScenarioIds",
            value: testScenarioIds,
          },
        ]);

        expect(
          component.form.controls.qualityGateScenarioDefinitionIds.value
        ).toEqual(testScenarioIds);
      });

      it("should set the nightly repusher enabled value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "nightlyRepusherEnabled",
            value: nightlyRepusherEnabled,
          },
        ]);

        expect(component.form.controls.nightlyRepusherEnabled.value).toEqual(
          nightlyRepusherEnabled
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

      it("should set the quality gate execution infra group id value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "qualityGateExecutionInfraGroupId",
            value: qualityGateExecutionInfraGroupId,
          },
        ]);

        expect(component.form.controls.qualityGateInfraGroupId.value).toEqual(
          qualityGateExecutionInfraGroupId
        );
      });

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

      it("should set the quality gate level value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "businessProcessQualityLevel",
            value: businessProcessQualityLevel,
          },
        ]);

        expect(
          component.form.controls.businessProcessQualityLevel.value
        ).toEqual(businessProcessQualityLevel);
      });

      it("should set the create branch value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "createBranch",
            value: true,
          },
        ]);

        expect(component.form.controls.createBranch.value).toEqual(true);
      });

      it("should be backward compatible for definitions saving create branch to true as a string", () => {
        component.initializeForm(projectId, [
          {
            inputId: "createBranch",
            value: "true",
          },
        ]);

        expect(component.form.controls.createBranch.value).toEqual(true);
      });

      it("should be backward compatible for definitions saving create branch to false as a string", () => {
        component.initializeForm(projectId, [
          {
            inputId: "createBranch",
            value: "false",
          },
        ]);

        expect(component.form.controls.createBranch.value).toEqual(false);
      });

      it("should set the archival branch name value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "archivalBranchName",
            value: archivalBranchName,
          },
        ]);

        expect(component.form.controls.archivalBranchName.value).toEqual(
          archivalBranchName
        );
      });

      it("should set the parent branch value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "parentBranch",
            value: parentBranch,
          },
        ]);

        expect(component.form.controls.parentBranchName.value).toEqual(
          parentBranch
        );
      });

      it("should set the final product id value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "finalProductId",
            value: finalProductId,
          },
        ]);

        expect(component.form.controls.finalProductId.value).toEqual(
          finalProductId
        );
      });

      it("should set the rtp commit id value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "rtpCommitId",
            value: rtpCommitId,
          },
        ]);

        expect(component.form.controls.rtpCommitId.value).toEqual(rtpCommitId);
      });

      it("should set the config commit id value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "configCommitId",
            value: configCommitId,
          },
        ]);

        expect(component.form.controls.configCommitId.value).toEqual(
          configCommitId
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

    it("should validate official flag with standard selectable validators", () => {
      component.initializeForm(projectId, []);

      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.official.hasValidator(validator)
        ).toBeTruthy();
      });
    });

    it("should validate test scenario ids with standard multi select validators", () => {
      component.initializeForm(projectId, []);

      const expectedValidators =
        DefinitionInputsValidators.standardMultiSelectInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.qualityGateScenarioDefinitionIds.hasValidator(
            validator
          )
        ).toBeTruthy();
      });
    });

    it("should validate nightly repusher enabled with standard selectable validators", () => {
      component.initializeForm(projectId, []);

      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.nightlyRepusherEnabled.hasValidator(validator)
        ).toBeTruthy();
      });
    });

    it("should validate quality gate execution infra group with standard selectable validators", () => {
      component.initializeForm(projectId, []);

      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.qualityGateInfraGroupId.hasValidator(
            validator
          )
        ).toBeTruthy();
      });
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

    it("should validate quality gate level with standard selectable validators", () => {
      component.initializeForm(projectId, []);

      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.businessProcessQualityLevel.hasValidator(
            validator
          )
        ).toBeTruthy();
      });
    });

    it("should validate create branch with standard selectable validators", () => {
      component.initializeForm(projectId, []);

      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.createBranch.hasValidator(validator)
        ).toBeTruthy();
      });
    });

    it("archival branch input should be required", () => {
      component.initializeForm(projectId, []);

      expect(
        component.form.controls.archivalBranchName.hasValidator(
          Validators.required
        )
      ).toBeTruthy();
    });

    it("should validate final product id with standard selectable validators", () => {
      component.initializeForm(projectId, []);

      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.finalProductId.hasValidator(validator)
        ).toBeTruthy();
      });
    });

    it("should validate rtp commit id with standard selectable validators", () => {
      component.initializeForm(projectId, []);

      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.rtpCommitId.hasValidator(validator)
        ).toBeTruthy();
      });
    });

    it("should validate config commit id with standard selectable validators", () => {
      component.initializeForm(projectId, []);

      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.configCommitId.hasValidator(validator)
        ).toBeTruthy();
      });
    });

    describe("Form control groups", () => {
      it("should initialize configuration parameters form controls array", () => {
        component.initializeForm(projectId, []);

        expect(component.configurationParametersFormControls).toEqual([
          component.repositoryIdFormControl,
          component.archivalBranchNameFormControl,
          component.parentBranchFormControl,
          component.finalProductIdFromControl,
          component.businessProcessQualityLevelFormControl,
          component.createBranchFormControl,
          component.rtpCommitIdFormControl,
          component.configCommitIdFormControl,
        ]);
      });

      it("should initialize test form controls array", () => {
        component.initializeForm(projectId, []);

        expect(component.testFormControls).toEqual([
          component.testScenarioIdsFormControl,
          component.nightlyRepusherEnabledFormControl,
        ]);
      });

      it("should initialize infra form controls array", () => {
        component.initializeForm(projectId, []);

        expect(component.infraFormControls).toEqual([
          component.qualityGateExecutionInfraGroupFormControl,
        ]);
      });
    });
  });

  describe("validation Scope Start Commit Id Input", () => {
    it("given the section is visible, then the validation scope start commit id input should be required", () => {
      validationScopeStartCommitIdVisibilityResolver.resolve.mockReturnValue(
        of({ visible: true, resolvedParentBranch: parentBranch })
      );
      component.initializeForm(projectId, []);

      expect(
        component.validationScopeStartCommitIdFormControl.hasValidator(
          Validators.required
        )
      ).toBeTruthy();
    });

    it("given the section is not visible, then the validation scope start commit id input should not be required", () => {
      validationScopeStartCommitIdVisibilityResolver.resolve.mockReturnValue(
        of({ visible: false, resolvedParentBranch: null })
      );
      component.initializeForm(projectId, []);

      expect(
        component.validationScopeStartCommitIdFormControl.hasValidator(
          Validators.required
        )
      ).toBeFalsy();
    });

    it("given the section becomes not visible, then the validation scope start commit id value should be reset", () => {
      const subject = new BehaviorSubject({
        visible: true,
        resolvedParentBranch: parentBranch,
      });
      validationScopeStartCommitIdVisibilityResolver.resolve.mockReturnValue(
        subject.asObservable()
      );
      component.initializeForm(projectId, []);
      component.validationScopeStartCommitIdFormControl.setValue(
        "some-commit-id"
      );

      subject.next({
        visible: false,
        resolvedParentBranch: null as unknown as string,
      });

      expect(
        component.validationScopeStartCommitIdFormControl.value
      ).toBeNull();
    });

    it("given the validation scope start commit id section is visible, when the form is initialized, then it should show the validation scope parameters section", () => {
      validationScopeStartCommitIdVisibilityResolver.resolve.mockReturnValue(
        of({ visible: true, resolvedParentBranch: parentBranch })
      );
      component.initializeForm(projectId, []);

      expect(component.showValidationScopeParameters).toBe(true);
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
  });

  it("should return validation process definition inputs from form value", () => {
    component.initializeForm(projectId, []);
    component.form.setValue({
      name: name,
      official: true,
      notificationsRecipients: notificationsRecipients,
      qualityGateScenarioDefinitionIds: testScenarioIds,
      nightlyRepusherEnabled: nightlyRepusherEnabled,
      qualityGateInfraGroupId: qualityGateExecutionInfraGroupId,
      repositoryId: repositoryId,
      businessProcessQualityLevel: businessProcessQualityLevel,
      createBranch: true,
      archivalBranchName: archivalBranchName,
      parentBranchName: parentBranch,
      finalProductId: finalProductId,
      rtpCommitId: rtpCommitId,
      configCommitId: configCommitId,
      validationScopeStartCommitId: validationScopeStartCommitId,
    });

    const result = component.getExecuteValidationProcessDefinitionInputs();

    expect(result).toEqual({
      name: name,
      official: true,
      notificationsRecipients: notificationsRecipients,
      qualityGateScenarioDefinitionIds: testScenarioIds,
      nightlyRepusherEnabled: nightlyRepusherEnabled,
      qualityGateInfraGroupId: qualityGateExecutionInfraGroupId,
      repositoryId: repositoryId,
      businessProcessQualityLevel: businessProcessQualityLevel,
      createBranch: true,
      archivalBranchName: archivalBranchName,
      parentBranchName: parentBranch,
      finalProductId: finalProductId,
      rtpCommitId: rtpCommitId,
      configCommitId: configCommitId,
      validationScopeStartCommitId: validationScopeStartCommitId,
    });
  });
});
