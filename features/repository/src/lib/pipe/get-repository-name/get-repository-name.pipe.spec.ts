import {
  GetRepositoryNamePipe,
  Repository,
  RepositoryService,
} from "@mxflow/features/repository";
import { firstValueFrom, of } from "rxjs";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";

describe("Get Repository Name Pipe Test", () => {
  const projectId = "projectId";
  const repositoryId = "repositoryId";
  const repositoryName = "repositoryName";
  const repository: Repository = {
    name: repositoryName,
  } as Repository;
  let repositoryService: RepositoryService;
  let projectIdResolver: ProjectIdRouteParamsResolverService;
  let pipe: GetRepositoryNamePipe;

  beforeEach(() => {
    projectIdResolver = {
      resolve: jest.fn(() => projectId),
    } as unknown as ProjectIdRouteParamsResolverService;
    repositoryService = {
      getRepoById: jest.fn(() => of(repository)),
    } as unknown as RepositoryService;

    pipe = new GetRepositoryNamePipe(repositoryService, projectIdResolver);
  });

  it("should fetch the repository with the correct project id and repository id", async () => {
    await firstValueFrom(pipe.transform(repositoryId));

    expect(repositoryService.getRepoById).toHaveBeenCalledWith(
      projectId,
      repositoryId
    );
  });

  it("should return the repository name in an observable", async () => {
    let actualName = await firstValueFrom(pipe.transform(repositoryId));

    expect(actualName).toStrictEqual(repositoryName);
  });
});
