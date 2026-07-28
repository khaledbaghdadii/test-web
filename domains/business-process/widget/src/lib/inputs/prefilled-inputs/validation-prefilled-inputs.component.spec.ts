import { render, screen, waitFor } from "@testing-library/angular";
import { of } from "rxjs";
import { FinalProductApiService } from "@mxevolve/domains/artifact/data-access";
import { ProvidedInput } from "@mxevolve/domains/business-process/data-access";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import { RepositoryService } from "@mxevolve/domains/scm/data-access";
import { ScenarioDefinitionService } from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { ValidationPrefilledInputsComponent } from "./validation-prefilled-inputs.component";

async function renderComponent(providedInputs: ProvidedInput[]) {
  const rendered = await render(ValidationPrefilledInputsComponent, {
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
        provide: FinalProductApiService,
        useValue: {
          getFinalProductById: (_projectId: string, id: string) =>
            of({ id, tag: id }),
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

describe("ValidationPrefilledInputsComponent", () => {
  it("shows the repository, archival branch and quality level values", async () => {
    await renderComponent([
      { inputId: "repositoryId", value: "core-repo" },
      { inputId: "archivalBranchName", value: "Archival-000001" },
      { inputId: "businessProcessQualityLevel", value: "MQG" },
    ]);

    expect(screen.getByText("Repository")).toBeTruthy();
    expect(screen.getByText("core-repo")).toBeTruthy();
    expect(screen.getByText("Archival Branch")).toBeTruthy();
    expect(screen.getByText("Archival-000001")).toBeTruthy();
    expect(screen.getByText("BP Quality Level")).toBeTruthy();
    expect(screen.getByText("MQG")).toBeTruthy();
  });

  it("shows the commit ids, final product and infra group values", async () => {
    await renderComponent([
      { inputId: "rtpCommitId", value: "rtp-1" },
      { inputId: "configCommitId", value: "config-1" },
      { inputId: "finalProductId", value: "product-1" },
      { inputId: "qualityGateExecutionInfraGroupId", value: "infra-1" },
    ]);

    expect(screen.getByText("RTP Commit")).toBeTruthy();
    expect(screen.getByText("rtp-1")).toBeTruthy();
    expect(screen.getByText("Config Commit")).toBeTruthy();
    expect(screen.getByText("config-1")).toBeTruthy();
    expect(screen.getByText("Final Product")).toBeTruthy();
    expect(screen.getByText("product-1")).toBeTruthy();
    expect(screen.getByText("Quality Gate Execution Infra Group")).toBeTruthy();
    expect(screen.getByText("infra-1")).toBeTruthy();
  });

  it("renders array test-scenario values comma-separated", async () => {
    await renderComponent([
      { inputId: "testScenarioIds", value: ["scenario-1", "scenario-2"] },
    ]);

    expect(screen.getByText("Quality Gate Test Scenarios")).toBeTruthy();
    expect(screen.getByText("scenario-1, scenario-2")).toBeTruthy();
  });

  it("does not show a row for an input with an empty value", async () => {
    await renderComponent([
      { inputId: "repositoryId", value: "core-repo" },
      { inputId: "archivalBranchName", value: "" },
    ]);

    expect(screen.getByText("Repository")).toBeTruthy();
    expect(screen.queryByText("Archival Branch")).toBeNull();
  });

  it("does not show rows for inputs that are not prefilled validation fields", async () => {
    await renderComponent([{ inputId: "someUnknownInput", value: "ignored" }]);

    expect(screen.queryByText("ignored")).toBeNull();
  });
});
