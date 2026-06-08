import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RepushValidationProcessExecutionInputsComponent } from "./repush-validation-process-execution-inputs.component";
import { v4 as uuidv4 } from "uuid";
import {
  DefinitionInputsValidators,
  InputValidationMode,
  ValidationProcessExecution,
} from "@mxflow/features/business-process";
import { Validators } from "@angular/forms";
import { WhitespaceValidators } from "@mxflow/validator";
import { of, BehaviorSubject } from "rxjs";
import { ValidationScopeStartCommitIdParentBranchResolverService } from "../../validation-process-definition-executor/inputs/validation-scope-start-commit-id-parent-branch-resolver.service";
import { ValidationScopeStartCommitIdStateResolverService } from "../../validation-process-definition-executor/inputs/validation-scope-start-commit-id-state-resolver.service";

const PROJECT_ID = uuidv4();
const ID = uuidv4();
const PROCESS_NAME = uuidv4();
const REPO_ID = uuidv4();
const ARCHIVAL_BRANCH_NAME = uuidv4();
const QUALITY_GATE_LEVEL = uuidv4();
const QUALITY_GATE_EXECUTION_INFRA_GROUP_ID = uuidv4();
const SCENARIO_DEFINITION_IDS = [uuidv4()];
const PARENT_BRANCH_NAME = uuidv4();
const FINAL_PRODUCT_ID = uuidv4();
const CONFIG_COMMIT_ID = uuidv4();
const RTP_COMMIT_ID = uuidv4();
const VALIDATION_SCOPE_START_COMMIT_ID = uuidv4();
const parentExecution: ValidationProcessExecution = {
  id: ID,
  name: PROCESS_NAME,
  input: {
    repositoryId: REPO_ID,
    createBranch: true,
    archivalBranchName: ARCHIVAL_BRANCH_NAME,
    parentBranch: PARENT_BRANCH_NAME,
    scenarioDefinitionIds: SCENARIO_DEFINITION_IDS,
    businessProcessQualityLevel: QUALITY_GATE_LEVEL,
    finalProductId: FINAL_PRODUCT_ID,
    qualityGateExecutionInfraGroupId: QUALITY_GATE_EXECUTION_INFRA_GROUP_ID,
    configCommitId: CONFIG_COMMIT_ID,
    rtpCommitId: RTP_COMMIT_ID,
    nightlyRepusherEnabled: false,
    validationScopeStartCommitId: VALIDATION_SCOPE_START_COMMIT_ID,
  },
} as unknown as ValidationProcessExecution;

