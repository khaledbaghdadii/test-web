import { TestBed } from "@angular/core/testing";

import { ScenarioExecutionUriFactoryService } from "./scenario-execution-uri-factory.service";
import { TEST_MFE_PATH } from "@mxflow/config";
import { ProjectUriFactoryService } from "../../../../../../project/src/lib/project-uri-factory.service";

describe("ScenarioExecutionUriFactoryService", () => {
  let service: ScenarioExecutionUriFactoryService;
  let projectUriFactoryService: jest.Mocked<ProjectUriFactoryService>;

  beforeEach(() => {
    projectUriFactoryService = {
      constructProjectBaseUri: jest.fn(),
    } as jest.Mocked<ProjectUriFactoryService>;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProjectUriFactoryService,
          useValue: projectUriFactoryService,
        },
      ],
    });
    service = TestBed.inject(ScenarioExecutionUriFactoryService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should construct scenario execution uri correctly", () => {
    const id = "beep-boop";
    const projectId = "projectId";
    const projectUrl = "projectUrl";
    projectUriFactoryService.constructProjectBaseUri.mockReturnValue(
      projectUrl
    );

    const uri = service.constructScenarioExecutionUrl(id, projectId);
    expect(uri).toEqual(
      `${projectUrl}/${TEST_MFE_PATH}/execution/details/${id}`
    );
    expect(
      projectUriFactoryService.constructProjectBaseUri
    ).toHaveBeenCalledWith(projectId);
  });
});
