import { Validators } from "@angular/forms";
import { WhitespaceValidators } from "@mxflow/validator";
import { RepushUpgradeProcessDefinitionInputsComponent } from "./repush-upgrade-process-definition-inputs.component";
import { FactoryProductValidator } from "../../../definition-input/validators/factory-product.validator";
import { DefinitionInputsValidators } from "../../../definition-input/validators/definition-inputs-validators";
import { UpgradeProcessExecution } from "../../upgrade-process-execution";
import { BusinessProcessExecutionStatus } from "../../../business-process-execution-status/business-process-execution-status";
import { StageStatus } from "@mxevolve/domains/business-process/util";
import { QualityGateValidationDecision } from "../../../quality-gate-validation/quality-gate-validation-result";

describe("Repush upgrade process definition inputs component test", () => {
  const projectId = "projectId";
  let component: RepushUpgradeProcessDefinitionInputsComponent;

  beforeEach(() => {
    component = new RepushUpgradeProcessDefinitionInputsComponent();
  });

  describe("Upon initialization", () => {
    it("should set the project id and set the initialized flag to true", () => {
      component.initializeForm(projectId, [], getUpgradeProcessExecution());

      expect(component.projectId).toStrictEqual(projectId);
      expect(component.isFormInitialized).toStrictEqual(true);
    });

    it("should initialize name with the name of the origin execution appended with - Copy suffix", () => {
      component.initializeForm(projectId, [], getUpgradeProcessExecution());

      expect(component.form.controls["name"].value).toEqual("name - Copy");
    });

    describe("Initializing inputs", () => {
      it("should set the factory product value from the provided input and not show it", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "factoryProduct",
              value: {
                id: "prefilledFactoryProductId",
                mxVersion: "prefilledMxVersion",
                mxBuildId: "prefilledMxBuildId",
                bipVersion: "prefilledBipVersion",
                bipBuildId: "prefilledBipBuildId",
              },
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(component.form.controls["factoryProduct"].value).toEqual({
          id: "prefilledFactoryProductId",
          mxVersion: "prefilledMxVersion",
          mxBuildId: "prefilledMxBuildId",
          bipVersion: "prefilledBipVersion",
          bipBuildId: "prefilledBipBuildId",
        });
        expect(component.forceShowFactoryProduct).toBeFalsy();
      });

      it("should set the factory product value from the origin execution when not present in the provided inputs and show it", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.form.controls["factoryProduct"].value).toEqual({
          id: "factoryProductId",
          mxVersion: "mxVersion",
          mxBuildId: "mxBuildId",
          bipVersion: "bipVersion",
          bipBuildId: "bipBuildId",
        });
        expect(component.forceShowFactoryProduct).toBeTruthy();
      });

      it("should set the factory product value from the origin execution when provided input is missing factory product id", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "factoryProduct",
              value: {
                mxVersion: "prefilledMxVersion",
                mxBuildId: "prefilledMxBuildId",
                bipVersion: "prefilledBipVersion",
                bipBuildId: "prefilledBipBuildId",
              },
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(component.form.controls["factoryProduct"].value).toEqual({
          id: "factoryProductId",
          mxVersion: "mxVersion",
          mxBuildId: "mxBuildId",
          bipVersion: "bipVersion",
          bipBuildId: "bipBuildId",
        });
        expect(component.forceShowFactoryProduct).toBeTruthy();
      });

      it("should set the parent mx archival branch name value from the provided input and not show it", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "parentMxArchivalBranch",
              value: "prefilledParentMxArchivalBranch",
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(component.form.controls["parentMxArchivalBranch"].value).toEqual(
          "prefilledParentMxArchivalBranch"
        );
        expect(component.forceShowParentMxArchivalBranch).toBeFalsy();
      });

      it("should set the parent mx archival branch name value from the origin execution when not present in the provided inputs and show it", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.form.controls["parentMxArchivalBranch"].value).toEqual(
          "parentMxArchivalBranch"
        );

        expect(component.forceShowParentMxArchivalBranch).toBeTruthy();
      });

      it("should set the upgrade jump value from the provided input and not show it", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "upgradeJump",
              value: "prefilledUpgradeJump",
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(component.form.controls["upgradeJump"].value).toEqual(
          "prefilledUpgradeJump"
        );
        expect(component.forceShowUpgradeJump).toBeFalsy();
      });

      it("should set the upgrade jump value from the origin execution when not present in the provided inputs and show it", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.form.controls["upgradeJump"].value).toEqual(
          "upgradeJump"
        );
        expect(component.forceShowUpgradeJump).toBeTruthy();
      });

      it("should set the repository id value from the provided input and not show it", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "repositoryId",
              value: "prefilledRepositoryId",
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(component.form.controls["repositoryId"].value).toEqual(
          "prefilledRepositoryId"
        );
        expect(component.forceShowRepositoryId).toBeFalsy();
      });

      it("should set the repository id value from the origin execution when not present in the provided inputs and show it", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.form.controls["repositoryId"].value).toEqual(
          "repositoryId"
        );
        expect(component.forceShowRepositoryId).toBeTruthy();
      });

      it("should set the business process quality level value from the provided input and not show it", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "businessProcessQualityLevel",
              value: "MQG",
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(
          component.form.controls["businessProcessQualityLevel"].value
        ).toEqual("MQG");
        expect(component.forceShowBusinessProcessQualityLevel).toBeFalsy();
      });

      it("should set the business process quality level value from the origin execution when not present in the provided inputs and show it", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["businessProcessQualityLevel"].value
        ).toEqual("businessProcessQualityLevel");
        expect(component.forceShowBusinessProcessQualityLevel).toBeTruthy();
      });

      it("should set the create branch value from the provided input and not show it if true", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "createBranch",
              value: true,
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(component.form.controls["createBranch"].value).toEqual(true);
        expect(component.forceShowCreateBranch).toBeFalsy();
      });

      it("should set the create branch flag value from the origin execution when not present in the provided inputs and show it if true", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.form.controls["createBranch"].value).toEqual(true);
        expect(component.forceShowCreateBranch).toBeTruthy();
      });

      it("should set the create branch value from the provided input and not show it if false", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "createBranch",
              value: false,
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(component.form.controls["createBranch"].value).toEqual(false);
        expect(component.forceShowCreateBranch).toBeFalsy();
      });

      it("should set the create branch flag value from the origin execution when not present in the provided inputs and show it if false", () => {
        const upgradeProcessExecution = getUpgradeProcessExecution();
        upgradeProcessExecution.input.createBranch = false;
        component.initializeForm(projectId, [], upgradeProcessExecution);

        expect(component.form.controls["createBranch"].value).toEqual(false);
        expect(component.forceShowCreateBranch).toBeTruthy();
      });

      it("should be backward compatible for definitions saving create branch to true as a string", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "createBranch",
              value: "true",
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(component.form.controls["createBranch"].value).toEqual(true);
      });

      it("should be backward compatible for definitions saving create branch to false as a string", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "createBranch",
              value: "false",
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(component.form.controls["createBranch"].value).toEqual(false);
      });

      it("should set the configuration branch name value from the provided input and not show it", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "configurationBranchName",
              value: "prefilledConfigurationBranchName",
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(
          component.form.controls["configurationBranchName"].value
        ).toEqual("prefilledConfigurationBranchName");
        expect(component.forceShowConfigurationBranchName).toBeFalsy();
      });

      it("should set the configuration branch name value from the origin execution when not present in the provided inputs and show it", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["configurationBranchName"].value
        ).toEqual("configurationBranchName");
        expect(component.forceShowConfigurationBranchName).toBeTruthy();
      });

      it("should set the configuration parent branch value from the provided input and not show it", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "configurationParentBranch",
              value: "prefilledConfigurationParentBranch",
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(
          component.form.controls["configurationParentBranch"].value
        ).toEqual("prefilledConfigurationParentBranch");
        expect(component.forceShowConfigurationParentBranch).toBeFalsy();
      });

      it("should set the configuration parent branch value from the origin execution when not present in the provided inputs and show it", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["configurationParentBranch"].value
        ).toEqual("configurationParentBranch");
        expect(component.forceShowConfigurationParentBranch).toBeTruthy();
      });

      it("should set the quality gate execution infra group id value from the provided input and not show it", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "qualityGateExecutionInfraGroupId",
              value: "prefilledQualityGateExecutionInfraGroupId",
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(
          component.form.controls["qualityGateExecutionInfraGroupId"].value
        ).toEqual("prefilledQualityGateExecutionInfraGroupId");
        expect(component.forceShowQualityGateExecutionInfraGroupId).toBeFalsy();
      });

      it("should set the quality gate execution infra group id value from the origin execution when not present in the provided inputs and show it", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["qualityGateExecutionInfraGroupId"].value
        ).toEqual("qualityGateExecutionInfraGroupId");
        expect(
          component.forceShowQualityGateExecutionInfraGroupId
        ).toBeTruthy();
      });

      it("should set the binary conversion infra group id value from the provided input and not show it", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "binaryConversionInfraGroupId",
              value: "prefilledBinaryConversionInfraGroupId",
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(
          component.form.controls["binaryConversionInfraGroupId"].value
        ).toEqual("prefilledBinaryConversionInfraGroupId");
        expect(component.forceShowBinaryConversionInfraGroupId).toBeFalsy();
      });

      it("should set the binary conversion infra group id value from the origin execution when not present in the provided inputs and show it", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["binaryConversionInfraGroupId"].value
        ).toEqual("binaryConversionInfraGroupId");
        expect(component.forceShowBinaryConversionInfraGroupId).toBeTruthy();
      });

      it("should set the technical upgrade test scenario id value from the provided input and not show it", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "technicalUpgradeTestScenarioId",
              value: "prefilledBinaryConversionScenarioDefinitionId",
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(
          component.form.controls["technicalUpgradeTestScenarioId"].value
        ).toEqual("prefilledBinaryConversionScenarioDefinitionId");
        expect(component.forceShowTechnicalUpgradeTestScenarioId).toBeFalsy();
      });

      it("should set the technical upgrade test scenario id value from the origin execution when not present in the provided inputs and show it", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["technicalUpgradeTestScenarioId"].value
        ).toEqual("binaryConversionTestScenarioId");
        expect(component.forceShowTechnicalUpgradeTestScenarioId).toBeTruthy();
      });

      it("should set the test scenario ids value from the provided input and not show it", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "testScenarioIds",
              value: ["prefilledScenarioId1", "prefilledScenarioId2"],
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(component.form.controls["testScenarioIds"].value).toEqual([
          "prefilledScenarioId1",
          "prefilledScenarioId2",
        ]);
        expect(component.forceShowQualityGateTestScenarioIds).toBeFalsy();
      });

      it("should set the test scenario ids value from the origin execution when not present in the provided inputs and show it", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.form.controls["testScenarioIds"].value).toEqual([
          "scenarioId1",
          "scenarioId2",
        ]);
        expect(component.forceShowQualityGateTestScenarioIds).toBeTruthy();
      });

      it("should set the reference factory product value from the provided input and not show it", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "referenceFactoryProduct",
              value: {
                id: "prefilledReferenceFactoryProductId",
                mxVersion: "prefilledReferenceMxVersion",
                mxBuildId: "prefilledReferenceMxBuildId",
                bipVersion: "prefilledReferenceBipVersion",
                bipBuildId: "prefilledReferenceBipBuildId",
              },
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(
          component.form.controls["referenceFactoryProduct"].value
        ).toEqual({
          id: "prefilledReferenceFactoryProductId",
          mxVersion: "prefilledReferenceMxVersion",
          mxBuildId: "prefilledReferenceMxBuildId",
          bipVersion: "prefilledReferenceBipVersion",
          bipBuildId: "prefilledReferenceBipBuildId",
        });
        expect(component.forceShowReferenceFactoryProduct).toBeFalsy();
      });

      it("should set the reference factory product value from the origin execution when not present in the provided inputs and show it", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["referenceFactoryProduct"].value
        ).toEqual({
          id: "referenceFactoryProductId",
          mxVersion: "referenceMxVersion",
          mxBuildId: "referenceMxBuildId",
          bipVersion: "referenceBipVersion",
          bipBuildId: "referenceBipBuildId",
        });
        expect(component.forceShowReferenceFactoryProduct).toBeTruthy();
      });

      it("should set the reference factory product value from the origin execution when provided input is missing factory product id", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "referenceFactoryProduct",
              value: {
                mxVersion: "prefilledReferenceMxVersion",
                mxBuildId: "prefilledReferenceMxBuildId",
                bipVersion: "prefilledReferenceBipVersion",
                bipBuildId: "prefilledReferenceBipBuildId",
              },
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(
          component.form.controls["referenceFactoryProduct"].value
        ).toEqual({
          id: "referenceFactoryProductId",
          mxVersion: "referenceMxVersion",
          mxBuildId: "referenceMxBuildId",
          bipVersion: "referenceBipVersion",
          bipBuildId: "referenceBipBuildId",
        });
        expect(component.forceShowReferenceFactoryProduct).toBeTruthy();
      });

      it("should set the reference commit id value from the provided input and not show it", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "referenceCommitId",
              value: "prefilledReferenceCommitId",
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(component.form.controls["referenceCommitId"].value).toEqual(
          "prefilledReferenceCommitId"
        );
        expect(component.forceShowReferenceCommitId).toBeFalsy();
      });

      it("should set the reference commit id value from the origin execution when not present in the provided inputs and show it", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.form.controls["referenceCommitId"].value).toEqual(
          "referenceCommitId"
        );
        expect(component.forceShowReferenceCommitId).toBeTruthy();
      });

      it("should set the reference environment definition id value from the provided input and not show it", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "referenceEnvironmentDefinitionId",
              value: "prefilledReferenceEnvironmentDefinitionId",
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(
          component.form.controls["referenceEnvironmentDefinitionId"].value
        ).toEqual("prefilledReferenceEnvironmentDefinitionId");
        expect(component.forceShowReferenceEnvironmentDefinitionId).toBeFalsy();
      });

      it("should set the reference environment definition id value from the origin execution when not present in the provided inputs and show it", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["referenceEnvironmentDefinitionId"].value
        ).toEqual("referenceEnvironmentDefinitionId");
        expect(
          component.forceShowReferenceEnvironmentDefinitionId
        ).toBeTruthy();
      });

      it("should set the reference environment infra group id value from the provided input and not show it", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "referenceEnvironmentInfraGroupId",
              value: "prefilledReferenceEnvironmentInfraGroupId",
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(
          component.form.controls["referenceEnvironmentInfraGroupId"].value
        ).toEqual("prefilledReferenceEnvironmentInfraGroupId");
        expect(component.forceShowReferenceEnvironmentInfraGroupId).toBeFalsy();
      });

      it("should set the reference environment infra group id value from the origin execution when not present in the provided inputs and show it", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["referenceEnvironmentInfraGroupId"].value
        ).toEqual("referenceEnvironmentInfraGroupId");
        expect(
          component.forceShowReferenceEnvironmentInfraGroupId
        ).toBeTruthy();
      });

      it("should set the notifications recipients value from the definition input when it is present and not show it", () => {
        component.initializeForm(
          projectId,
          [
            {
              inputId: "notificationsRecipients",
              value: ["prefilledRecipient1", "prefilledRecipient2"],
            },
          ],
          getUpgradeProcessExecution()
        );

        expect(
          component.form.controls["notificationsRecipients"].value
        ).toEqual(["prefilledRecipient1", "prefilledRecipient2"]);
        expect(component.forceShowNotificationsRecipients).toBeFalsy();
      });

      it("should set the notifications recipients value from the origin execution when not present in the definition inputs show it", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["notificationsRecipients"].value
        ).toEqual(["recipient1", "recipient2"]);
        expect(component.forceShowNotificationsRecipients).toBeTruthy();
      });
    });

    describe("Validators", () => {
      it("should validate that name exists", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["name"].hasValidator(Validators.required)
        ).toBeTruthy();
      });

      it("should validate that name is not blank", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["name"].hasValidator(
            WhitespaceValidators.notBlank()
          )
        ).toBeTruthy();
      });

      it("should validate that official flag exists", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["official"].hasValidator(Validators.required)
        ).toBeTruthy();
      });

      it("should validate that factory product does not have missing attributes", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["factoryProduct"].hasValidator(
            FactoryProductValidator.factoryProductAttributes()
          )
        ).toBeTruthy();
      });

      it("should validate that parent mx archival branch name exists", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["parentMxArchivalBranch"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that parent mx archival branch name is not blank", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["parentMxArchivalBranch"].hasValidator(
            WhitespaceValidators.notBlank()
          )
        ).toBeTruthy();
      });

      it("should validate that parent mx archival branch name is does not contain whitespaces", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["parentMxArchivalBranch"].hasValidator(
            WhitespaceValidators.noWhitespaces()
          )
        ).toBeTruthy();
      });

      it("should validate the upgrade jump exist", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["upgradeJump"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that repository id exists", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["repositoryId"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that business process quality level exists", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["businessProcessQualityLevel"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that create branch exists", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["createBranch"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that configuration branch name exists", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["configurationBranchName"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that configuration parent branch exists", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["configurationParentBranch"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that quality gate execution infra group id exists", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls[
            "qualityGateExecutionInfraGroupId"
          ].hasValidator(Validators.required)
        ).toBeTruthy();
      });

      it("should validate that binary conversion infra group id exists", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["binaryConversionInfraGroupId"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that test scenario ids exists", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["testScenarioIds"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that test scenario ids is a list containing at least one element", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["testScenarioIds"].hasValidator(
            DefinitionInputsValidators.arrayLengthValidator
          )
        ).toBeTruthy();
      });

      it("should validate that technical upgrade test scenario id exists", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls[
            "technicalUpgradeTestScenarioId"
          ].hasValidator(Validators.required)
        ).toBeTruthy();
      });

      it("should validate that reference factory product exists", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["referenceFactoryProduct"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that reference factory product does not have missing attributes", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["referenceFactoryProduct"].hasValidator(
            FactoryProductValidator.factoryProductAttributes()
          )
        ).toBeTruthy();
      });

      it("should validate that reference commit id exists", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["referenceCommitId"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that reference commit id is not blank", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["referenceCommitId"].hasValidator(
            WhitespaceValidators.notBlank()
          )
        ).toBeTruthy();
      });

      it("should validate that reference commit id does not contain whitespaces", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls["referenceCommitId"].hasValidator(
            WhitespaceValidators.noWhitespaces()
          )
        ).toBeTruthy();
      });

      it("should validate that reference environment definition id exists", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls[
            "referenceEnvironmentDefinitionId"
          ].hasValidator(Validators.required)
        ).toBeTruthy();
      });

      it("should validate that reference environment infra group id exists", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(
          component.form.controls[
            "referenceEnvironmentInfraGroupId"
          ].hasValidator(Validators.required)
        ).toBeTruthy();
      });
    });

    describe("Form Control Grouping", () => {
      it("Mx Parameters should contain factory product form control", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.mxParametersFormControls).toContain(
          component.form.controls["factoryProduct"]
        );
      });

      it("should force show mx parameters when factory product is not present in provided inputs", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.forceShowMxParameters).toBeTruthy();
      });

      it("Mx Parameters should contain parent mx archival branch name form control", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());
        expect(component.mxParametersFormControls).toContain(
          component.form.controls["parentMxArchivalBranch"]
        );
      });

      it("should force show mx parameters when parent mx archival branch name is not present in provided inputs", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.forceShowMxParameters).toBeTruthy();
      });

      it("Mx Parameters should contain upgrade jump form control", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.mxParametersFormControls).toContain(
          component.form.controls["upgradeJump"]
        );
      });

      it("should force show mx parameters when upgrade jump is not present in provided inputs", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.forceShowMxParameters).toBeTruthy();
      });

      it("Configuration Parameters should contain repository id selection", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());
        expect(component.configurationParametersFormControls).toContain(
          component.form.controls["repositoryId"]
        );
      });

      it("Configuration Parameters should contain create branch selection form control", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());
        expect(component.configurationParametersFormControls).toContain(
          component.form.controls["createBranch"]
        );
      });

      it("should force show the configuration parameters when create branch is not present in provided inputs", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.forceShowConfigurationParameters).toBeTruthy();
      });

      it("Configuration Parameters should contain archival branch name form control", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());
        expect(component.configurationParametersFormControls).toContain(
          component.form.controls["configurationBranchName"]
        );
      });

      it("should force show the configuration parameters when archival branch name is not present in the provided inputs", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.forceShowConfigurationParameters).toBeTruthy();
      });

      it("Configuration Parameters should contain parent branch form control", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());
        expect(component.configurationParametersFormControls).toContain(
          component.form.controls["configurationParentBranch"]
        );
      });

      it("should force show configuration parameters when configuration parent branch is not present in provided inputs", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.forceShowConfigurationParameters).toBeTruthy();
      });

      it("Infra Parameters should contain quality gate execution infra group form control", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());
        expect(component.infraParametersFormControls).toContain(
          component.form.controls["qualityGateExecutionInfraGroupId"]
        );
      });

      it("should force show infra parameters when quality gate execution infra group is not present in the provided inputs", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.forceShowInfraParameters).toBeTruthy();
      });

      it("Infra Parameters should contain binary conversion infra group form control", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());
        expect(component.infraParametersFormControls).toContain(
          component.form.controls["binaryConversionInfraGroupId"]
        );
      });

      it("should force show infra parameters when quality gate execution infra group is not present in the provided inputs", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.forceShowInfraParameters).toBeTruthy();
      });

      it("Test Parameters should contain quality gate test scenario ids selection form control", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());
        expect(component.testParametersFormControls).toContain(
          component.form.controls["testScenarioIds"]
        );
      });

      it("should force show test parameters when quality gate test scenario ids is not present in the provided inputs", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.forceShowTestParameters).toBeTruthy();
      });

      it("Test Parameters should contain binary conversion scenario id selection form control", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());
        expect(component.testParametersFormControls).toContain(
          component.form.controls["technicalUpgradeTestScenarioId"]
        );
      });

      it("should force show test parameters when binary conversion scenario id is not preset in the provided inputs", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.forceShowTestParameters).toBeTruthy();
      });

      it("Reference Environment Parameters should contain reference factory product selection form control", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());
        expect(component.referenceEnvironmentParametersFormControls).toContain(
          component.form.controls["referenceFactoryProduct"]
        );
      });

      it("should force show reference environment parameters when reference factory product is not present in the provided inputs", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.forceShowReferenceEnvironmentParameters).toBeTruthy();
      });

      it("Reference Environment Parameters should contain reference environment definition id form control", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());
        expect(component.referenceEnvironmentParametersFormControls).toContain(
          component.form.controls["referenceEnvironmentDefinitionId"]
        );
      });

      it("should force show reference environment parameters when reference environment definition id is not present in the provided inputs", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.forceShowReferenceEnvironmentParameters).toBeTruthy();
      });

      it("Reference Environment Parameters should contain reference environment infra group id form control", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());
        expect(component.referenceEnvironmentParametersFormControls).toContain(
          component.form.controls["referenceEnvironmentInfraGroupId"]
        );
      });

      it("should force show reference environment parameters when reference environment infra group id is not present in the provided inputs", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.forceShowReferenceEnvironmentParameters).toBeTruthy();
      });

      it("Reference Environment Parameters should contain reference environment commit id form control", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());
        expect(component.referenceEnvironmentParametersFormControls).toContain(
          component.form.controls["referenceCommitId"]
        );
      });

      it("should force show reference environment parameters when reference commit id is not present in the provided inputs", () => {
        component.initializeForm(projectId, [], getUpgradeProcessExecution());

        expect(component.forceShowReferenceEnvironmentParameters).toBeTruthy();
      });
    });
  });

  describe("Upon form reset", () => {
    it("should set the is form initialized flag to false", () => {
      component.isFormInitialized = true;
      component.resetForm();

      expect(component.isFormInitialized).toStrictEqual(false);
    });
  });

  function getUpgradeProcessExecution(): UpgradeProcessExecution {
    return {
      id: "id",
      startDate: "startDate",
      endDate: "endDate",
      expiryDate: "expiryDate",
      name: "name",
      projectId: projectId,
      definitionId: "definitionId",
      status: BusinessProcessExecutionStatus.PENDING_INPUT,
      supportsResourceManagement: true,
      notificationsRecipients: ["recipient1", "recipient2"],
      errorMessage: "errorMessage",
      officiality: "OFFICIAL",
      input: {
        factoryProductId: "factoryProductId",
        mxVersion: "mxVersion",
        mxBuildId: "mxBuildId",
        bipVersion: "bipVersion",
        bipBuildId: "bipBuildId",
        parentMxArchivalBranch: "parentMxArchivalBranch",
        upgradeJump: "upgradeJump",
        repositoryId: "repositoryId",
        businessProcessQualityLevel: "businessProcessQualityLevel",
        configurationParentBranch: "configurationParentBranch",
        configurationBranchName: "configurationBranchName",
        createBranch: true,
        qualityGateExecutionInfraGroupId: "qualityGateExecutionInfraGroupId",
        binaryConversionInfraGroupId: "binaryConversionInfraGroupId",
        binaryConversionTestScenarioId: "binaryConversionTestScenarioId",
        testScenarioIds: ["scenarioId1", "scenarioId2"],
        referenceFactoryProductId: "referenceFactoryProductId",
        referenceMxVersion: "referenceMxVersion",
        referenceMxBuildId: "referenceMxBuildId",
        referenceBipVersion: "referenceBipVersion",
        referenceBipBuildId: "referenceBipBuildId",
        referenceCommitId: "referenceCommitId",
        referenceEnvironmentInfraGroupId: "referenceEnvironmentInfraGroupId",
        referenceEnvironmentDefinitionId: "referenceEnvironmentDefinitionId",
      },
      createBranchStage: {
        route: "create-branch",
        name: "createBranchStage",
        status: StageStatus.PASSED,
        startDate: "createBranchStartDate",
        endDate: "createBranchEndDate",
        errorMessage: "createBranchErrorMessage",
        developmentId: "developmentId",
        createBranch: true,
        repositoryId: "repositoryId",
        lastCommitId: "lastCommitId",
      },
      binaryConversionStage: {
        route: "run-technical-upgrade",
        name: "binaryConversionStage",
        status: StageStatus.RUNNING,
        startDate: "binaryConversionStartDate",
        endDate: "binaryConversionEndDate",
        errorMessage: "binaryConversionErrorMessage",
        actionRequester: "binaryConversionActionRequester",
        referenceExecutionId: "referenceExecutionId",
        decision: "binaryConversionDecision",
      },
      executeQualityGateStage: {
        route: "run-rtp",
        name: "executeQualityGateStage",
        status: StageStatus.PENDING_INPUT,
        startDate: "executeQualityGateStartDate",
        endDate: "executeQualityGateEndDate",
        errorMessage: "executeQualityGateErrorMessage",
        validationResult: {
          decision: QualityGateValidationDecision.PASSED,
          comment: "validationResultComment",
          requester: "validationResultRequester",
        },
      },
      tagStage: {
        route: "tag-upgrade-branch",
        name: "tagUpgradeBranchStage",
        status: StageStatus.NOT_STARTED,
        startDate: "tagUpgradeBranchStartDate",
        endDate: "tagUpgradeBranchEndDate",
        errorMessage: "tagUpgradeBranchErrorMessage",
        tagName: "tagName",
        taggedCommitId: "taggedCommitId",
      },
      integrateChangesStage: {
        route: "integrate-fixes",
        name: "integrateChangesStage",
        status: StageStatus.FAILED,
        startDate: "integrateChangesStartDate",
        endDate: "integrateChangesEndDate",
        errorMessage: "integrateChangesErrorMessage",
        requester: "integrateChangesRequester",
        latestMergeJobId: "latestMergeJobId",
      },
      referenceEnvironmentDeployment: {
        projectId: projectId,
        processId: "id",
        supported: true,
        enabledInCurrentlyActiveStage: true,
        limitReached: true,
        canCleanAndDeploy: true,
        referenceEnvironments: ["environmentId1", "environmentId2"],
        requestIds: ["requestId1", "requestId2"],
      },
    };
  }
});
