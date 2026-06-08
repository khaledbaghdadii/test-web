import { ScenarioExecutionUriFactoryPipe } from "./scenario-execution-uri-factory.pipe";
import { TestBed } from "@angular/core/testing";
import { ScenarioExecutionUriFactoryService } from "./scenario-execution-uri-factory.service";

const projectId = "projectId";

describe("ScenarioExecutionUriFactoryPipe", () => {
  let pipe: ScenarioExecutionUriFactoryPipe;
  let scenarioExecutionUriFactoryService: jest.Mocked<ScenarioExecutionUriFactoryService>;

  beforeEach(() => {
    scenarioExecutionUriFactoryService = {
      constructScenarioExecutionUrl: jest.fn(),
    } as unknown as jest.Mocked<ScenarioExecutionUriFactoryService>;

    TestBed.configureTestingModule({
      providers: [
        ScenarioExecutionUriFactoryPipe,
        {
          provide: ScenarioExecutionUriFactoryService,
          useValue: scenarioExecutionUriFactoryService,
        },
      ],
    });
    pipe = TestBed.inject(ScenarioExecutionUriFactoryPipe);
  });

  it("should construct scenario execution uri correctly", () => {
    const id = "beep-boop";
    const scenarioUrl = "scenario-url";
    scenarioExecutionUriFactoryService.constructScenarioExecutionUrl.mockReturnValue(
      scenarioUrl
    );
    const uri = pipe.transform(id, projectId);
    expect(uri).toEqual(scenarioUrl);
    expect(
      scenarioExecutionUriFactoryService.constructScenarioExecutionUrl
    ).toHaveBeenCalledWith(id, projectId);
  });
});
