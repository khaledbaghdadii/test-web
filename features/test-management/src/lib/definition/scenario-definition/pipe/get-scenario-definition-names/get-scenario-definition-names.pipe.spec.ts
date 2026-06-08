import {
  GetScenarioDefinitionNamesPipe,
  ScenarioDefinition,
  ScenarioDefinitionService,
} from "@mxflow/test-management";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { TestBed } from "@angular/core/testing";

describe("Get Scenario Definition Names Pipe Test", () => {
  const projectId = "projectId";
  const scenarioId = "scenarioId";
  const anotherScenarioId = "anotherScenarioId";
  const scenarioName = "scenarioName";
  const anotherScenarioName = "anotherScenarioName";

  let scenario = {
    name: scenarioName,
  } as ScenarioDefinition;
  let anotherScenario = {
    name: anotherScenarioName,
  } as ScenarioDefinition;
  let projectIdResolver: ProjectIdRouteParamsResolverService;

  let scenarioService: ScenarioDefinitionService;

  let pipe: GetScenarioDefinitionNamesPipe;

  beforeEach(() => {
    projectIdResolver = {
      resolve: jest.fn(() => projectId),
    } as unknown as ProjectIdRouteParamsResolverService;
    scenarioService = {
      getScenarioDefinitionById: jest.fn((providedId) => {
        if (providedId == scenarioId) {
          return scenario;
        } else {
          return anotherScenario;
        }
      }),
    } as unknown as ScenarioDefinitionService;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProjectIdRouteParamsResolverService,
          useValue: projectIdResolver,
        },
        { provide: ScenarioDefinitionService, useValue: scenarioService },
        GetScenarioDefinitionNamesPipe,
      ],
    });
    pipe = TestBed.inject(GetScenarioDefinitionNamesPipe);
  });

  it("should fetch all the scenario definitions using the correct project id and definition id", () => {
    pipe.transform([scenarioId, anotherScenarioId]).subscribe(() => {
      expect(scenarioService.getScenarioDefinitionById).toHaveBeenCalledWith(
        scenarioId,
        projectId
      );
      expect(scenarioService.getScenarioDefinitionById).toHaveBeenCalledWith(
        anotherScenarioId,
        projectId
      );
    });
  });

  it("should return the correct list of scenario names as an observable", () => {
    pipe
      .transform([scenarioId, anotherScenarioId])
      .subscribe((actualScenarioNames) => {
        expect(actualScenarioNames).toStrictEqual([
          scenarioName,
          anotherScenarioName,
        ]);
      });
  });
});
