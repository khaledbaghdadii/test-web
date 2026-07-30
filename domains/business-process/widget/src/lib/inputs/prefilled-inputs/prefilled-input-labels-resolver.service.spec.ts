import { TestBed } from "@angular/core/testing";
import { lastValueFrom, of, throwError } from "rxjs";
import { FinalProductApiService } from "@mxevolve/domains/artifact/data-access";
import { ProvidedInput } from "@mxevolve/domains/business-process/data-access";
import { EnvironmentDefinitionService } from "@mxevolve/domains/environment/data-access";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import {
  MergeConfigurationService,
  RepositoryService,
} from "@mxevolve/domains/scm/data-access";
import { ScenarioDefinitionService } from "@mxevolve/domains/test/data-access";
import { PrefilledInputLabelsResolverService } from "./prefilled-input-labels-resolver.service";

const mockInfraGroupsService = {
  getGroup: jest.fn(),
};
const mockRepositoryService = {
  getRepository: jest.fn(),
};
const mockScenarioDefinitionService = {
  getScenarioDefinitionById: jest.fn(),
};
const mockEnvironmentDefinitionService = {
  getEnvironmentDefinitionById: jest.fn(),
};
const mockFinalProductService = {
  getFinalProductById: jest.fn(),
};
const mockMergeConfigurationService = {
  getFilteredMergeConfigurations: jest.fn(),
};

const PROVIDERS = [
  PrefilledInputLabelsResolverService,
  { provide: InfraGroupService, useValue: mockInfraGroupsService },
  { provide: RepositoryService, useValue: mockRepositoryService },
  {
    provide: ScenarioDefinitionService,
    useValue: mockScenarioDefinitionService,
  },
  {
    provide: EnvironmentDefinitionService,
    useValue: mockEnvironmentDefinitionService,
  },
  { provide: FinalProductApiService, useValue: mockFinalProductService },
  {
    provide: MergeConfigurationService,
    useValue: mockMergeConfigurationService,
  },
];

function configureDefaultResponses(): void {
  mockInfraGroupsService.getGroup.mockImplementation(
    (_projectId: string, id: string) => of({ id, name: `Group ${id}` })
  );
  mockRepositoryService.getRepository.mockImplementation(
    (_projectId: string, id: string) => of({ id, name: `Repository ${id}` })
  );
  mockScenarioDefinitionService.getScenarioDefinitionById.mockImplementation(
    (id: string) => of({ id, name: `Scenario ${id}` })
  );
  mockEnvironmentDefinitionService.getEnvironmentDefinitionById.mockImplementation(
    (_projectId: string, id: string) => of({ id, name: `Environment ${id}` })
  );
  mockFinalProductService.getFinalProductById.mockImplementation(
    (_projectId: string, id: string) => of({ id, tag: `Product ${id}` })
  );
  mockMergeConfigurationService.getFilteredMergeConfigurations.mockReturnValue(
    of({
      content: [{ id: "merge-1", branchName: "Destination branch" }],
      last: true,
    })
  );
}

