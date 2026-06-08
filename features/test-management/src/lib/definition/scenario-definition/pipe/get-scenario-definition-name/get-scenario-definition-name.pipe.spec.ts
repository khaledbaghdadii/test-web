import { firstValueFrom, of } from "rxjs";
import {
  GetScenarioDefinitionNamePipe,
  ScenarioDefinition,
  ScenarioDefinitionService,
} from "@mxflow/test-management";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { TestBed } from "@angular/core/testing";

describe("Get Scenario Definition Name Pipe Test", () => {
  const projectId = "projectId";
  const scenarioId = "scenarioId";
  const scenarioName = "scenarioName";

  let scenario = {
    name: scenarioName,
  } as ScenarioDefinition;

  let scenarioService: ScenarioDefinitionService;
  let projectIdResolver: ProjectIdRouteParamsResolverService;

  let pipe: GetScenarioDefinitionNamePipe;

  beforeEach(() => {
    projectIdResolver = {
      resolve: jest.fn(() => projectId),
    } as unknown as ProjectIdRouteParamsResolverService;
    scenarioService = {
      getScenarioDefinitionById: jest.fn(() => of(scenario)),
    } as unknown as ScenarioDefinitionService;

    TestBed.configureTestingModule({
      providers: [
        { provide: ScenarioDefinitionService, useValue: scenarioService },
        {
          provide: ProjectIdRouteParamsResolverService,
          useValue: projectIdResolver,
        },
        GetScenarioDefinitionNamePipe,
      ],
    });
    pipe = TestBed.inject(GetScenarioDefinitionNamePipe);
  });

  it("should fetch the scenario definition using the correct project id and definition id", async () => {
    await firstValueFrom(pipe.transform(scenarioId));

    expect(scenarioService.getScenarioDefinitionById).toHaveBeenCalledWith(
      scenarioId,
      projectId
    );
  });

  it("should return the correct scenario name as an observable", async () => {
    let actualScenarioName = await firstValueFrom(pipe.transform(scenarioId));

    expect(actualScenarioName).toStrictEqual(scenarioName);
  });
});
