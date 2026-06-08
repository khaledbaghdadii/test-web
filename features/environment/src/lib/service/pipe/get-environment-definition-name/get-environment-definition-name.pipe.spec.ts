import { firstValueFrom, of } from "rxjs";
import {
  EnvironmentDefinition,
  EnvironmentService,
  GetEnvironmentDefinitionNamePipe,
} from "@mxflow/features/environment";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";

describe("Get Environment Definition Name Pipe Test", () => {
  const projectId = "projectId";
  const environmentDefinitionId = "environmentDefinitionId";
  const environmentDefinitionName = "environmentDefinitionName";
  const environment = {
    name: environmentDefinitionName,
  } as EnvironmentDefinition;

  let environmentService: EnvironmentService;
  let projectIdResolver: ProjectIdRouteParamsResolverService;

  let pipe: GetEnvironmentDefinitionNamePipe;

  beforeEach(() => {
    projectIdResolver = {
      resolve: jest.fn(() => projectId),
    } as unknown as ProjectIdRouteParamsResolverService;
    environmentService = {
      getEnvironmentDefinitionById: jest.fn(() => of(environment)),
    } as unknown as EnvironmentService;

    pipe = new GetEnvironmentDefinitionNamePipe(
      environmentService,
      projectIdResolver
    );
  });

  it("should fetch the environment definition with the correct project id and environment definition id", async () => {
    await firstValueFrom(pipe.transform(environmentDefinitionId));

    expect(
      environmentService.getEnvironmentDefinitionById
    ).toHaveBeenCalledWith(projectId, environmentDefinitionId);
  });

  it("should return the environment definition name in an observable", async () => {
    let actualName = await firstValueFrom(
      pipe.transform(environmentDefinitionId)
    );

    expect(actualName).toStrictEqual(environmentDefinitionName);
  });
});
