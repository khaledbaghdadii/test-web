import { render, screen, waitFor } from "@testing-library/angular";
import { of } from "rxjs";
import { ProvidedInput } from "@mxevolve/domains/business-process/data-access";
import { EnvironmentDefinitionService } from "@mxevolve/domains/environment/data-access";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import { RepositoryService } from "@mxevolve/domains/scm/data-access";
import { ScenarioDefinitionService } from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { UpgradePrefilledInputsComponent } from "./upgrade-prefilled-inputs.component";

async function renderComponent(providedInputs: ProvidedInput[]) {
  const rendered = await render(UpgradePrefilledInputsComponent, {
    inputs: { providedInputs },
    componentProviders: [
      {
        provide: RepositoryService,
        useValue: {
          getRepository: (_projectId: string, id: string) =>
            of({ id, name: id }),
        },
      },
      {
        provide: InfraGroupService,
        useValue: {
          getGroup: (_projectId: string, id: string) => of({ id, name: id }),
        },
      },
      {
        provide: ScenarioDefinitionService,
        useValue: {
          getScenarioDefinitionById: (id: string) => of({ id, name: id }),
        },
      },
      {
        provide: EnvironmentDefinitionService,
        useValue: {
          getEnvironmentDefinitionById: (_projectId: string, id: string) =>
            of({ id, name: id }),
        },
      },
    ],
    providers: [
      { provide: ToastMessageService, useValue: { showError: jest.fn() } },
    ],
  });
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  return rendered;
}

describe("UpgradePrefilledInputsComponent", () => {
  it("shows the MX, configuration and infrastructure prefilled values", async () => {
    await renderComponent([
      { inputId: "parentMxArchivalBranch", value: "Archival-000001" },
      { inputId: "upgradeJump", value: "MINOR" },
      { inputId: "repositoryId", value: "core-repo" },
      { inputId: "businessProcessQualityLevel", value: "MQG" },
      { inputId: "configurationBranchName", value: "config-branch" },
      { inputId: "qualityGateExecutionInfraGroupId", value: "qg-infra" },
      { inputId: "binaryConversionInfraGroupId", value: "bc-infra" },
    ]);

    expect(screen.getByText("Parent MX Archival Branch")).toBeTruthy();
    expect(screen.getByText("Archival-000001")).toBeTruthy();
    expect(screen.getByText("Upgrade Jump")).toBeTruthy();
    expect(screen.getByText("MINOR")).toBeTruthy();
    expect(screen.getByText("Repository")).toBeTruthy();
    expect(screen.getByText("core-repo")).toBeTruthy();
    expect(screen.getByText("BP Quality Level")).toBeTruthy();
    expect(screen.getByText("Quality Gate Execution Infra Group")).toBeTruthy();
    expect(screen.getByText("qg-infra")).toBeTruthy();
    expect(screen.getByText("Binary Conversion Infra Group")).toBeTruthy();
    expect(screen.getByText("bc-infra")).toBeTruthy();
  });

  it("expands the conversion factory product object into MX and BIP sub-attribute rows", async () => {
    await renderComponent([
      {
        inputId: "factoryProduct",
        value: {
          id: "fp-1",
          mxVersion: "mx-1",
          mxBuildId: "build-1",
          bipVersion: "bip-1",
          bipBuildId: "bip-build-1",
        },
      },
    ]);

    expect(
      screen.getByText("Conversion Factory Product MX Version")
    ).toBeTruthy();
    expect(screen.getByText("mx-1")).toBeTruthy();
    expect(
      screen.getByText("Conversion Factory Product MX Build ID")
    ).toBeTruthy();
    expect(screen.getByText("build-1")).toBeTruthy();
    expect(
      screen.getByText("Conversion Factory Product BIP Version")
    ).toBeTruthy();
    expect(screen.getByText("bip-1")).toBeTruthy();
    expect(
      screen.getByText("Conversion Factory Product BIP Build ID")
    ).toBeTruthy();
    expect(screen.getByText("bip-build-1")).toBeTruthy();
  });

  it("expands the reference factory product and shows the reference-environment inputs", async () => {
    await renderComponent([
      { inputId: "referenceCommitId", value: "ref-commit" },
      { inputId: "referenceEnvironmentDefinitionId", value: "ref-env-def" },
      { inputId: "referenceEnvironmentInfraGroupId", value: "ref-infra" },
      {
        inputId: "referenceFactoryProduct",
        value: {
          id: "ref-fp",
          mxVersion: "ref-mx-1",
          mxBuildId: "ref-build-1",
        },
      },
    ]);

    expect(screen.getByText("Reference Commit ID")).toBeTruthy();
    expect(screen.getByText("ref-commit")).toBeTruthy();
    expect(screen.getByText("Reference Environment Definition")).toBeTruthy();
    expect(screen.getByText("ref-env-def")).toBeTruthy();
    expect(screen.getByText("Reference Environment Infra Group")).toBeTruthy();
    expect(screen.getByText("ref-infra")).toBeTruthy();
    expect(
      screen.getByText("Reference Factory Product MX Version")
    ).toBeTruthy();
    expect(screen.getByText("ref-mx-1")).toBeTruthy();
  });

  it("renders the array test-scenario values comma-separated", async () => {
    await renderComponent([
      { inputId: "testScenarioIds", value: ["scenario-1", "scenario-2"] },
    ]);

    expect(
      screen.getByText("Quality Gate Execution Test Scenarios")
    ).toBeTruthy();
    expect(screen.getByText("scenario-1, scenario-2")).toBeTruthy();
  });

  it("does not show a row for an input with an empty value", async () => {
    await renderComponent([
      { inputId: "repositoryId", value: "core-repo" },
      { inputId: "configurationBranchName", value: "" },
    ]);

    expect(screen.getByText("Repository")).toBeTruthy();
    expect(screen.queryByText("Configuration Branch")).toBeNull();
  });

  it("does not show rows for inputs that are not prefilled upgrade fields", async () => {
    await renderComponent([{ inputId: "someUnknownInput", value: "ignored" }]);

    expect(screen.queryByText("ignored")).toBeNull();
  });
});
