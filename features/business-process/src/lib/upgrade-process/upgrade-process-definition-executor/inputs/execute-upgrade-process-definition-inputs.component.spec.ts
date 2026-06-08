import { Validators } from "@angular/forms";
import { WhitespaceValidators } from "@mxflow/validator";
import { ExecuteUpgradeProcessDefinitionInputsComponent } from "./execute-upgrade-process-definition-inputs.component";
import { v4 as uuidv4 } from "uuid";
import {
  DefinitionInputsValidators,
  FactoryProductValidator,
} from "@mxflow/features/business-process";

describe("Execute upgrade process definition inputs component test", () => {
  const projectId = uuidv4();
  const name = uuidv4();
  const conversionFactoryProductId = uuidv4();
  const conversionMxVersion = uuidv4();
  const conversionMxBuildId = uuidv4();
  const conversionBipVersion = uuidv4();
  const conversionBipBuildId = uuidv4();
  const parentMxArchivalBranch = uuidv4();
  const upgradeJump = uuidv4();
  const repositoryId = uuidv4();
  const businessProcessQualityLevel = "MQG";
  const configurationBranchName = uuidv4();
  const configurationParentBranchName = uuidv4();
  const qualityGateExecutionInfraGroupId = uuidv4();
  const binaryConversionInfraGroupId = uuidv4();
  const binaryConversionScenarioDefinitionId = uuidv4();
  const qualityGateScenarioDefinitionIds = [uuidv4(), uuidv4()];
  const referenceCommitId = uuidv4();
  const referenceFactoryProductId = uuidv4();
  const referenceMxVersion = uuidv4();
  const referenceMxBuildId = uuidv4();
  const referenceBipVersion = uuidv4();
  const referenceBipBuildId = uuidv4();
  const referenceEnvironmentDefinitionId = uuidv4();
  const referenceEnvironmentInfraGroupId = uuidv4();
  const notificationsRecipients = [uuidv4(), uuidv4()];

  let component: ExecuteUpgradeProcessDefinitionInputsComponent;

  beforeEach(() => {
    component = new ExecuteUpgradeProcessDefinitionInputsComponent();
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
      it("should set the factory product value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "factoryProduct",
            value: {
              id: conversionFactoryProductId,
              mxVersion: conversionMxVersion,
              mxBuildId: conversionMxBuildId,
              bipVersion: conversionBipVersion,
              bipBuildId: conversionBipBuildId,
            },
          },
        ]);

        expect(component.form.controls["factoryProduct"].value).toEqual({
          id: conversionFactoryProductId,
          mxVersion: conversionMxVersion,
          mxBuildId: conversionMxBuildId,
          bipVersion: conversionBipVersion,
          bipBuildId: conversionBipBuildId,
        });
      });

      it("should set the parent mx archival branch name value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "parentMxArchivalBranch",
            value: parentMxArchivalBranch,
          },
        ]);

        expect(component.form.controls["parentMxArchivalBranch"].value).toEqual(
          parentMxArchivalBranch
        );
      });

      it("should set the upgrade jump value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "upgradeJump",
            value: upgradeJump,
          },
        ]);

        expect(component.form.controls["upgradeJump"].value).toEqual(
          upgradeJump
        );
      });

      it("should set the repository id value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "repositoryId",
            value: repositoryId,
          },
        ]);

        expect(component.form.controls["repositoryId"].value).toEqual(
          repositoryId
        );
      });

      it("should set the business process quality level value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "businessProcessQualityLevel",
            value: "MQG",
          },
        ]);

        expect(
          component.form.controls["businessProcessQualityLevel"].value
        ).toEqual("MQG");
      });

      it("should set the create branch value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "createBranch",
            value: true,
          },
        ]);

        expect(component.form.controls["createBranch"].value).toEqual(true);
      });

      it("should be backward compatible for definitions saving create branch to true as a string", () => {
        component.initializeForm(projectId, [
          {
            inputId: "createBranch",
            value: "true",
          },
        ]);

        expect(component.form.controls["createBranch"].value).toEqual(true);
      });

      it("should be backward compatible for definitions saving create branch to false as a string", () => {
        component.initializeForm(projectId, [
          {
            inputId: "createBranch",
            value: "false",
          },
        ]);

        expect(component.form.controls["createBranch"].value).toEqual(false);
      });

      it("should set the configuration branch name value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "configurationBranchName",
            value: configurationBranchName,
          },
        ]);

        expect(
          component.form.controls["configurationBranchName"].value
        ).toEqual(configurationBranchName);
      });

      it("should set the configuration parent branch value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "configurationParentBranch",
            value: configurationParentBranchName,
          },
        ]);

        expect(
          component.form.controls["configurationParentBranch"].value
        ).toEqual(configurationParentBranchName);
      });

      it("should set the quality gate execution infra group id value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "qualityGateExecutionInfraGroupId",
            value: qualityGateExecutionInfraGroupId,
          },
        ]);

        expect(
          component.form.controls["qualityGateExecutionInfraGroupId"].value
        ).toEqual(qualityGateExecutionInfraGroupId);
      });

      it("should set the binary conversion infra group id value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "binaryConversionInfraGroupId",
            value: binaryConversionInfraGroupId,
          },
        ]);

        expect(
          component.form.controls["binaryConversionInfraGroupId"].value
        ).toEqual(binaryConversionInfraGroupId);
      });

      it("should set the technical upgrade test scenario id value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "technicalUpgradeTestScenarioId",
            value: binaryConversionScenarioDefinitionId,
          },
        ]);

        expect(
          component.form.controls["technicalUpgradeTestScenarioId"].value
        ).toEqual(binaryConversionScenarioDefinitionId);
      });

      it("should set the test scenario ids value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "testScenarioIds",
            value: qualityGateScenarioDefinitionIds,
          },
        ]);

        expect(component.form.controls["testScenarioIds"].value).toEqual(
          qualityGateScenarioDefinitionIds
        );
      });

      it("should set the reference factory product value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "referenceFactoryProduct",
            value: {
              id: referenceFactoryProductId,
              mxVersion: referenceMxVersion,
              mxBuildId: referenceMxBuildId,
              bipVersion: referenceBipVersion,
              bipBuildId: referenceBipBuildId,
            },
          },
        ]);

        expect(
          component.form.controls["referenceFactoryProduct"].value
        ).toEqual({
          id: referenceFactoryProductId,
          mxVersion: referenceMxVersion,
          mxBuildId: referenceMxBuildId,
          bipVersion: referenceBipVersion,
          bipBuildId: referenceBipBuildId,
        });
      });

      it("should set the reference commit id value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "referenceCommitId",
            value: referenceCommitId,
          },
        ]);

        expect(component.form.controls["referenceCommitId"].value).toEqual(
          referenceCommitId
        );
      });

      it("should set the reference environment definition id value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "referenceEnvironmentDefinitionId",
            value: referenceEnvironmentDefinitionId,
          },
        ]);

        expect(
          component.form.controls["referenceEnvironmentDefinitionId"].value
        ).toEqual(referenceEnvironmentDefinitionId);
      });

      it("should set the reference environment infra group id value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "referenceEnvironmentInfraGroupId",
            value: referenceEnvironmentInfraGroupId,
          },
        ]);

        expect(
          component.form.controls["referenceEnvironmentInfraGroupId"].value
        ).toEqual(referenceEnvironmentInfraGroupId);
      });

      it("should set the notifications recipients value from the provided input", () => {
        component.initializeForm(projectId, [
          {
            inputId: "notificationsRecipients",
            value: ["mail1", "mail2"],
          },
        ]);

        expect(
          component.form.controls["notificationsRecipients"].value
        ).toEqual(["mail1", "mail2"]);
      });
    });

    describe("Validators", () => {
      it("should validate that name exists", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["name"].hasValidator(Validators.required)
        ).toBeTruthy();
      });

      it("should validate that name is not blank", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["name"].hasValidator(
            WhitespaceValidators.notBlank()
          )
        ).toBeTruthy();
      });

      it("should validate that official flag exists", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["official"].hasValidator(Validators.required)
        ).toBeTruthy();
      });

      it("should validate that factory product does not have missing attributes", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["factoryProduct"].hasValidator(
            FactoryProductValidator.factoryProductAttributes()
          )
        ).toBeTruthy();
      });

      it("should validate that parent mx archival branch name exists", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["parentMxArchivalBranch"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that parent mx archival branch name is not blank", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["parentMxArchivalBranch"].hasValidator(
            WhitespaceValidators.notBlank()
          )
        ).toBeTruthy();
      });

      it("should validate that parent mx archival branch name is does not contain whitespaces", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["parentMxArchivalBranch"].hasValidator(
            WhitespaceValidators.noWhitespaces()
          )
        ).toBeTruthy();
      });

      it("should validate that upgrade jump exists", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["upgradeJump"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that repository id exists", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["repositoryId"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that business process quality level exists", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["businessProcessQualityLevel"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that create branch exists", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["createBranch"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that configuration branch name exists", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["configurationBranchName"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that configuration parent branch exists", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["configurationParentBranch"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that quality gate execution infra group id exists", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls[
            "qualityGateExecutionInfraGroupId"
          ].hasValidator(Validators.required)
        ).toBeTruthy();
      });

      it("should validate that binary conversion infra group id exists", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["binaryConversionInfraGroupId"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that test scenario ids exists", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["testScenarioIds"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that test scenario ids is a list containing at least one element", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["testScenarioIds"].hasValidator(
            DefinitionInputsValidators.arrayLengthValidator
          )
        ).toBeTruthy();
      });

      it("should validate that technical upgrade test scenario id exists", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls[
            "technicalUpgradeTestScenarioId"
          ].hasValidator(Validators.required)
        ).toBeTruthy();
      });

      it("should validate that reference factory product exists", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["referenceFactoryProduct"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that reference factory product does not have missing attributes", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["referenceFactoryProduct"].hasValidator(
            FactoryProductValidator.factoryProductAttributes()
          )
        ).toBeTruthy();
      });

      it("should validate that reference commit id exists", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["referenceCommitId"].hasValidator(
            Validators.required
          )
        ).toBeTruthy();
      });

      it("should validate that reference commit id is not blank", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["referenceCommitId"].hasValidator(
            WhitespaceValidators.notBlank()
          )
        ).toBeTruthy();
      });

      it("should validate that reference commit id does not contain whitespaces", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls["referenceCommitId"].hasValidator(
            WhitespaceValidators.noWhitespaces()
          )
        ).toBeTruthy();
      });

      it("should validate that reference environment definition id exists", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls[
            "referenceEnvironmentDefinitionId"
          ].hasValidator(Validators.required)
        ).toBeTruthy();
      });

      it("should validate that reference environment infra group id exists", () => {
        component.initializeForm(projectId, []);

        expect(
          component.form.controls[
            "referenceEnvironmentInfraGroupId"
          ].hasValidator(Validators.required)
        ).toBeTruthy();
      });
    });

    describe("Form Control Grouping", () => {
      it("Mx Parameters should contain factory product form control", () => {
        component.initializeForm(projectId, []);

        expect(component.mxParametersFormControls).toContain(
          component.form.controls["factoryProduct"]
        );
      });

      it("Mx Parameters should contain parent mx archival branch name form control", () => {
        component.initializeForm(projectId, []);
        expect(component.mxParametersFormControls).toContain(
          component.form.controls["parentMxArchivalBranch"]
        );
      });

      it("Mx Parameters should contain upgrade jump form control", () => {
        component.initializeForm(projectId, []);
        expect(component.mxParametersFormControls).toContain(
          component.form.controls["upgradeJump"]
        );
      });

      it("Configuration Parameters should contain repository id selection", () => {
        component.initializeForm(projectId, []);
        expect(component.configurationParametersFormControls).toContain(
          component.form.controls["repositoryId"]
        );
      });

      it("Configuration Parameters should contain create branch selection form control", () => {
        component.initializeForm(projectId, []);
        expect(component.configurationParametersFormControls).toContain(
          component.form.controls["createBranch"]
        );
      });

      it("Configuration Parameters should contain archival branch name form control", () => {
        component.initializeForm(projectId, []);
        expect(component.configurationParametersFormControls).toContain(
          component.form.controls["configurationBranchName"]
        );
      });

      it("Configuration Parameters should contain parent branch form control", () => {
        component.initializeForm(projectId, []);
        expect(component.configurationParametersFormControls).toContain(
          component.form.controls["configurationParentBranch"]
        );
      });

      it("Infra Parameters should contain quality gate execution infra group form control", () => {
        component.initializeForm(projectId, []);
        expect(component.infraParametersFormControls).toContain(
          component.form.controls["qualityGateExecutionInfraGroupId"]
        );
      });

      it("Infra Parameters should contain binary conversion infra group form control", () => {
        component.initializeForm(projectId, []);
        expect(component.infraParametersFormControls).toContain(
          component.form.controls["binaryConversionInfraGroupId"]
        );
      });

      it("Test Parameters should contain quality gate test scenario ids selection form control", () => {
        component.initializeForm(projectId, []);
        expect(component.testParametersFormControls).toContain(
          component.form.controls["testScenarioIds"]
        );
      });

      it("Test Parameters should contain binary conversion scenario id selection form control", () => {
        component.initializeForm(projectId, []);
        expect(component.testParametersFormControls).toContain(
          component.form.controls["technicalUpgradeTestScenarioId"]
        );
      });

      it("Reference Environment Parameters should contain reference factory product selection form control", () => {
        component.initializeForm(projectId, []);
        expect(component.referenceEnvironmentParametersFormControls).toContain(
          component.form.controls["referenceFactoryProduct"]
        );
      });

      it("Reference Environment Parameters should contain reference environment definition id form control", () => {
        component.initializeForm(projectId, []);
        expect(component.referenceEnvironmentParametersFormControls).toContain(
          component.form.controls["referenceEnvironmentDefinitionId"]
        );
      });

      it("Reference Environment Parameters should contain reference environment infra group id form control", () => {
        component.initializeForm(projectId, []);
        expect(component.referenceEnvironmentParametersFormControls).toContain(
          component.form.controls["referenceEnvironmentInfraGroupId"]
        );
      });

      it("Reference Environment Parameters should contain reference environment commit id form control", () => {
        component.initializeForm(projectId, []);
        expect(component.referenceEnvironmentParametersFormControls).toContain(
          component.form.controls["referenceCommitId"]
        );
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

  describe("Get Execute Upgrade Process Definition Inputs", () => {
    beforeEach(() => {
      component.initializeForm(projectId, getAllProvidedInputs());
      component.form.controls["name"].setValue(name);
      component.form.controls["official"].setValue(true);
    });

    it("should return the correct name", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.name).toStrictEqual(name);
    });

    it("should return the correct official flag", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.official).toStrictEqual(true);
    });

    it("should return the correct factory product", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.factoryProduct).toStrictEqual({
        id: conversionFactoryProductId,
        mxVersion: conversionMxVersion,
        mxBuildId: conversionMxBuildId,
        bipVersion: conversionBipVersion,
        bipBuildId: conversionBipBuildId,
      });
    });

    it("should return the correct parent mx archival branch", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.parentMxArchivalBranch).toStrictEqual(
        parentMxArchivalBranch
      );
    });

    it("should return the correct upgrade type", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.upgradeJump).toStrictEqual(upgradeJump);
    });

    it("should return the correct repository id", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.repositoryId).toStrictEqual(repositoryId);
    });

    it("should return the correct business process quality level", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.businessProcessQualityLevel).toStrictEqual(
        businessProcessQualityLevel
      );
    });

    it("should return the correct create branch value", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.createBranch).toStrictEqual(true);
    });

    it("should return the correct configuration branch name", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.configurationBranchName).toStrictEqual(
        configurationBranchName
      );
    });

    it("should return the correct configuration parent branch", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.configurationParentBranch).toStrictEqual(
        configurationParentBranchName
      );
    });

    it("should return the correct quality gate execution infra group id", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.qualityGateExecutionInfraGroupId).toStrictEqual(
        qualityGateExecutionInfraGroupId
      );
    });

    it("should return the correct binary conversion infra group id", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.binaryConversionInfraGroupId).toStrictEqual(
        binaryConversionInfraGroupId
      );
    });

    it("should return the correct test scenario ids", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.testScenarioIds).toStrictEqual(
        qualityGateScenarioDefinitionIds
      );
    });

    it("should return the correct technical upgrade test scenario id", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.technicalUpgradeTestScenarioId).toStrictEqual(
        binaryConversionScenarioDefinitionId
      );
    });

    it("should return the correct reference factory product", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.referenceFactoryProduct).toStrictEqual({
        id: referenceFactoryProductId,
        mxVersion: referenceMxVersion,
        mxBuildId: referenceMxBuildId,
        bipVersion: referenceBipVersion,
        bipBuildId: referenceBipBuildId,
      });
    });

    it("should return the correct reference commit id", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.referenceCommitId).toStrictEqual(referenceCommitId);
    });

    it("should return the correct reference environment definition id", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.referenceEnvironmentDefinitionId).toStrictEqual(
        referenceEnvironmentDefinitionId
      );
    });

    it("should return the correct reference environment infra group id", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.referenceEnvironmentInfraGroupId).toStrictEqual(
        referenceEnvironmentInfraGroupId
      );
    });

    it("should return the correct notifications recipients", () => {
      const inputs = component.getExecuteUpgradeProcessDefinitionInputs();
      expect(inputs.notificationsRecipients).toStrictEqual(
        notificationsRecipients
      );
    });
  });

  function getAllProvidedInputs() {
    return [
      {
        inputId: "factoryProduct",
        value: {
          id: conversionFactoryProductId,
          mxVersion: conversionMxVersion,
          mxBuildId: conversionMxBuildId,
          bipVersion: conversionBipVersion,
          bipBuildId: conversionBipBuildId,
        },
      },
      { inputId: "parentMxArchivalBranch", value: parentMxArchivalBranch },
      { inputId: "repositoryId", value: repositoryId },
      {
        inputId: "businessProcessQualityLevel",
        value: businessProcessQualityLevel,
      },
      { inputId: "createBranch", value: true },
      { inputId: "configurationBranchName", value: configurationBranchName },
      {
        inputId: "configurationParentBranch",
        value: configurationParentBranchName,
      },
      {
        inputId: "qualityGateExecutionInfraGroupId",
        value: qualityGateExecutionInfraGroupId,
      },
      {
        inputId: "binaryConversionInfraGroupId",
        value: binaryConversionInfraGroupId,
      },
      { inputId: "testScenarioIds", value: qualityGateScenarioDefinitionIds },
      {
        inputId: "technicalUpgradeTestScenarioId",
        value: binaryConversionScenarioDefinitionId,
      },
      {
        inputId: "referenceFactoryProduct",
        value: {
          id: referenceFactoryProductId,
          mxVersion: referenceMxVersion,
          mxBuildId: referenceMxBuildId,
          bipVersion: referenceBipVersion,
          bipBuildId: referenceBipBuildId,
        },
      },
      { inputId: "referenceCommitId", value: referenceCommitId },
      {
        inputId: "referenceEnvironmentDefinitionId",
        value: referenceEnvironmentDefinitionId,
      },
      {
        inputId: "referenceEnvironmentInfraGroupId",
        value: referenceEnvironmentInfraGroupId,
      },
      {
        inputId: "upgradeJump",
        value: upgradeJump,
      },
      {
        inputId: "notificationsRecipients",
        value: notificationsRecipients,
      },
    ];
  }
});
