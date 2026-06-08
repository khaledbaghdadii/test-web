import { TestBed } from "@angular/core/testing";
import { EnvironmentUriFactoryPipe } from "./environment-uri-factory.pipe";
import { EnvironmentExecutionUriFactoryService } from "../../environment-execution-uri-factory.service";

describe("Environment Uri Factory Pipe Test", () => {
  const environmentId = "environmentId";
  const projectId = "projectId";
  const expectedUrl = "expectedUrl";

  let mockService: jest.Mocked<EnvironmentExecutionUriFactoryService>;
  let pipe: EnvironmentUriFactoryPipe;

  beforeEach(() => {
    mockService = {
      constructEnvironmentExecutionUri: jest.fn(() => expectedUrl),
    } as unknown as jest.Mocked<EnvironmentExecutionUriFactoryService>;

    TestBed.configureTestingModule({
      providers: [
        EnvironmentUriFactoryPipe,
        {
          provide: EnvironmentExecutionUriFactoryService,
          useValue: mockService,
        },
      ],
    });

    pipe = TestBed.inject(EnvironmentUriFactoryPipe);
  });

  it("given the project id and the environment it, it should construct the environment page URL correctly", () => {
    const result = pipe.transform(environmentId, projectId);

    expect(mockService.constructEnvironmentExecutionUri).toHaveBeenCalledWith(
      environmentId,
      projectId
    );
    expect(result).toBe(expectedUrl);
  });
});