describe("RepushValidationProcessExecutionInputs", () => {
  let fixture: ComponentFixture<RepushValidationProcessExecutionInputsComponent>;
  let componentInstance: RepushValidationProcessExecutionInputsComponent;
  let validationScopeStartCommitIdVisibilityResolver: jest.Mocked<ValidationScopeStartCommitIdStateResolverService>;

  beforeEach(async () => {
    validationScopeStartCommitIdVisibilityResolver = {
      resolve: jest
        .fn()
        .mockReturnValue(of({ visible: false, resolvedParentBranch: null })),
    } as unknown as jest.Mocked<ValidationScopeStartCommitIdStateResolverService>;

    await TestBed.configureTestingModule({
      imports: [RepushValidationProcessExecutionInputsComponent],
      providers: [],
    })
      .overrideComponent(RepushValidationProcessExecutionInputsComponent, {
        set: {
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
        },
      })
      .compileComponents();
    fixture = TestBed.createComponent(
      RepushValidationProcessExecutionInputsComponent
    );
    componentInstance = fixture.componentInstance;
  });

  describe("When user opens the repush form", () => {
    it("should set the project id", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);

      expect(componentInstance.projectId).toStrictEqual(PROJECT_ID);
    });

    it("should set the provided inputs", () => {
      const providedInputs = [
        { inputId: "repositoryId", value: "repositoryId" },
      ];
      componentInstance.initializeForm(
        PROJECT_ID,
        providedInputs,
        parentExecution
      );

      expect(componentInstance.providedInputs).toStrictEqual(providedInputs);
    });

    it("should set the parent execution inputs", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);

      expect(componentInstance.execution).toStrictEqual(parentExecution);
    });

    it("when the modal is rendered, then the system should declare that the form is initialized", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      expect(componentInstance.isFormInitialized).toBeTruthy();
    });

    it("the system should prefill the name input with the execution name following by `- Copy`", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);

      expect(componentInstance.form.controls.name.value).toEqual(
        `${PROCESS_NAME} - Copy`
      );
    });

    it("the system should validate the name input with required and whitespace validators", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);

      expect(
        componentInstance.nameFormControl.hasValidator(Validators.required)
      ).toBeTruthy();
      expect(
        componentInstance.nameFormControl.hasValidator(
          WhitespaceValidators.notBlank()
        )
      ).toBeTruthy();
    });

    it("the system should set validate official flag input with standard selectable validators", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          componentInstance.form.controls.official.hasValidator(validator)
        ).toBeTruthy();
      });
    });

    it("given that notifications recipients input is not provided by the process definition, then the system should prefill the input from the previous execution", () => {
      const parentExecutionWithNotifications = {
        ...parentExecution,
        notificationsRecipients: [uuidv4(), uuidv4()],
      };
      componentInstance.initializeForm(
        PROJECT_ID,
        [],
        parentExecutionWithNotifications
      );
      expect(
        componentInstance.form.controls.notificationsRecipients.value
      ).toEqual(parentExecutionWithNotifications.notificationsRecipients);
    });

    it("given that notifications recipients input is provided by the process definition, then the system should prefill the input from the process definition", () => {
      const notificationsRecipients = [uuidv4(), uuidv4()];
      componentInstance.initializeForm(
        PROJECT_ID,
        [
          {
            inputId: "notificationsRecipients",
            value: notificationsRecipients,
          },
        ],
        parentExecution
      );
      expect(
        componentInstance.form.controls.notificationsRecipients.value
      ).toEqual(notificationsRecipients);
    });

    it("given that notifications recipients input is not provided by the process definition, then the system should show the notifications recipients input", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      expect(componentInstance.forceShowNotificationsRecipients).toBeTruthy();
    });

    it("given that notifications recipients input is provided by the process definition, then the system should not show the notifications recipients input", () => {
      const notificationsRecipients = [uuidv4(), uuidv4()];
      componentInstance.initializeForm(
        PROJECT_ID,
        [
          {
            inputId: "notificationsRecipients",
            value: notificationsRecipients,
          },
        ],
        parentExecution
      );
      expect(componentInstance.forceShowNotificationsRecipients).toBeFalsy();
    });

    it("given that that repository input is not provided by the process definition, then the system should prefill the input from the previous execution and render it in the modal", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      expect(componentInstance.form.controls.repositoryId.value).toEqual(
        parentExecution.input.repositoryId
      );
      expect(
        componentInstance.prefilledConfigurationParametersToShow.includes(
          "repositoryId"
        )
      ).toBeTruthy();
    });

    it("given that that repository input is provided by the process definition, then the system should prefill the input from the process definition and not render it in the modal", () => {
      const repositoryId = uuidv4();
      componentInstance.initializeForm(
        PROJECT_ID,
        [{ inputId: "repositoryId", value: repositoryId }],
        parentExecution
      );
      expect(componentInstance.form.controls.repositoryId.value).toEqual(
        repositoryId
      );
      expect(
        componentInstance.prefilledConfigurationParametersToShow.includes(
          "repositoryId"
        )
      ).toBeFalsy();
    });

    it("the system should validate the repository id input with standard selectable validators", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          componentInstance.form.controls.repositoryId.hasValidator(validator)
        ).toBeTruthy();
      });
    });

    it("given that that create branch input is not provided by the process definition, then the system should prefill the input from the previous execution and render it in the modal", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      expect(componentInstance.form.controls.createBranch.value).toEqual(
        parentExecution.input.createBranch
      );
      expect(
        componentInstance.prefilledConfigurationParametersToShow.includes(
          "createBranch"
        )
      ).toBeTruthy();
    });

    it("given that that create branch input is provided by the process definition, then the system should prefill the input from the process definition and not render it in the modal", () => {
      componentInstance.initializeForm(
        PROJECT_ID,
        [{ inputId: "createBranch", value: false }],
        parentExecution
      );
      expect(componentInstance.form.controls.createBranch.value).toEqual(false);
      expect(
        componentInstance.prefilledConfigurationParametersToShow.includes(
          "createBranch"
        )
      ).toBeFalsy();
    });

    it("the system should set validate create branch input with standard selectable validators", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          componentInstance.form.controls.createBranch.hasValidator(validator)
        ).toBeTruthy();
      });
    });

    it("given that that quality gate level input is not provided by the process definition, then the system should prefill the input from the previous execution and render it in the modal", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      expect(
        componentInstance.form.controls.businessProcessQualityLevel.value
      ).toEqual(parentExecution.input.businessProcessQualityLevel);
      expect(
        componentInstance.prefilledConfigurationParametersToShow.includes(
          "businessProcessQualityLevel"
        )
      ).toBeTruthy();
    });

    it("given that that quality gate level input is provided by the process definition, then the system should prefill the input from the process definition and not render it in the modal", () => {
      const businessProcessQualityLevel = uuidv4();
      componentInstance.initializeForm(
        PROJECT_ID,
        [
          {
            inputId: "businessProcessQualityLevel",
            value: businessProcessQualityLevel,
          },
        ],
        parentExecution
      );
      expect(
        componentInstance.form.controls.businessProcessQualityLevel.value
      ).toEqual(businessProcessQualityLevel);
      expect(
        componentInstance.prefilledConfigurationParametersToShow.includes(
          "businessProcessQualityLevel"
        )
      ).toBeFalsy();
    });

    it("the system should set validate quality gate level input with standard selectable validators", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          componentInstance.form.controls.businessProcessQualityLevel.hasValidator(
            validator
          )
        ).toBeTruthy();
      });
    });

    it("given that that archival branch name input is not provided by the process definition, then the system should prefill the input from the previous execution and render it in the modal", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      expect(componentInstance.form.controls.archivalBranchName.value).toEqual(
        parentExecution.input.archivalBranchName
      );
      expect(
        componentInstance.prefilledConfigurationParametersToShow.includes(
          "archivalBranchName"
        )
      ).toBeTruthy();
    });

    it("given that that archival branch name input is provided by the process definition, then the system should prefill the input from the process definition and not render it in the modal", () => {
      const archivalBranchName = uuidv4();
      componentInstance.initializeForm(
        PROJECT_ID,
        [{ inputId: "archivalBranchName", value: archivalBranchName }],
        parentExecution
      );
      expect(componentInstance.form.controls.archivalBranchName.value).toEqual(
        archivalBranchName
      );
      expect(
        componentInstance.prefilledConfigurationParametersToShow.includes(
          "archivalBranchName"
        )
      ).toBeFalsy();
    });

    it("archival branch name should be required", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);

      expect(
        componentInstance.form.controls.archivalBranchName.hasValidator(
          Validators.required
        )
      ).toBeTruthy();
    });

    it("when a user repush a process from a definition that currently sets the quality gate level to MQG and create branch is set to true, and the parent branch input is not provided by the process definition, then the system should automatically prefill the parent branch input using the value from the previous execution and prompt the user with it.", () => {
      componentInstance.initializeForm(
        PROJECT_ID,
        [
          { inputId: "businessProcessQualityLevel", value: "MQG" },
          { inputId: "createBranch", value: "true" },
        ],
        parentExecution
      );
      expect(componentInstance.form.controls.parentBranchName.value).toEqual(
        parentExecution.input.parentBranch
      );
    });

    it("when a user repush a process from a definition that currently sets the quality gate level to MQG and create branch is set to true, and the parent branch input is not parent branch input is provided by the definition, then the system should fill the parent branch input using the process input definition and will not render it", () => {
      const parentBranch = uuidv4();
      componentInstance.initializeForm(
        PROJECT_ID,
        [
          { inputId: "businessProcessQualityLevel", value: "MQG" },
          { inputId: "createBranch", value: "true" },
          { inputId: "parentBranch", value: parentBranch },
        ],
        parentExecution
      );
      expect(componentInstance.form.controls.parentBranchName.value).toEqual(
        parentBranch
      );
    });

    it("given that the old execution had a parent branch input but the current definition that the user is repushing from sets the quality gate level to DQG, then the system should ignore the parent branch input as it is now obsolete", () => {
      parentExecution.input.parentBranch = uuidv4();
      parentExecution.input.createBranch = true;
      parentExecution.input.businessProcessQualityLevel = "MQG";
      componentInstance.initializeForm(
        PROJECT_ID,
        [{ inputId: "businessProcessQualityLevel", value: "DQG" }],
        parentExecution
      );
      expect(componentInstance.form.controls.parentBranchName.value).toBeNull();
    });

    it("given that the old execution had a parent branch input but the current definition that the user is repushing from sets the quality gate level to MQG and create branch to false, then the system should ignore the parent branch input as it is now obsolete", () => {
      parentExecution.input.businessProcessQualityLevel = "MQG";
      parentExecution.input.parentBranch = uuidv4();
      parentExecution.input.createBranch = true;

      componentInstance.initializeForm(
        PROJECT_ID,
        [
          { inputId: "businessProcessQualityLevel", value: "MQG" },
          { inputId: "createBranch", value: "false" },
        ],
        parentExecution
      );
      expect(componentInstance.form.controls.parentBranchName.value).toBeNull();
    });

    it("the system should render the parent branch name, when the process that is being repushed is MQG and the parent branch input is provided by the process execution", () => {
      componentInstance.initializeForm(
        PROJECT_ID,
        [{ inputId: "businessProcessQualityLevel", value: "MQG" }],
        parentExecution
      );
      expect(
        componentInstance.prefilledConfigurationParametersToShow.includes(
          "parentBranch"
        )
      ).toBeTruthy();
    });

    it("given that that final product id input is not provided by the process definition, then the system should prefill the input from the previous execution and render it in the modal", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      expect(componentInstance.form.controls.finalProductId.value).toEqual(
        parentExecution.input.finalProductId
      );
      expect(
        componentInstance.prefilledConfigurationParametersToShow.includes(
          "finalProductId"
        )
      ).toBeTruthy();
    });

    it("given that that final product id input is provided by the process definition, then the system should prefill the input from the process definition and not render it in the modal", () => {
      const finalProductId = uuidv4();
      componentInstance.initializeForm(
        PROJECT_ID,
        [{ inputId: "finalProductId", value: finalProductId }],
        parentExecution
      );
      expect(componentInstance.form.controls.finalProductId.value).toEqual(
        finalProductId
      );
      expect(
        componentInstance.prefilledConfigurationParametersToShow.includes(
          "finalProductId"
        )
      ).toBeFalsy();
    });

    it("the system should set validate final product id input with standard selectable validators", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          componentInstance.form.controls.finalProductId.hasValidator(validator)
        ).toBeTruthy();
      });
    });

    it("given that that rtp commit id input is not provided by the process definition, then the system should prefill the input from the previous execution and render it in the modal", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      expect(componentInstance.form.controls.rtpCommitId.value).toEqual(
        parentExecution.input.rtpCommitId
      );
      expect(
        componentInstance.prefilledConfigurationParametersToShow.includes(
          "rtpCommitId"
        )
      ).toBeTruthy();
    });

    it("given that that rtp commit id input is provided by the process definition, then the system should prefill the input from the process definition and not render it in the modal", () => {
      const rtpCommitId = uuidv4();
      componentInstance.initializeForm(
        PROJECT_ID,
        [{ inputId: "rtpCommitId", value: rtpCommitId }],
        parentExecution
      );
      expect(componentInstance.form.controls.rtpCommitId.value).toEqual(
        rtpCommitId
      );
      expect(
        componentInstance.prefilledConfigurationParametersToShow.includes(
          "rtpCommitId"
        )
      ).toBeFalsy();
    });

    it("the system should set validate rtp commit id input with standard selectable validators", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          componentInstance.form.controls.rtpCommitId.hasValidator(validator)
        ).toBeTruthy();
      });
    });

    it("given that that config commit id input is not provided by the process definition, then the system should prefill the input from the previous execution and render it in the modal", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      expect(componentInstance.form.controls.configCommitId.value).toEqual(
        parentExecution.input.configCommitId
      );
      expect(
        componentInstance.prefilledConfigurationParametersToShow.includes(
          "configCommitId"
        )
      ).toBeTruthy();
    });

    it("given that that config commit id input is provided by the process definition, then the system should prefill the input from the process definition and not render it in the modal", () => {
      const configCommitId = uuidv4();
      componentInstance.initializeForm(
        PROJECT_ID,
        [{ inputId: "configCommitId", value: configCommitId }],
        parentExecution
      );
      expect(componentInstance.form.controls.configCommitId.value).toEqual(
        configCommitId
      );
      expect(
        componentInstance.prefilledConfigurationParametersToShow.includes(
          "configCommitId"
        )
      ).toBeFalsy();
    });

    it("the system should set validate config commit id input with standard selectable validators", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          componentInstance.form.controls.configCommitId.hasValidator(validator)
        ).toBeTruthy();
      });
    });

    it("given that that nightly repush input is not provided by the process definition, then the system should prefill the input from the previous execution and render it in the modal", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      expect(
        componentInstance.form.controls.nightlyRepusherEnabled.value
      ).toEqual(parentExecution.input.nightlyRepusherEnabled);
      expect(
        componentInstance.forceShowNightlyRepusherEnabledInput
      ).toBeTruthy();
    });

    it("given that that nightly repush is provided by the process definition, then the system should prefill the input from the process definition and not render it in the modal", () => {
      componentInstance.initializeForm(
        PROJECT_ID,
        [{ inputId: "nightlyRepusherEnabled", value: true }],
        parentExecution
      );
      expect(
        componentInstance.form.controls.nightlyRepusherEnabled.value
      ).toBeTruthy();
      expect(
        componentInstance.forceShowNightlyRepusherEnabledInput
      ).toBeFalsy();
    });

    it("the system should validate the nightly repush input with standard selectable validators", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          componentInstance.form.controls.nightlyRepusherEnabled.hasValidator(
            validator
          )
        ).toBeTruthy();
      });
    });

    it("given that that quality gate scenario definition ids input is not provided by the process definition, then the system should prefill the input from the previous execution and render it in the modal", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      expect(
        componentInstance.form.controls.qualityGateScenarioDefinitionIds.value
      ).toEqual(parentExecution.input.scenarioDefinitionIds);
      expect(
        componentInstance.forceShowQualityGateScenarioDefinitionIdsFormControl
      ).toBeTruthy();
    });

    it("given that that quality gate scenario definition ids input is provided by the process definition, then the system should prefill the input from the process definition and not render it in the modal", () => {
      const qualityGateScenarioDefinitionIds = [uuidv4(), uuidv4()];
      componentInstance.initializeForm(
        PROJECT_ID,
        [
          {
            inputId: "testScenarioIds",
            value: qualityGateScenarioDefinitionIds,
          },
        ],
        parentExecution
      );
      expect(
        componentInstance.form.controls.qualityGateScenarioDefinitionIds.value
      ).toEqual(qualityGateScenarioDefinitionIds);
      expect(
        componentInstance.forceShowQualityGateScenarioDefinitionIdsFormControl
      ).toBeFalsy();
    });

    it("the system should validate the quality gate scenario definition ids input with standard multi select validators", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      const expectedValidators =
        DefinitionInputsValidators.standardMultiSelectInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          componentInstance.form.controls.qualityGateScenarioDefinitionIds.hasValidator(
            validator
          )
        ).toBeTruthy();
      });
    });

    it("given that that quality gate execution infra group id input is not provided by the process definition, then the system should prefill the input from the previous execution and render it in the modal", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      expect(
        componentInstance.form.controls.qualityGateInfraGroupId.value
      ).toEqual(parentExecution.input.qualityGateExecutionInfraGroupId);
      expect(
        componentInstance.forceShowQualityGateExecutionInfraGroupIdInput
      ).toBeTruthy();
    });

    it("given that that quality gate execution infra group id input is provided by the process definition, then the system should prefill the input from the process definition and not render it in the modal", () => {
      const qualityGateInfraGroupId = uuidv4();
      componentInstance.initializeForm(
        PROJECT_ID,
        [
          {
            inputId: "qualityGateExecutionInfraGroupId",
            value: qualityGateInfraGroupId,
          },
        ],
        parentExecution
      );
      expect(
        componentInstance.form.controls.qualityGateInfraGroupId.value
      ).toEqual(qualityGateInfraGroupId);
      expect(
        componentInstance.forceShowQualityGateExecutionInfraGroupIdInput
      ).toBeFalsy();
    });

    it("the system should validate the quality gate execution infra group id input with standard selectable validators", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );
      expectedValidators.forEach((validator) => {
        expect(
          componentInstance.form.controls.qualityGateInfraGroupId.hasValidator(
            validator
          )
        ).toBeTruthy();
      });
    });

    it("given that all the configuration parameters are provided, then the system should not show the configuration parameters group", () => {
      componentInstance.initializeForm(
        PROJECT_ID,
        [
          { inputId: "repositoryId", value: uuidv4() },
          { inputId: "createBranch", value: true },
          { inputId: "archivalBranchName", value: uuidv4() },
          { inputId: "parentBranch", value: uuidv4() },
          { inputId: "businessProcessQualityLevel", value: uuidv4() },
          { inputId: "finalProductId", value: uuidv4() },
          { inputId: "configCommitId", value: uuidv4() },
          { inputId: "rtpCommitId", value: uuidv4() },
        ],
        parentExecution
      );
      expect(
        componentInstance.forceShowConfigurationParametersGroup
      ).toBeFalsy();
    });

    it("given that the repository id input should be shown in the model, then the system should show the configuration parameters group", () => {
      const providedInputs = [
        "createBranch",
        "archivalBranchName",
        "parentBranch",
        "businessProcessQualityLevel",
        "finalProductId",
        "configCommitId",
        "rtpCommitId",
      ];

      componentInstance.initializeForm(
        PROJECT_ID,
        providedInputs.map((providedInput) => ({
          inputId: providedInput,
          value: uuidv4(),
        })),
        parentExecution
      );

      expect(
        componentInstance.forceShowConfigurationParametersGroup
      ).toBeTruthy();
    });

    it("given that the createBranch should be shown in the model, then the system should show the configuration parameters group", () => {
      const providedInputs = [
        "finalProductId",
        "archivalBranchName",
        "businessProcessQualityLevel",
        "parentBranch",
        "repositoryId",
        "rtpCommitId",
        "configCommitId",
      ];

      componentInstance.initializeForm(
        PROJECT_ID,
        providedInputs.map((providedInput) => ({
          inputId: providedInput,
          value: uuidv4(),
        })),
        parentExecution
      );

      expect(
        componentInstance.forceShowConfigurationParametersGroup
      ).toBeTruthy();
    });

    it("given that the archival branch name input should be shown in the model, then the system should show the configuration parameters group", () => {
      const providedInputs = [
        "rtpCommitId",
        "createBranch",
        "repositoryId",
        "finalProductId",
        "parentBranch",
        "businessProcessQualityLevel",
        "configCommitId",
      ];

      componentInstance.initializeForm(
        PROJECT_ID,
        providedInputs.map((providedInput) => ({
          inputId: providedInput,
          value: uuidv4(),
        })),
        parentExecution
      );

      expect(
        componentInstance.forceShowConfigurationParametersGroup
      ).toBeTruthy();
    });

    it("given that the quality gate level should be shown in the model, then the system should show the configuration parameters group", () => {
      const providedInputs = [
        "repositoryId",
        "archivalBranchName",
        "createBranch",
        "finalProductId",
        "configCommitId",
        "parentBranch",
        "rtpCommitId",
      ];

      componentInstance.initializeForm(
        PROJECT_ID,
        providedInputs.map((providedInput) => ({
          inputId: providedInput,
          value: uuidv4(),
        })),
        parentExecution
      );

      expect(
        componentInstance.forceShowConfigurationParametersGroup
      ).toBeTruthy();
    });

    it("given that the final product id should be shown in the model, then the system should show the configuration parameters group", () => {
      const providedInputs = [
        "createBranch",
        "repositoryId",
        "parentBranch",
        "configCommitId",
        "businessProcessQualityLevel",
        "archivalBranchName",
        "rtpCommitId",
      ];

      componentInstance.initializeForm(
        PROJECT_ID,
        providedInputs.map((providedInput) => ({
          inputId: providedInput,
          value: uuidv4(),
        })),
        parentExecution
      );

      expect(
        componentInstance.forceShowConfigurationParametersGroup
      ).toBeTruthy();
    });

    it("given that the config commit id should be shown in the model, then the system should show the configuration parameters group", () => {
      const providedInputs = [
        "repositoryId",
        "rtpCommitId",
        "parentBranch",
        "archivalBranchName",
        "createBranch",
        "finalProductId",
        "businessProcessQualityLevel",
      ];

      componentInstance.initializeForm(
        PROJECT_ID,
        providedInputs.map((providedInput) => ({
          value: uuidv4(),
          inputId: providedInput,
        })),
        parentExecution
      );

      expect(
        componentInstance.forceShowConfigurationParametersGroup
      ).toBeTruthy();
    });

    it("given that the rtp commit id should be shown in the model, then the system should show the configuration parameters group", () => {
      const providedInputs = [
        "createBranch",
        "repositoryId",
        "parentBranch",
        "archivalBranchName",
        "finalProductId",
        "businessProcessQualityLevel",
        "configCommitId",
      ];

      componentInstance.initializeForm(
        PROJECT_ID,
        providedInputs.map((providedInput) => ({
          value: uuidv4(),
          inputId: providedInput,
        })),
        parentExecution
      );

      expect(
        componentInstance.forceShowConfigurationParametersGroup
      ).toBeTruthy();
    });

    it("given that the parent branch should be shown in the model, then the system should show the configuration parameters group", () => {
      const providedInputsKeys = [
        "rtpCommitId",
        "configCommitId",
        "archivalBranchName",
        "repositoryId",
        "finalProductId",
      ];

      const providedInputs = providedInputsKeys.map((providedInput) => ({
        inputId: providedInput,
        value: uuidv4(),
      }));

      providedInputs.push(
        { inputId: "businessProcessQualityLevel", value: "MQG" },
        { inputId: "createBranch", value: "true" }
      );

      componentInstance.initializeForm(
        PROJECT_ID,
        providedInputs,
        parentExecution
      );

      expect(
        componentInstance.forceShowConfigurationParametersGroup
      ).toBeTruthy();
    });

    it("given that all the infrastructure parameters are provided, then the system should not show the infrastructure parameters group", () => {
      componentInstance.initializeForm(
        PROJECT_ID,
        [{ inputId: "qualityGateExecutionInfraGroupId", value: uuidv4() }],
        parentExecution
      );
      expect(componentInstance.forceShowInfraParametersGroup).toBeFalsy();
    });

    it("given that at least one infrastructure parameter is not provided, then the system should show the infrastructure parameters group", () => {
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      expect(componentInstance.forceShowInfraParametersGroup).toBeTruthy();
    });

    it("given that all the test parameters are provided, then the system should not show the test parameters group", () => {
      componentInstance.initializeForm(
        PROJECT_ID,
        [
          { inputId: "testScenarioIds", value: [uuidv4(), uuidv4()] },
          { inputId: "nightlyRepusherEnabled", value: true },
        ],
        parentExecution
      );
      expect(componentInstance.forceShowTestParametersGroup).toBeFalsy();
    });

    it.each([
      [[{ inputId: "scenarioDefinitionIds", value: [uuidv4(), uuidv4()] }]],
      [[{ inputId: "nightlyRepusherEnabled", value: true }]],
    ])(
      "given that at least one test parameter is not provided, then the system should show the test parameters group",
      (providedInputs) => {
        componentInstance.initializeForm(
          PROJECT_ID,
          providedInputs,
          parentExecution
        );
        expect(componentInstance.forceShowTestParametersGroup).toBeTruthy();
      }
    );
  });

  it("given that the user filled the form, when the user decide to repush the process, then the system should use the inputs filled in the form", () => {
    componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
    const notificationsRecipients = [uuidv4(), uuidv4()];
    componentInstance.form.patchValue({
      name: "name",
      official: true,
      notificationsRecipients: notificationsRecipients,
      repositoryId: "repositoryId",
      createBranch: true,
      archivalBranchName: "archivalBranchName",
      parentBranchName: "parentBranch",
      qualityGateScenarioDefinitionIds: ["id1", "id2"],
      businessProcessQualityLevel: "businessProcessQualityLevel",
      finalProductId: "finalProductId",
      qualityGateInfraGroupId: "qualityGateExecutionInfraGroupId",
      configCommitId: "configCommitId",
      rtpCommitId: "rtpCommitId",
      nightlyRepusherEnabled: true,
    });

    expect(componentInstance.getRepushInputs()).toEqual({
      name: "name",
      official: true,
      notificationsRecipients: notificationsRecipients,
      repositoryId: "repositoryId",
      createBranch: true,
      archivalBranchName: "archivalBranchName",
      parentBranchName: "parentBranch",
      qualityGateScenarioDefinitionIds: ["id1", "id2"],
      businessProcessQualityLevel: "businessProcessQualityLevel",
      finalProductId: "finalProductId",
      qualityGateInfraGroupId: "qualityGateExecutionInfraGroupId",
      configCommitId: "configCommitId",
      rtpCommitId: "rtpCommitId",
      nightlyRepusherEnabled: true,
      validationScopeStartCommitId:
        componentInstance.validationScopeStartCommitIdFormControl.value,
    });
  });

  it("given that the user decided to cancel the repush, then the the modal inputs should be reset", () => {
    componentInstance.isFormInitialized = true;
    componentInstance.resetForm();
    expect(componentInstance.isFormInitialized).toBeFalsy();
  });

  it("given that the previous execution has a validation scope start commit id, when the user opens the repush modal, then the system should prefill the validation scope start commit id", () => {
    validationScopeStartCommitIdVisibilityResolver.resolve.mockReturnValue(
      of({ visible: true, resolvedParentBranch: PARENT_BRANCH_NAME })
    );
    componentInstance.initializeForm(PROJECT_ID, [], parentExecution);

    expect(
      componentInstance.validationScopeStartCommitIdFormControl.value
    ).toEqual(VALIDATION_SCOPE_START_COMMIT_ID);
  });

  describe("validation scope start commit id", () => {
    it("given the section is visible, then validation scope start commit id should be required", () => {
      validationScopeStartCommitIdVisibilityResolver.resolve.mockReturnValue(
        of({ visible: true, resolvedParentBranch: PARENT_BRANCH_NAME })
      );
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);

      expect(
        componentInstance.validationScopeStartCommitIdFormControl.hasValidator(
          Validators.required
        )
      ).toBeTruthy();
    });

    it("given the section is not visible, then validation scope start commit id should not be required", () => {
      validationScopeStartCommitIdVisibilityResolver.resolve.mockReturnValue(
        of({ visible: false, resolvedParentBranch: null })
      );
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);

      expect(
        componentInstance.validationScopeStartCommitIdFormControl.hasValidator(
          Validators.required
        )
      ).toBeFalsy();
    });

    it("given the section becomes not visible, then the validation scope start commit Id value should be reset", () => {
      const subject = new BehaviorSubject({
        visible: true,
        resolvedParentBranch: PARENT_BRANCH_NAME,
      });
      validationScopeStartCommitIdVisibilityResolver.resolve.mockReturnValue(
        subject.asObservable()
      );
      componentInstance.initializeForm(PROJECT_ID, [], parentExecution);
      componentInstance.validationScopeStartCommitIdFormControl.setValue(
        "some-commit-id"
      );

      subject.next({
        visible: false,
        resolvedParentBranch: null as unknown as string,
      });

      expect(
        componentInstance.validationScopeStartCommitIdFormControl.value
      ).toBeNull();
    });
  });
});
