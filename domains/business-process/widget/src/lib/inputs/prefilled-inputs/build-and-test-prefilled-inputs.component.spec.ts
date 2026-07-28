import { render, screen, waitFor } from "@testing-library/angular";
import { of } from "rxjs";
import { ProvidedInput } from "@mxevolve/domains/business-process/data-access";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import { RepositoryService } from "@mxevolve/domains/scm/data-access";
import { ScenarioDefinitionService } from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { BuildAndTestPrefilledInputsComponent } from "./build-and-test-prefilled-inputs.component";

async function renderComponent(providedInputs: ProvidedInput[]) {
  const rendered = await render(BuildAndTestPrefilledInputsComponent, {
    inputs: { projectId: "project-1", providedInputs },
    componentProviders: [
      {
        provide: InfraGroupService,
        useValue: {
          getGroup: (projectId: string, id: string) =>
            of({ id, name: `${projectId}-${id}-name` }),
        },
      },
      {
        provide: RepositoryService,
        useValue: {
          getRepository: (projectId: string, id: string) =>
            of({ id, name: `${projectId}-${id}-name` }),
        },
      },
      {
        provide: ScenarioDefinitionService,
        useValue: {
          getScenarioDefinitionById: (id: string, projectId: string) =>
            of({ id, name: `${projectId}-${id}-name` }),
        },
      },
    ],
    providers: [
      {
        provide: ToastMessageService,
        useValue: { showError: jest.fn() },
      },
    ],
  });
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  return rendered;
}

describe("BuildAndTestPrefilledInputsComponent", () => {
  it("shows the repository value under the Repository label", async () => {
    await renderComponent([{ inputId: "repositoryId", value: "core-repo" }]);

    expect(screen.getByText("Repository")).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByText("project-1-core-repo-name")).toBeTruthy()
    );
  });

  it("shows the configuration branch and parent branch values", async () => {
    await renderComponent([
      { inputId: "configurationBranchName", value: "Branch-000001" },
      { inputId: "configurationParentBranch", value: "VAL-123" },
    ]);

    expect(screen.getByText("Configuration Branch")).toBeTruthy();
    expect(screen.getByText("Branch-000001")).toBeTruthy();
    expect(screen.getByText("Configuration Parent Branch")).toBeTruthy();
    expect(screen.getByText("VAL-123")).toBeTruthy();
  });

  it("shows the build scenario and the two infra groups", async () => {
    await renderComponent([
      { inputId: "buildScenarioDefinitionId", value: "scenario-1" },
      { inputId: "buildEnvironmentInfraGroup", value: "env-group" },
      { inputId: "buildAndTestInfraGroup", value: "bt-group" },
    ]);

    expect(screen.getAllByText("Build Scenario")).toHaveLength(2);
    await waitFor(() =>
      expect(screen.getByText("project-1-scenario-1-name")).toBeTruthy()
    );
    expect(screen.getByText("Build Environment Infra Group")).toBeTruthy();
    expect(screen.getByText("project-1-env-group-name")).toBeTruthy();
    expect(screen.getByText("Build and Test Infra Group")).toBeTruthy();
    expect(screen.getByText("project-1-bt-group-name")).toBeTruthy();
  });

  it("does not show a row for an input with an empty value", async () => {
    await renderComponent([
      { inputId: "repositoryId", value: "core-repo" },
      { inputId: "configurationBranchName", value: "" },
    ]);

    expect(screen.getByText("Repository")).toBeTruthy();
    expect(screen.queryByText("Configuration Branch")).toBeNull();
  });

  it("does not show rows for inputs that are not prefilled Build & Test fields", async () => {
    await renderComponent([{ inputId: "someUnknownInput", value: "ignored" }]);

    expect(screen.queryByText("ignored")).toBeNull();
  });
});
