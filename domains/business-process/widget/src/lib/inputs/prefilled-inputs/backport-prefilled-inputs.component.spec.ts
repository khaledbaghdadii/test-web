import { render, screen, waitFor } from "@testing-library/angular";
import { of } from "rxjs";
import { ProvidedInput } from "@mxevolve/domains/business-process/data-access";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import {
  MergeConfigurationService,
  RepositoryService,
} from "@mxevolve/domains/scm/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { BackportPrefilledInputsComponent } from "./backport-prefilled-inputs.component";

const PROJECT_ID = "project-1";

async function renderComponent(providedInputs: ProvidedInput[]) {
  const rendered = await render(BackportPrefilledInputsComponent, {
    inputs: { projectId: PROJECT_ID, providedInputs },
    componentProviders: [
      {
        provide: RepositoryService,
        useValue: {
          getRepository: (projectId: string, id: string) =>
            of({ id, name: `${projectId}/${id}` }),
        },
      },
      {
        provide: InfraGroupService,
        useValue: {
          getGroup: (projectId: string, id: string) =>
            of({ id, name: `${projectId}/${id}` }),
        },
      },
      {
        provide: MergeConfigurationService,
        useValue: {
          getFilteredMergeConfigurations: (
            projectId: string,
            repositoryId: string,
            phrase: string,
            page: number,
            pageSize: number
          ) =>
            of({
              content:
                projectId === PROJECT_ID &&
                repositoryId === "core-repo" &&
                phrase === "" &&
                page === 0 &&
                pageSize === 100
                  ? [{ id: "merge-cfg-1", branchName: "main" }]
                  : [],
            }),
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

describe("BackportPrefilledInputsComponent", () => {
  it("shows the repository value under the Repository label", async () => {
    await renderComponent([{ inputId: "repositoryId", value: "core-repo" }]);

    expect(screen.getByText("Repository")).toBeTruthy();
    expect(screen.getByText("project-1/core-repo")).toBeTruthy();
  });

  it("shows the destination merge configuration and infra group", async () => {
    await renderComponent([
      { inputId: "repositoryId", value: "core-repo" },
      { inputId: "mergeConfigurationId", value: "merge-cfg-1" },
      { inputId: "buildAndTestInfraGroup", value: "bt-group" },
    ]);

    expect(screen.getByText("Destination Merge Configuration")).toBeTruthy();
    expect(screen.getByText("main")).toBeTruthy();
    expect(screen.getByText("Build and Test Infra Group")).toBeTruthy();
    expect(screen.getByText("project-1/bt-group")).toBeTruthy();
  });

  it("does not show a row for an input with an empty value", async () => {
    await renderComponent([
      { inputId: "repositoryId", value: "core-repo" },
      { inputId: "mergeConfigurationId", value: "" },
    ]);

    expect(screen.getByText("Repository")).toBeTruthy();
    expect(screen.queryByText("Destination Merge Configuration")).toBeNull();
  });

  it("does not show Build & Test-only fields that are not part of backport", async () => {
    await renderComponent([
      { inputId: "configurationBranchName", value: "Branch-000001" },
    ]);

    expect(screen.queryByText("Configuration Branch")).toBeNull();
  });
});