describe("PrefilledInputLabelsResolverService", () => {
  let service: PrefilledInputLabelsResolverService;

  beforeEach(() => {
    jest.clearAllMocks();
    configureDefaultResponses();
    TestBed.configureTestingModule({ providers: PROVIDERS });
    service = TestBed.inject(PrefilledInputLabelsResolverService);
  });

  it("resolves all supported reference types into display labels", async () => {
    const providedInputs: ProvidedInput[] = [
      { inputId: "repositoryId", value: "repo-1" },
      { inputId: "buildEnvironmentInfraGroup", value: "infra-1" },
      { inputId: "buildAndTestInfraGroup", value: "infra-1" },
      { inputId: "buildScenarioDefinitionId", value: "scenario-1" },
      { inputId: "testScenarioIds", value: ["scenario-1", "scenario-2"] },
      { inputId: "mergeConfigurationId", value: "merge-1" },
      { inputId: "finalProductId", value: "product-1" },
      { inputId: "referenceEnvironmentDefinitionId", value: "environment-1" },
    ];

    const result = await lastValueFrom(
      service.resolve("project-1", providedInputs)
    );

    expect(result.labels).toEqual(
      new Map([
        ["repositoryId", "Repository repo-1"],
        ["buildEnvironmentInfraGroup", "Group infra-1"],
        ["buildAndTestInfraGroup", "Group infra-1"],
        ["buildScenarioDefinitionId", "Scenario scenario-1"],
        ["testScenarioIds", "Scenario scenario-1, Scenario scenario-2"],
        ["mergeConfigurationId", "Destination branch"],
        ["finalProductId", "Product product-1"],
        ["referenceEnvironmentDefinitionId", "Environment environment-1"],
      ])
    );
    expect(mockInfraGroupsService.getGroup).toHaveBeenCalledTimes(1);
    expect(
      mockScenarioDefinitionService.getScenarioDefinitionById
    ).toHaveBeenCalledWith("scenario-1", "project-1");
    expect(
      mockScenarioDefinitionService.getScenarioDefinitionById
    ).toHaveBeenCalledWith("scenario-2", "project-1");
  });

  it("keeps the raw ID and reports an error when an individual lookup fails", async () => {
    mockRepositoryService.getRepository.mockReturnValue(
      throwError(() => new Error("Repository removed"))
    );

    const result = await lastValueFrom(
      service.resolve("project-1", [
        { inputId: "repositoryId", value: "repo-1" },
      ])
    );

    expect(result.labels.get("repositoryId")).toBe("repo-1");
    expect(result.errors).toEqual([
      "Could not resolve repo-1: Repository removed",
    ]);
  });

  it("does not invoke reference services without a project context", async () => {
    const result = await lastValueFrom(
      service.resolve(undefined, [{ inputId: "repositoryId", value: "repo-1" }])
    );

    expect(result.labels).toEqual(new Map());
    expect(mockRepositoryService.getRepository).not.toHaveBeenCalled();
  });

  it("keeps the raw ID and reports an error when a scenario ID is not found", async () => {
    mockScenarioDefinitionService.getScenarioDefinitionById.mockReturnValue(
      throwError(() => new Error("Not found"))
    );

    const result = await lastValueFrom(
      service.resolve("project-1", [
        { inputId: "buildScenarioDefinitionId", value: "missing-scenario" },
      ])
    );

    expect(result.labels.get("buildScenarioDefinitionId")).toBe(
      "missing-scenario"
    );
    expect(result.errors).toEqual([
      "Could not resolve missing-scenario: Not found",
    ]);
  });

  it("keeps the raw ID and reports an error when a merge configuration ID is not present in the returned page", async () => {
    mockMergeConfigurationService.getFilteredMergeConfigurations.mockReturnValue(
      of({
        content: [{ id: "merge-1", branchName: "Destination branch" }],
        last: true,
      })
    );

    const result = await lastValueFrom(
      service.resolve("project-1", [
        { inputId: "repositoryId", value: "repo-1" },
        { inputId: "mergeConfigurationId", value: "missing-merge" },
      ])
    );

    expect(result.labels.get("mergeConfigurationId")).toBe("missing-merge");
    expect(result.errors).toEqual([
      "Could not resolve missing-merge: not found",
    ]);
  });

  it("walks past the first page to find a merge configuration", async () => {
    mockMergeConfigurationService.getFilteredMergeConfigurations.mockImplementation(
      (
        _projectId: string,
        _repositoryId: string,
        _searchKey: string,
        page: number
      ) =>
        page === 0
          ? of({
              content: [{ id: "merge-other", branchName: "other" }],
              last: false,
            })
          : of({
              content: [{ id: "merge-1", branchName: "Destination branch" }],
              last: true,
            })
    );

    const result = await lastValueFrom(
      service.resolve("project-1", [
        { inputId: "repositoryId", value: "repo-1" },
        { inputId: "mergeConfigurationId", value: "merge-1" },
      ])
    );

    expect(result.labels.get("mergeConfigurationId")).toBe(
      "Destination branch"
    );
    expect(result.errors).toEqual([]);
  });
});
