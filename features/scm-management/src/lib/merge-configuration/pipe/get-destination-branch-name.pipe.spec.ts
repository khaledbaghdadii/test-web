import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import {
  GetDestinationBranchNamePipe,
  MergeConfiguration,
  MergeConfigurationFilterRequest,
  MergeConfigurationPage,
  MergeConfigurationService,
} from "@mxflow/features/scm-management";
import { firstValueFrom, of } from "rxjs";
import { TestBed } from "@angular/core/testing";

describe("Get Destination Branch Name Pipe Test", () => {
  const projectId = "projectId";
  const mergeConfigId = "mergeConfigId";
  const branchName = "branchName";
  let mergeConfigurationService: MergeConfigurationService;
  let pipe: GetDestinationBranchNamePipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GetDestinationBranchNamePipe,
        {
          provide: ProjectIdRouteParamsResolverService,
          useValue: {
            resolve: jest.fn(() => projectId),
          },
        },
        {
          provide: MergeConfigurationService,
          useValue: {
            getFilteredMergeConfigurations: jest.fn(() =>
              of(getMergeConfigurationPage())
            ),
          },
        },
      ],
    });

    pipe = TestBed.inject(GetDestinationBranchNamePipe);
    mergeConfigurationService = TestBed.inject(MergeConfigurationService);
  });

  it("when then merge configuration id is provided then retrieves the merge configuration for current project", async () => {
    await firstValueFrom(pipe.transform(mergeConfigId));

    expect(
      mergeConfigurationService.getFilteredMergeConfigurations
    ).toHaveBeenCalledWith(projectId, getMergeConfigurationFilterRequest());
  });

  it("when merge configuration exists then returns its destination branch name", async () => {
    const actualResponse = await firstValueFrom(pipe.transform(mergeConfigId));

    expect(actualResponse).toStrictEqual(getMergeConfiguration().branchName);
  });

  function getMergeConfigurationPage(): MergeConfigurationPage {
    return {
      content: [getMergeConfiguration()],
      totalPages: 1,
      totalElements: 0,
      size: 20,
      number: 0,
      last: true,
    };
  }

  function getMergeConfiguration(): MergeConfiguration {
    return {
      id: mergeConfigId,
      projectId: projectId,
      branchName: branchName,
      mergeConfigurationDefinition: {
        id: "def-1",
        repositoryId: "repositoryId",
      },
    };
  }

  function getMergeConfigurationFilterRequest(): MergeConfigurationFilterRequest {
    return {
      searchKey: mergeConfigId,
    };
  }
});
