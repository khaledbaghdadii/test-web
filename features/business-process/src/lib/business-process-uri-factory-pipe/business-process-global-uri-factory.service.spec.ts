import { TestBed } from "@angular/core/testing";

import { BusinessProcessGlobalUriFactoryService } from "./business-process-global-uri-factory.service";
import { ProjectUriFactoryService } from "../../../../project/src/lib/project-uri-factory.service";
import {
  BINARY_UPGRADE_MFE_PATH,
  CI_PROCESS_MFE_PATH,
  MASTER_VALIDATION_MFE_PATH,
} from "@mxflow/config";

describe("BusinessProcessGlobalUriFactoryService", () => {
  let service: BusinessProcessGlobalUriFactoryService;
  let projectUriFactoryService: jest.Mocked<ProjectUriFactoryService>;

  const projectId = "test-project-id";
  const projectUrl = "projectUrl";

  beforeEach(() => {
    projectUriFactoryService = {
      constructProjectBaseUri: jest.fn(() => projectUrl),
    } as unknown as jest.Mocked<ProjectUriFactoryService>;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProjectUriFactoryService,
          useValue: projectUriFactoryService,
        },
      ],
    });
    service = TestBed.inject(BusinessProcessGlobalUriFactoryService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should throw an exception when the process execution id passed does not contain the family type", () => {
    const id = "7b3a80f1-32e2-4def-b3b6-19e875c849c2";
    expect(() =>
      service.constructBusinessProcessExecutionUri(id, projectId)
    ).toThrow(new Error("Invalid process execution ID"));
  });

  it("should throw an exception in case family id present in id is unknown", () => {
    const id = "k__7b3a80f1-32e2-4def-b3b6-19e875c849c2";
    expect(() =>
      service.constructBusinessProcessExecutionUri(id, projectId)
    ).toThrow(new Error("Invalid process execution ID"));
  });

  it("should construct upgrade process uri in case binary-upgrade family id present in id", () => {
    const id = "binary-upgrade__7b3a80f1-32e2-4def-b3b6-19e875c849c2";
    const uri = service.constructBusinessProcessExecutionUri(id, projectId);
    expect(uri).toEqual(
      `${projectUrl}/business-process/${BINARY_UPGRADE_MFE_PATH}/execution/${id}`
    );
    expect(
      projectUriFactoryService.constructProjectBaseUri
    ).toHaveBeenCalledWith(projectId);
  });

  it("should construct build and test process uri in case user story build and test family id present in id", () => {
    const id =
      "user-story-build-and-test__a1897e12-6b66-486d-a567-2ab034274de3";
    const uri = service.constructBusinessProcessExecutionUri(id, projectId);
    expect(uri).toEqual(
      `${projectUrl}/business-process/${CI_PROCESS_MFE_PATH}/execution/${id}`
    );
    expect(
      projectUriFactoryService.constructProjectBaseUri
    ).toHaveBeenCalledWith(projectId);
  });

  it("should construct validation process uri in case master-validation family id present in id", () => {
    const id = "master-validation__7b3a80f1-32e2-4def-b3b6-19e875c849c2";
    const uri = service.constructBusinessProcessExecutionUri(id, projectId);
    expect(uri).toEqual(
      `${projectUrl}/business-process/${MASTER_VALIDATION_MFE_PATH}/execution/${id}`
    );
    expect(
      projectUriFactoryService.constructProjectBaseUri
    ).toHaveBeenCalledWith(projectId);
  });
});
