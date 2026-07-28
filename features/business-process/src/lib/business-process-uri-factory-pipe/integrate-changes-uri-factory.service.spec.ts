import { TestBed } from "@angular/core/testing";
import { IntegrateChangesUriFactoryService } from "@mxflow/features/business-process";
import { BusinessProcessGlobalUriFactoryService } from "./business-process-global-uri-factory.service";

describe("IntegrateChangesUriFactoryService", () => {
  let service: IntegrateChangesUriFactoryService;

  const mockBusinessProcessGlobalUriFactoryService = {
    constructBusinessProcessExecutionUri: jest.fn(),
  };

  const projectId = "test-project-id";
  const executionId = "7b3a80f1-32e2-4def-b3b6-19e875c849c2";
  const baseUrl = `projectUrl/business-process/ci-process/execution/${executionId}`;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBusinessProcessGlobalUriFactoryService.constructBusinessProcessExecutionUri.mockReturnValue(
      baseUrl
    );

    TestBed.configureTestingModule({
      providers: [
        IntegrateChangesUriFactoryService,
        {
          provide: BusinessProcessGlobalUriFactoryService,
          useValue: mockBusinessProcessGlobalUriFactoryService,
        },
      ],
    });

    service = TestBed.inject(IntegrateChangesUriFactoryService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return null for an unknown family id", () => {
    const result = service.constructIntegrateChangesUri(
      executionId,
      "unknown-family",
      projectId
    );

    expect(result).toBeNull();
    expect(
      mockBusinessProcessGlobalUriFactoryService.constructBusinessProcessExecutionUri
    ).not.toHaveBeenCalled();
  });

  it.each([
    ["user-story-build-and-test", `${baseUrl}?step=merge`],
    ["master-validation", `${baseUrl}?step=integrate-fixes`],
    ["binary-upgrade", `${baseUrl}?step=merge`],
  ])("should construct correct uri for family %s", (familyId, expectedUri) => {
    const result = service.constructIntegrateChangesUri(
      executionId,
      familyId,
      projectId
    );

    expect(result).toEqual(expectedUri);
    expect(
      mockBusinessProcessGlobalUriFactoryService.constructBusinessProcessExecutionUri
    ).toHaveBeenCalledWith(executionId, projectId);
  });
});
