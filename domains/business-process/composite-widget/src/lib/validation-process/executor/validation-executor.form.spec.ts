import type {
  ProvidedInput,
  ValidationProcessExecution,
} from "@mxevolve/domains/business-process/data-access";
import {
  buildValidationExecutorForm,
  toValidationExecutorSeed,
} from "./validation-executor.form";

const PROVIDED_INPUTS: ProvidedInput[] = [
  { inputId: "notificationsRecipients", value: ["user@example.com"] },
  { inputId: "qualityGateExecutionInfraGroupId", value: "quality-infra" },
  { inputId: "testScenarioIds", value: ["scenario-1"] },
  { inputId: "nightlyRepusherEnabled", value: true },
  { inputId: "repositoryId", value: "repo-1" },
  { inputId: "createBranch", value: "false" },
  { inputId: "archivalBranchName", value: "archival-main" },
  { inputId: "parentBranch", value: "parent-main" },
  { inputId: "businessProcessQualityLevel", value: "MQG" },
  { inputId: "finalProductId", value: "product-1" },
  { inputId: "configCommitId", value: "config-1" },
  { inputId: "rtpCommitId", value: "rtp-1" },
];

describe("buildValidationExecutorForm", () => {
  it("seeds every definition-provided value and accepts a completed form", () => {
    const form = buildValidationExecutorForm(PROVIDED_INPUTS);

    form.controls.name.setValue("Validation run");
    form.controls.official.setValue(true);

    expect(form.controls.qualityGateInfraGroupId.value).toBe("quality-infra");
    expect(form.controls.qualityGateScenarioDefinitionIds.value).toEqual([
      "scenario-1",
    ]);
    expect(form.controls.createBranch.value).toBe(false);
    expect(form.controls.parentBranchName.value).toBe("parent-main");
    expect(form.controls.notificationsRecipients.value).toEqual([
      "user@example.com",
    ]);
    expect(form.valid).toBe(true);
  });

  it("maps boolean and string true create-branch values and rejects unknown values", () => {
    expect(
      buildValidationExecutorForm([{ inputId: "createBranch", value: true }])
        .controls.createBranch.value
    ).toBe(true);
    expect(
      buildValidationExecutorForm([{ inputId: "createBranch", value: "true" }])
        .controls.createBranch.value
    ).toBe(true);

    const form = buildValidationExecutorForm([
      { inputId: "createBranch", value: "unexpected" },
    ]);
    expect(form.controls.createBranch.value).toBeNull();
    expect(form.controls.createBranch.errors).toEqual({ required: true });
  });

  it("enforces required selectables, non-blank names, and scenario selection", () => {
    const form = buildValidationExecutorForm([
      { inputId: "testScenarioIds", value: [] },
      { inputId: "archivalBranchName", value: "" },
    ]);

    form.controls.name.setValue("   ");

    expect(form.controls.name.errors).toEqual({ whitespace: true });
    expect(form.controls.archivalBranchName.errors).toEqual({ required: true });
    expect(form.controls.qualityGateScenarioDefinitionIds.errors).toEqual({
      required: true,
    });
    expect(form.controls.validationScopeStartCommitId.errors).toBeNull();
  });
});

describe("toValidationExecutorSeed", () => {
  it("maps a persisted validation execution into editable executor values", () => {
    const seed = toValidationExecutorSeed({
      name: "Repushed validation",
      officiality: "OFFICIAL",
      notificationsRecipients: ["owner@example.com"],
      input: {
        qualityGateExecutionInfraGroupId: "quality-infra",
        scenarioDefinitionIds: ["scenario-1"],
        nightlyRepusherEnabled: true,
        repositoryId: "repo-1",
        createBranch: false,
        archivalBranchName: "archival-main",
        parentBranch: "parent-main",
        businessProcessQualityLevel: "MQG",
        finalProductId: "product-1",
        configCommitId: "config-1",
        rtpCommitId: "rtp-1",
        validationScopeStartCommitId: "start-commit",
      },
    } as ValidationProcessExecution);

    expect(seed).toEqual({
      name: "Repushed validation",
      official: true,
      notificationsRecipients: ["owner@example.com"],
      qualityGateInfraGroupId: "quality-infra",
      qualityGateScenarioDefinitionIds: ["scenario-1"],
      nightlyRepusherEnabled: true,
      repositoryId: "repo-1",
      createBranch: false,
      archivalBranchName: "archival-main",
      parentBranchName: "parent-main",
      businessProcessQualityLevel: "MQG",
      finalProductId: "product-1",
      configCommitId: "config-1",
      rtpCommitId: "rtp-1",
      validationScopeStartCommitId: "start-commit",
    });
  });

  it("defaults unavailable inputs and the validation scope start commit", () => {
    const seed = toValidationExecutorSeed({
      name: "Unseeded validation",
      officiality: "UNOFFICIAL",
    } as ValidationProcessExecution);

    expect(seed.official).toBe(false);
    expect(seed.repositoryId).toBeUndefined();
    expect(seed.validationScopeStartCommitId).toBeNull();
  });
});
