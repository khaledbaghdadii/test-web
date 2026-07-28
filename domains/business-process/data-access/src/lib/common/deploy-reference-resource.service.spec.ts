import { TestBed } from "@angular/core/testing";
import { firstValueFrom, of, throwError } from "rxjs";
import {
  RunScenarioResponse,
  ScenarioRunService,
} from "@mxevolve/domains/test/data-access";
import { DeployReferenceResourceService } from "./deploy-reference-resource.service";
import { DeployReferenceResourceRequest } from "@mxevolve/domains/business-process/data-access";

describe("DeployReferenceResourceService", () => {
  const PROJECT_ID = "project-1";
  const BASE_REQUEST: DeployReferenceResourceRequest = {
    scenarioDefinitionId: "scn-1",
    commitId: "abc123",
    executionGroupId: "group-1",
    referenceFactoryProductId: "fap-1",
    machineGroupId: "infra-1",
    cleanIfPassed: false,
  } as DeployReferenceResourceRequest;

  const scenarioRunService = {
    runScenario: jest.fn(),
  };

  let service: DeployReferenceResourceService;

  function request(
    overrides: Partial<DeployReferenceResourceRequest> = {}
  ): DeployReferenceResourceRequest {
    return { ...BASE_REQUEST, ...overrides } as DeployReferenceResourceRequest;
  }

  beforeEach(() => {
    jest.resetAllMocks();

    TestBed.configureTestingModule({
      providers: [
        { provide: ScenarioRunService, useValue: scenarioRunService },
        DeployReferenceResourceService,
      ],
    });

    service = TestBed.inject(DeployReferenceResourceService);
  });

  describe("deployReferenceResource", () => {
    it("when user requests to launch a reference resource, then the system deploy it and returns the testExecutionId", async () => {
      const deployRequest = request();
      const expectedRunScenarioRequest = {
        scenarioDefinitionId: "scn-1",
        commitId: "abc123",
        referenceFactoryProductId: "fap-1",
        executionGroupId: "group-1",
        machineGroupId: "infra-1",
        qualityLevel: undefined,
        cleanIfPassed: false,
        disableKeepExecution: undefined,
        disableConfigurationEditor: undefined,
        supportReconActivities: undefined,
        stopServices: undefined,
        validationScopeEnabled: undefined,
        incidentEnabled: undefined,
      };
      const runScenarioResponse: RunScenarioResponse = {
        testExecutionId: "exec-123",
      };

      scenarioRunService.runScenario.mockReturnValue(of(runScenarioResponse));

      const result = await firstValueFrom(
        service.deployReferenceResource(PROJECT_ID, deployRequest)
      );

      expect(scenarioRunService.runScenario).toHaveBeenCalledWith(
        PROJECT_ID,
        expectedRunScenarioRequest
      );
      expect(result).toEqual({
        testExecutionId: "exec-123",
      });
    });

    it("maps all fields from DeployReferenceResourceRequest to RunScenarioRequest", async () => {
      const deployRequest = request({
        scenarioDefinitionId: "scn-123",
        commitId: "commit-abc",
        referenceFactoryProductId: "rfp-456",
        executionGroupId: "eg-789",
        machineGroupId: "mg-101",
        qualityLevel: "HIGH",
        cleanIfPassed: true,
        disableKeepExecution: true,
        disableConfigurationEditor: false,
        supportReconActivities: true,
        stopServices: false,
        validationScopeEnabled: true,
        incidentEnabled: false,
      });

      scenarioRunService.runScenario.mockReturnValue(
        of({ testExecutionId: "exec-456" })
      );

      await firstValueFrom(
        service.deployReferenceResource(PROJECT_ID, deployRequest)
      );

      expect(scenarioRunService.runScenario).toHaveBeenCalledWith(
        PROJECT_ID,
        expect.objectContaining({
          scenarioDefinitionId: "scn-123",
          commitId: "commit-abc",
          referenceFactoryProductId: "rfp-456",
          executionGroupId: "eg-789",
          machineGroupId: "mg-101",
          qualityLevel: "HIGH",
          cleanIfPassed: true,
          disableKeepExecution: true,
          disableConfigurationEditor: false,
          supportReconActivities: true,
          stopServices: false,
          validationScopeEnabled: true,
          incidentEnabled: false,
        })
      );
    });

    it("Given that a failure occurs when the user requests a resource to launch, the error should be propagated successfully", async () => {
      const deployRequest = request();
      const error = new Error("Scenario execution failed limit reached");

      scenarioRunService.runScenario.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(
          service.deployReferenceResource(PROJECT_ID, deployRequest)
        )
      ).rejects.toThrow("Scenario execution failed limit reached");
    });
  });
});
