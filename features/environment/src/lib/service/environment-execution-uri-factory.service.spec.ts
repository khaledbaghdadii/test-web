import { TestBed } from "@angular/core/testing";

import { EnvironmentExecutionUriFactoryService } from "./environment-execution-uri-factory.service";
import { ProjectUriFactoryService } from "../../../../project/src/lib/project-uri-factory.service";

describe("EnvironmentExecutionUriFactoryService", () => {
  let service: EnvironmentExecutionUriFactoryService;
  let projectUriFactoryService: jest.Mocked<ProjectUriFactoryService>;

  beforeEach(() => {
    projectUriFactoryService = {
      constructProjectBaseUri: jest.fn(),
    } as unknown as jest.Mocked<ProjectUriFactoryService>;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProjectUriFactoryService,
          useValue: projectUriFactoryService,
        },
      ],
    });

    service = TestBed.inject(EnvironmentExecutionUriFactoryService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should construct environment execution URI correctly", () => {
    const projectId = "123";
    const environmentId = "env-456";
    const projectBaseUri = "projectUrl";

    projectUriFactoryService.constructProjectBaseUri.mockReturnValue(
      projectBaseUri
    );

    const expectedUri = `${projectBaseUri}/environments/${environmentId}`;
    const actualUri = service.constructEnvironmentExecutionUri(
      environmentId,
      projectId
    );

    expect(
      projectUriFactoryService.constructProjectBaseUri
    ).toHaveBeenCalledWith(projectId);
    expect(actualUri).toBe(expectedUri);
  });
});
