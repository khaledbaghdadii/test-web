import { FormControl } from "@angular/forms";
import type { ProvidedInput } from "@mxevolve/domains/business-process/data-access";
import type { UpgradeProcessExecution } from "@mxevolve/domains/business-process/util";
import {
  buildUpgradeExecutorForm,
  toUpgradeExecutorSeed,
  type UpgradeFactoryProductValue,
} from "./upgrade-executor.form";

const FACTORY_PRODUCT: UpgradeFactoryProductValue = {
  id: "fp-1",
  mxVersion: "mx-1",
  mxBuildId: "build-1",
  bipVersion: "bip-1",
  bipBuildId: "bip-build-1",
};

const PROVIDED_INPUTS: ProvidedInput[] = [
  { inputId: "factoryProduct", value: FACTORY_PRODUCT },
  { inputId: "parentMxArchivalBranch", value: "archival-main" },
  { inputId: "upgradeJump", value: "MINOR" },
  { inputId: "repositoryId", value: "repo-1" },
  { inputId: "businessProcessQualityLevel", value: "MQG" },
  { inputId: "createBranch", value: "true" },
  { inputId: "configurationBranchName", value: "config-main" },
  { inputId: "configurationParentBranch", value: "config-parent" },
  { inputId: "qualityGateExecutionInfraGroupId", value: "quality-infra" },
  { inputId: "binaryConversionInfraGroupId", value: "conversion-infra" },
  { inputId: "testScenarioIds", value: ["scenario-1"] },
  { inputId: "technicalUpgradeTestScenarioId", value: "scenario-2" },
  { inputId: "referenceCommitId", value: "abc123" },
  { inputId: "referenceFactoryProduct", value: FACTORY_PRODUCT },
  { inputId: "referenceEnvironmentDefinitionId", value: "environment-1" },
  { inputId: "referenceEnvironmentInfraGroupId", value: "reference-infra" },
  { inputId: "notificationsRecipients", value: ["user@example.com"] },
];

describe("buildUpgradeExecutorForm", () => {
  it("seeds every definition-provided value and accepts a completed form", () => {
    const form = buildUpgradeExecutorForm(PROVIDED_INPUTS);

    form.controls.name.setValue("Upgrade run");
    form.controls.official.setValue(true);

    expect(form.controls.factoryProduct.value).toEqual(FACTORY_PRODUCT);
    expect(form.controls.createBranch.value).toBe(true);
    expect(form.controls.testScenarioIds.value).toEqual(["scenario-1"]);
    expect(form.controls.notificationsRecipients.value).toEqual([
      "user@example.com",
    ]);
    expect(form.valid).toBe(true);
  });

  it("maps boolean and string false create-branch values and rejects unknown values", () => {
    expect(
      buildUpgradeExecutorForm([{ inputId: "createBranch", value: false }])
        .controls.createBranch.value
    ).toBe(false);
    expect(
      buildUpgradeExecutorForm([{ inputId: "createBranch", value: "false" }])
        .controls.createBranch.value
    ).toBe(false);

    const form = buildUpgradeExecutorForm([
      { inputId: "createBranch", value: "unexpected" },
    ]);
    expect(form.controls.createBranch.value).toBeNull();
    expect(form.controls.createBranch.errors).toEqual({ required: true });
  });

  /**
   * Pins the reason `mapCreateBranchToBoolean` returns `null` rather than
   * legacy's `undefined`: `FormControl` normalises an `undefined` initial value
   * to `null`, so the two are indistinguishable once the control exists. The
   * executor template's `createBranch.value !== null` gate on the branch fields
   * therefore behaves the same either way — a rewrite to `undefined` would be
   * pure noise.
   */
  it("normalises an unanswered create-branch choice to null, as Angular does with undefined", () => {
    const absent = buildUpgradeExecutorForm([
      { inputId: "repositoryId", value: "repo-1" },
    ]);
    expect(absent.controls.createBranch.value).toBeNull();
    expect(new FormControl<boolean | null | undefined>(undefined).value).toBeNull();
  });

  it("enforces non-blank factory products and branch values", () => {
    const form = buildUpgradeExecutorForm([
      { inputId: "factoryProduct", value: {} },
      { inputId: "parentMxArchivalBranch", value: "has space" },
      { inputId: "referenceCommitId", value: "   " },
      { inputId: "testScenarioIds", value: [] },
    ]);

    expect(form.controls.factoryProduct.errors).toEqual({
      missingFactoryProductAttributes: true,
    });
    expect(form.controls.parentMxArchivalBranch.errors).toEqual({
      containsWhitespace: true,
    });
    expect(form.controls.referenceCommitId.errors).toEqual({
      whitespace: true,
      containsWhitespace: true,
    });
    expect(form.controls.testScenarioIds.errors).toEqual({ required: true });
  });
});

describe("toUpgradeExecutorSeed", () => {
  it("maps a persisted upgrade execution into editable executor values", () => {
    const seed = toUpgradeExecutorSeed({
      name: "Repushed upgrade",
      officiality: "official",
      notificationsRecipients: ["owner@example.com"],
      input: {
        factoryProductId: "fp-1",
        mxVersion: "mx-1",
        mxBuildId: "build-1",
        bipVersion: "bip-1",
        bipBuildId: "bip-build-1",
        parentMxArchivalBranch: "archival-main",
        upgradeJump: "MINOR",
        repositoryId: "repo-1",
        businessProcessQualityLevel: "MQG",
        createBranch: true,
        configurationBranchName: "config-main",
        configurationParentBranch: "config-parent",
        qualityGateExecutionInfraGroupId: "quality-infra",
        binaryConversionInfraGroupId: "conversion-infra",
        binaryConversionTestScenarioId: "scenario-2",
      },
    } as UpgradeProcessExecution);

    expect(seed).toEqual({
      name: "Repushed upgrade",
      official: true,
      factoryProduct: FACTORY_PRODUCT,
      parentMxArchivalBranch: "archival-main",
      upgradeJump: "MINOR",
      repositoryId: "repo-1",
      businessProcessQualityLevel: "MQG",
      createBranch: true,
      configurationBranchName: "config-main",
      configurationParentBranch: "config-parent",
      qualityGateExecutionInfraGroupId: "quality-infra",
      binaryConversionInfraGroupId: "conversion-infra",
      technicalUpgradeTestScenarioId: "scenario-2",
      notificationsRecipients: ["owner@example.com"],
    });
  });

  it("leaves unavailable execution input values undefined", () => {
    const seed = toUpgradeExecutorSeed({
      name: "Unseeded upgrade",
      officiality: "unofficial",
    } as UpgradeProcessExecution);

    expect(seed.official).toBe(false);
    expect(seed.factoryProduct).toBeUndefined();
    expect(seed.repositoryId).toBeUndefined();
  });
});
