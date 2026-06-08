import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { firstValueFrom, lastValueFrom, of, throwError } from "rxjs";
import {
  BulkRepushFromFinalProductApiRequest,
  ScenarioExecutionService,
} from "./scenario-execution.service";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { EnvironmentStatus } from "@mxflow/features/environment";
import { ScenarioExecutionApiModel } from "./model/scenario-execution-api-model";
import { ExecuteScenarioResponse } from "./request/execute-scenario-response";
import { BulkRepushApiResponse } from "./request/bulk-repush-api-response";
import { BulkRepushApiRequest } from "./request/bulk-repush-api-request";
import { RunScenarioApiResponse } from "./request/run-scenario-api-response";
import { RunScenarioRequest } from "./request/run-scenario-request";
import { RunScenarioResponse } from "./request/run-scenario-response";
import { RunScenarioApiRequest } from "./request/run-scenario-api-request";
import { ScenarioExecutionGroupActionPermissionApiModel } from "./model/scenario-execution-group-action-permission-api-model";
import { BulkRepushRequest } from "./request/bulk-repush-request";
import { RepushScenarioExecutionRequest } from "./request/repush-scenario-execution-request";
import { ScenarioExecution } from "./scenario-execution";
import { RepushScenarioExecutionFromFinalProductRequest } from "./request/repush-scenario-execution-from-final-product-request";
import { RepushScenarioExecutionFromFinalProductApiRequest } from "./request/repush-scenario-execution-from-final-product-api-request";
import { BulkRepushFromFinalProductRequest } from "./request/bulk-repush-from-final-product-request";
import { TestExecutionMode } from "./model/test-execution-mode";
import { ScenarioAnalysisStatus } from "./scenario-analysis-status/scenario-analysis-status";
import {
  AnalysisStatusEligibility,
  AnalysisStatusUpdateIneligibilityReason,
} from "./scenario-analysis-status/analysis-status-eligibility";
import { TestBed } from "@angular/core/testing";

const ANALYSIS_STATUS = "Passed";
const COMMIT_ID = "commitId";
const TERMINATION_MESSAGE = "Environment Failure";
const LOG_FILE_URL = "https:log.com";
const BRANCH = "branch";
const ENVIRONMENT_ID = "environmentId";
const TEST_PACKAGE_DEFINITION_NAME = "DEMO";
const TEST_SELECTION_NAMES = ["Child 1"];
const TEST_PACKAGE_DEFINITION_ID = "213";
const FACTORY_PRODUCT_ID = "factory produt id";
const REPORT_URL = "./";
const COMPLETE_REPORT_URL = "complete report url";
const PERFORMANCE_REPORT_URL = "performanceReportUrl";
const HARDWARE_MONITORING_REPORT_URL = "hardwareMonitoringReportUrl";
const TEST_PACKAGE_RUN_LOCATION = "testPackageRunLocation";
const TEST_EXECUTION_NAME_UPON_EXECUTION = "name upon execution";
const TEST_PACKAGE_EXECUTION_STATUS = "Failed";
const ASSIGNEE = "username";
const MX_BUILD_ID = "1234-4321-1234-4321";
const MX_VERSION = "V3.0.1";
const SCENARIO_NAME = "scenario name";
const SCENARIO_DEFINITION_ID = "scenarioDefinitionId";
const START_DATE = "03-06-2022";
const END_DATE = "03-06-2022";
const SCENARIO_STATUS = "Failed";
const ENVIRONMENT_STATUS = "READY";
const PROCESS_ID = "processId";
const COMMENT = "some comment";
const PROJECT_ID = "projectId";
const CONTEXT_ID = "bpExecutionId";
const REPUSHED_SCENARIO_EXECUTION_ID = "REPUSHED_SCENARIO_EXECUTION_ID";
const SCENARIO_EXECUTION_ID = "SCENARIO_EXECUTION_ID";
const SUB_CONTEXT_ID = "subContextId";
const SCENARIO_EXECUTION_ALLOWED = true;
const EXECUTION_GROUP_ID = "executionGroupId";
const TEST_PACKAGE_EXECUTION_ID = "testPackageExecutionID";
const MACHINE_GROUP_ID = "MACHINE_GROUP_ID";
const FULL_MAINTENANCE = true;
const RTP_COMMIT_ID = "rtpCommitId";
const FINAL_PRODUCT_ID = "finalProductId";
const SCENARIO_EXECUTIONS = ["id1", "id2"];
const SCENARIO_EXECUTION_CLEANING_STATUS = "PASSED";
const REFERENCE_FACTORY_PRODUCT_ID = "referenceFactoryProductId";
const REQUESTED_FACTORY_PRODUCT_ID = "requestedFactoryProductId";
const binaryRegression1 = "binary regression 1";
const binaryRegression2 = "binary regression 2";
const configurationRegression1 = "configuration Regression 1";
const configurationRegression2 = "configuration Regression 2";
const configurationImpact1 = "configuration Impact 1";
const configurationImpact2 = "configuration Impact 2";
const binaryImpact1 = "binary Impact 1";
const binaryImpact2 = "binary Impact 2";
const failureReason1 = "failure reason 1";
const failureReason2 = "failure reason 2";
const KEPT_EXECUTION = true;
const JUMP_TYPE = "JUMP_TYPE";
const TEST_UNIT_ID = "testUnitId";
const PROJECT_NAME = "projectName";
const BUSINESS_PROCESS_ID = "businessProcessId";
const BUSINESS_PROCESS_NAME = "businessProcessName";
const BUSINESS_PROCESS_ID_2 = "businessProcessId_2";
const BUSINESS_PROCESS_NAME_2 = "businessProcessName_2";
const SUPPORT_RECON_ACTIVITIES = true;
const QUALITY_LEVEL_CQG = "CQG";

const detections = {
  binaryRegressionIds: [binaryRegression1, binaryRegression2],
  configurationRegressionIds: [
    configurationRegression1,
    configurationRegression2,
  ],
  binaryImpactIds: [binaryImpact1, binaryImpact2],
  configurationImpactIds: [configurationImpact1, configurationImpact2],
  failureReasonIds: [failureReason1, failureReason2],
};

const linkedIncidents = [
  {
    id: "id",
    title: "title",
    status: "status",
    owner: "owner",
    externalIssue: {
      id: "external issue id",
      link: "external issue link",
    },
  },
];

describe("Service: Scenario Execution", () => {
  let service: ScenarioExecutionService;
  let httpClient: HttpClient;
  const appConfig: AppConfig = {
    gatewayUrl: "gatewayUrl/",
  } as unknown as AppConfig;

  beforeEach(() => {
    httpClient = {
      post: jest.fn(() => of(null)),
      get: jest.fn(() => {
        return of({});
      }),
      put: jest.fn(() => {
        return of({});
      }),
    } as unknown as HttpClient;
    TestBed.configureTestingModule({
      providers: [
        ScenarioExecutionService,
        { provide: APP_CONFIG, useValue: appConfig },
        { provide: HttpClient, useValue: httpClient },
      ],
    });
    service = TestBed.inject(ScenarioExecutionService);
  });

  it("should return a scenario execution", async () => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(of(getActualScenarioExecution("321")));

    await expect(
      lastValueFrom(service.getScenarioExecution("123", "321"))
    ).resolves.toEqual(getExpectedScenarioExecution("321"));

    expect(httpClient.get).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/123/test-execution-manager/scenario-executions/321`
    );
  });

  it("should call update analysis status with correct arguments", async () => {
    await expect(
      lastValueFrom(
        service.updateAnalysisStatus(
          "123",
          "321",
          ScenarioAnalysisStatus.PASSED
        )
      )
    ).resolves.toEqual({});
    expect(httpClient.put).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/123/test-execution-manager/scenario-executions/321/analysis-status`,
      { analysisStatus: ANALYSIS_STATUS }
    );
  });

  it("should call update assignee with correct arguments", async () => {
    await expect(
      lastValueFrom(
        service.updateAssignee({
          projectId: PROJECT_ID,
          contextId: CONTEXT_ID,
          subContextId: SUB_CONTEXT_ID,
          scenarioDefinitionId: SCENARIO_DEFINITION_ID,
          assignee: ASSIGNEE,
        })
      )
    ).resolves.toEqual({});
    expect(httpClient.put).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/projectId/test-execution-manager/scenario-executions/assignee`,
      {
        assignee: ASSIGNEE,
        contextId: CONTEXT_ID,
        subContextId: SUB_CONTEXT_ID,
        scenarioDefinitionId: SCENARIO_DEFINITION_ID,
      }
    );
  });

  it("should call update comment with the correct arguments", async () => {
    await expect(
      lastValueFrom(service.updateComment(PROJECT_ID, CONTEXT_ID, COMMENT))
    ).resolves.toEqual({});
    expect(httpClient.put).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/${PROJECT_ID}/test-execution-manager/scenario-executions/${CONTEXT_ID}/comment`,
      { comment: COMMENT }
    );
  });

  it("should call toggle kept execution with the correct arguments", async () => {
    await expect(
      lastValueFrom(
        service.toggleKeptExecutionFlag(
          PROJECT_ID,
          SCENARIO_EXECUTION_ID,
          KEPT_EXECUTION
        )
      )
    ).resolves.toEqual({});
    expect(httpClient.put).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/${PROJECT_ID}/test-execution-manager/scenario-executions/${SCENARIO_EXECUTION_ID}/kept-execution`,
      { keptExecution: KEPT_EXECUTION }
    );
  });

  it("should handle failing to toggle kept execution", (done) => {
    jest
      .spyOn(httpClient, "put")
      .mockReturnValue(throwError(() => new Error("error")));

    const response = service.toggleKeptExecutionFlag(
      PROJECT_ID,
      SCENARIO_EXECUTION_ID,
      KEPT_EXECUTION
    );
    response.subscribe({
      error: (error) => {
        expect(error.message).toBe("error");
        done();
      },
    });
  });

  it("should call api correctly for repush", async function () {
    jest.spyOn(httpClient, "post").mockReturnValue(
      of({
        testExecutionId: REPUSHED_SCENARIO_EXECUTION_ID,
      } as ExecuteScenarioResponse)
    );

    const payload = {
      commitId: COMMIT_ID,
      factoryProductId: FACTORY_PRODUCT_ID,
    } as RepushScenarioExecutionRequest;

    service.repushScenarioExecution(PROJECT_ID, SCENARIO_EXECUTION_ID, payload);
    expect(httpClient.post).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/${PROJECT_ID}/test-execution-manager/scenario-executions/${SCENARIO_EXECUTION_ID}/repush`,
      payload
    );
  });

  it("should trim request when repush", async function () {
    jest.spyOn(httpClient, "post").mockReturnValue(
      of({
        testExecutionId: REPUSHED_SCENARIO_EXECUTION_ID,
      } as ExecuteScenarioResponse)
    );

    const request = {
      mxVersion: MX_VERSION + " ",
      mxBuildId: MX_BUILD_ID + " ",
      commitId: COMMIT_ID + " ",
      factoryProductId: FACTORY_PRODUCT_ID + " ",
    } as RepushScenarioExecutionRequest;

    const payload = {
      commitId: COMMIT_ID,
      factoryProductId: FACTORY_PRODUCT_ID,
    } as RepushScenarioExecutionRequest;

    service.repushScenarioExecution(PROJECT_ID, SCENARIO_EXECUTION_ID, request);
    expect(httpClient.post).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/${PROJECT_ID}/test-execution-manager/scenario-executions/${SCENARIO_EXECUTION_ID}/repush`,
      payload
    );
  });

  it("should trim request with undefined commit id on repush", async function () {
    jest.spyOn(httpClient, "post").mockReturnValue(
      of({
        testExecutionId: REPUSHED_SCENARIO_EXECUTION_ID,
      } as ExecuteScenarioResponse)
    );
    const request: RepushScenarioExecutionRequest = {
      mxVersion: MX_VERSION + " ",
      mxBuildId: MX_BUILD_ID + " ",
      factoryProductId: FACTORY_PRODUCT_ID + " ",
      commitId: undefined,
    };

    const payload: RepushScenarioExecutionRequest = {
      factoryProductId: FACTORY_PRODUCT_ID,
    };

    service.repushScenarioExecution(PROJECT_ID, SCENARIO_EXECUTION_ID, request);
    expect(httpClient.post).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/${PROJECT_ID}/test-execution-manager/scenario-executions/${SCENARIO_EXECUTION_ID}/repush`,
      payload
    );
  });

  it("repush should return the repushed scenario execution id", async function () {
    jest.spyOn(httpClient, "post").mockReturnValue(
      of({
        testExecutionId: REPUSHED_SCENARIO_EXECUTION_ID,
      } as ExecuteScenarioResponse)
    );

    const payload = {
      mxVersion: MX_VERSION,
      mxBuildId: MX_BUILD_ID,
      commitId: COMMIT_ID,
      factoryProductId: FACTORY_PRODUCT_ID,
    } as RepushScenarioExecutionRequest;

    const response = service.repushScenarioExecution(
      PROJECT_ID,
      SCENARIO_EXECUTION_ID,
      payload
    );
    response.subscribe((value) =>
      expect(value).toEqual({
        testExecutionId: REPUSHED_SCENARIO_EXECUTION_ID,
      } as ExecuteScenarioResponse)
    );
  });

  it("should call api correctly for bulk repush", async function () {
    const request = {
      mxVersion: MX_VERSION,
      mxBuildId: MX_BUILD_ID,
      commitId: COMMIT_ID,
      factoryProductId: FACTORY_PRODUCT_ID,
      scenariosToBeRepushed: ["id1", "id2"],
    } as BulkRepushRequest;

    const result = service.bulkRepushScenarioExecutions(PROJECT_ID, request);
    result.subscribe((value) =>
      expect(value).toEqual({ failedRepushes: ["id1", "id2"] })
    );
  });

  it("should trim request when bulk repush", async function () {
    const request = {
      factoryProductId: FACTORY_PRODUCT_ID + " ",
      commitId: COMMIT_ID + " ",
      scenariosToBeRepushed: ["id1", "id2"],
    } as BulkRepushRequest;

    const payload = {
      factoryProductId: FACTORY_PRODUCT_ID,
      commitId: COMMIT_ID,
      testScenarioExecutions: ["id1", "id2"],
    } as BulkRepushApiRequest;

    service.bulkRepushScenarioExecutions(PROJECT_ID, request);
    expect(httpClient.post).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/${PROJECT_ID}/test-execution-manager/scenario-executions/repush/bulk`,
      payload
    );
  });

  it("should trim request with undefined commit id when bulk repush", async function () {
    jest
      .spyOn(httpClient, "post")
      .mockReturnValue(of({} as BulkRepushApiResponse));
    const request: BulkRepushRequest = {
      factoryProductId: FACTORY_PRODUCT_ID + " ",
      mxVersion: MX_VERSION + " ",
      mxBuildId: MX_BUILD_ID + " ",
      commitId: undefined,
      scenariosToBeRepushed: ["id1", "id2"],
    };
    const payload: BulkRepushApiRequest = {
      factoryProductId: FACTORY_PRODUCT_ID,
      testScenarioExecutions: ["id1", "id2"],
    };

    service.bulkRepushScenarioExecutions(PROJECT_ID, request);
    expect(httpClient.post).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/${PROJECT_ID}/test-execution-manager/scenario-executions/repush/bulk`,
      payload
    );
  });

  it("should abort execution correctly", (done) => {
    service
      .abortScenarioExecution(PROJECT_ID, SCENARIO_EXECUTION_ID)
      .subscribe({
        next: (message) => {
          expect(httpClient.post).toHaveBeenCalledWith(
            `${appConfig.gatewayUrl}projects/${PROJECT_ID}/test-execution-manager/scenario-executions/${SCENARIO_EXECUTION_ID}/abort`,
            {}
          );
          expect(message).toEqual(
            "Aborting scenario execution. This might take some time."
          );
          done();
        },
      });
  });

  it("should handle error correctly when aborting execution", (done) => {
    const httpErrorResponse = new HttpErrorResponse({
      status: 500,
      error: "ERROR",
    });

    jest
      .spyOn(httpClient, "post")
      .mockReturnValue(throwError(() => httpErrorResponse));

    service
      .abortScenarioExecution(PROJECT_ID, SCENARIO_EXECUTION_ID)
      .subscribe({
        error: (error) => {
          expect(error.message).toBe("ERROR");
          done();
        },
      });
  });

  it("should return failed repushes for bulk repushes", async function () {
    const request = {
      factoryProductId: FACTORY_PRODUCT_ID,
      mxVersion: MX_VERSION,
      mxBuildId: MX_BUILD_ID,
      commitId: COMMIT_ID,
      scenariosToBeRepushed: ["id1", "id2"],
    } as BulkRepushRequest;

    const payload = {
      factoryProductId: FACTORY_PRODUCT_ID,
      commitId: COMMIT_ID,
      testScenarioExecutions: ["id1", "id2"],
    } as BulkRepushApiRequest;

    service.bulkRepushScenarioExecutions(PROJECT_ID, request);
    expect(httpClient.post).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/${PROJECT_ID}/test-execution-manager/scenario-executions/repush/bulk`,
      payload
    );
  });

  it("should return all scenario executions when no filteration applied", async () => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(
        of([
          getActualScenarioExecution("321"),
          getActualScenarioExecution("3210"),
        ] as ScenarioExecutionApiModel[])
      );

    await expect(
      lastValueFrom(service.getScenarioExecutions("123"))
    ).resolves.toEqual([
      getExpectedScenarioExecution("321"),
      getExpectedScenarioExecution("3210"),
    ]);

    expect(httpClient.get).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/123/test-execution-manager/scenario-executions?`
    );
  });

  it("should return scenario executions of a business process", async () => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(
        of([
          getActualScenarioExecution("321"),
          getActualScenarioExecution("3210"),
        ] as ScenarioExecutionApiModel[])
      );

    await expect(
      lastValueFrom(service.getScenarioExecutions("123", "processExecutionId"))
    ).resolves.toEqual([
      getExpectedScenarioExecution("321"),
      getExpectedScenarioExecution("3210"),
    ]);

    expect(httpClient.get).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/123/test-execution-manager/scenario-executions?&contextId=processExecutionId`
    );
  });

  it("should return scenario executions of a correlation id", async () => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(
        of([
          getActualScenarioExecution("321"),
          getActualScenarioExecution("3210"),
        ] as ScenarioExecutionApiModel[])
      );

    await expect(
      lastValueFrom(
        service.getScenarioExecutions("123", undefined, "dummyCorrelationId")
      )
    ).resolves.toEqual([
      getExpectedScenarioExecution("321"),
      getExpectedScenarioExecution("3210"),
    ]);

    expect(httpClient.get).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/123/test-execution-manager/scenario-executions?&subContextId=dummyCorrelationId`
    );
  });

  it("should return scenario executions of a business process with a specific correlation id", async () => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(
        of([
          getActualScenarioExecution("321"),
          getActualScenarioExecution("3210"),
        ] as ScenarioExecutionApiModel[])
      );

    await expect(
      lastValueFrom(
        service.getScenarioExecutions(
          "123",
          "processExecutionId",
          "dummyCorrelationId"
        )
      )
    ).resolves.toEqual([
      getExpectedScenarioExecution("321"),
      getExpectedScenarioExecution("3210"),
    ]);

    expect(httpClient.get).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/123/test-execution-manager/scenario-executions?&contextId=processExecutionId&subContextId=dummyCorrelationId`
    );
  });

  it("should return scenario executions of a business process with a specific list of statuses", async () => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(
        of([
          getActualScenarioExecution("321"),
          getActualScenarioExecution("3210"),
        ] as ScenarioExecutionApiModel[])
      );

    await expect(
      lastValueFrom(
        service.getScenarioExecutions("123", "processExecutionId", undefined, [
          "status1",
          "status2",
        ])
      )
    ).resolves.toEqual([
      getExpectedScenarioExecution("321"),
      getExpectedScenarioExecution("3210"),
    ]);

    expect(httpClient.get).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/123/test-execution-manager/scenario-executions?&contextId=processExecutionId&statuses=status1,status2`
    );
  });

  it("should return scenario executions given scenario execution ids", async () => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(
        of([
          getActualScenarioExecution("321"),
          getActualScenarioExecution("3210"),
        ] as ScenarioExecutionApiModel[])
      );

    await expect(
      lastValueFrom(
        service.getScenarioExecutions("123", undefined, undefined, undefined, [
          SCENARIO_EXECUTION_ID,
        ])
      )
    ).resolves.toEqual([
      getExpectedScenarioExecution("321"),
      getExpectedScenarioExecution("3210"),
    ]);

    expect(httpClient.get).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/123/test-execution-manager/scenario-executions?&scenarioExecutionIds=${SCENARIO_EXECUTION_ID}`
    );
  });

  it("should send a request to run an independent scenario correctly", async () => {
    jest
      .spyOn(httpClient, "post")
      .mockReturnValue(of(getRunScenarioApiResponse()));

    await expect(
      lastValueFrom(service.runScenario(PROJECT_ID, getRunScenarioRequest()))
    ).resolves.toEqual(getRunScenarioResponse());

    expect(httpClient.post).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/${PROJECT_ID}/test-execution-manager/scenario-executions/execute`,
      getRunScenarioApiRequest()
    );
  });

  it.each([true, false])(
    "should send a request to run an independent scenario with disableKeepExecution flag set to %s",
    async (disableKeepExecution) => {
      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(of(getRunScenarioApiResponse()));

      await expect(
        lastValueFrom(
          service.runScenario(
            PROJECT_ID,
            getRunScenarioRequestWithDisableKeepExecutionFlag(
              disableKeepExecution
            )
          )
        )
      ).resolves.toEqual(getRunScenarioResponse());

      expect(httpClient.post).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `projects/${PROJECT_ID}/test-execution-manager/scenario-executions/execute`,
        getRunScenarioApiRequestWithDisableKeepExecutionFlag(
          disableKeepExecution
        )
      );
    }
  );

  it.each([true, false])(
    "should send a request to run a scenario with stop services flag set to %s",
    async (stopServices) => {
      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(of(getRunScenarioApiResponse()));

      await expect(
        lastValueFrom(
          service.runScenario(
            PROJECT_ID,
            getRunScenarioRequestWithStopServicesFlag(stopServices)
          )
        )
      ).resolves.toEqual(getRunScenarioResponse());

      expect(httpClient.post).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `projects/${PROJECT_ID}/test-execution-manager/scenario-executions/execute`,
        getRunScenarioApiRequestWithStopServicesFlag(stopServices)
      );
    }
  );

  it.each([true, false])(
    "should send a request to run a scenario with validation scope enabled flag set to %s",
    async (validationFlagEnabled) => {
      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(of(getRunScenarioApiResponse()));

      await expect(
        lastValueFrom(
          service.runScenario(
            PROJECT_ID,
            getRunScenarioRequestWithValidationScope(validationFlagEnabled)
          )
        )
      ).resolves.toEqual(getRunScenarioResponse());

      expect(httpClient.post).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `projects/${PROJECT_ID}/test-execution-manager/scenario-executions/execute`,
        getRunScenarioApiRequestWithValidationScope(validationFlagEnabled)
      );
    }
  );

  it.each([true, false])(
    "should send a request to run a scenario with incident enabled flag set to %s",
    async (incidentEnabled) => {
      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(of(getRunScenarioApiResponse()));

      await expect(
        lastValueFrom(
          service.runScenario(
            PROJECT_ID,
            getRunScenarioRequestWithIncidentEnabled(incidentEnabled)
          )
        )
      ).resolves.toEqual(getRunScenarioResponse());

      expect(httpClient.post).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `projects/${PROJECT_ID}/test-execution-manager/scenario-executions/execute`,
        getRunScenarioApiRequestWithIncidentEnabled(incidentEnabled)
      );
    }
  );

  it.each([true, false, undefined])(
    "should run a scenario with disable configuration editor set to %s",
    async (disableConfigurationEditor) => {
      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(of(getRunScenarioApiResponse()));

      await expect(
        lastValueFrom(
          service.runScenario(PROJECT_ID, {
            ...getRunScenarioRequest(),
            disableConfigurationEditor: disableConfigurationEditor,
          })
        )
      ).resolves.toEqual(getRunScenarioResponse());

      expect(httpClient.post).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `projects/${PROJECT_ID}/test-execution-manager/scenario-executions/execute`,
        {
          ...getRunScenarioApiRequest(),
          disableConfigurationEditor: disableConfigurationEditor,
        }
      );
    }
  );

  it.each([true, false])(
    "should run a scenario with support recon activities upload flag set to %s",
    async (supportReconActivities) => {
      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(of(getRunScenarioApiResponse()));

      await expect(
        lastValueFrom(
          service.runScenario(PROJECT_ID, {
            ...getRunScenarioRequest(),
            supportReconActivities: supportReconActivities,
          })
        )
      ).resolves.toEqual(getRunScenarioResponse());

      expect(httpClient.post).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `projects/${PROJECT_ID}/test-execution-manager/scenario-executions/execute`,
        {
          ...getRunScenarioApiRequest(),
          supportReconActivities: supportReconActivities,
        }
      );
    }
  );

  it.each(["MQG", undefined])(
    "should run a scenario with quality level set to %s",
    async (qualityLevel) => {
      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(of(getRunScenarioApiResponse()));

      await expect(
        lastValueFrom(
          service.runScenario(PROJECT_ID, {
            ...getRunScenarioRequest(),
            qualityLevel: qualityLevel,
          })
        )
      ).resolves.toEqual(getRunScenarioResponse());

      expect(httpClient.post).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `projects/${PROJECT_ID}/test-execution-manager/scenario-executions/execute`,
        {
          ...getRunScenarioApiRequest(),
          qualityLevel: qualityLevel,
        }
      );
    }
  );

  it("should send a request to fetch if scenario execution is allowed", async () => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(
        of(getScenarioExecutionGroupActionPermissionApiResponse())
      );

    await expect(
      lastValueFrom(service.isExecutionAllowed(PROJECT_ID, EXECUTION_GROUP_ID))
    ).resolves.toEqual(getScenarioExecutionGroupActionPermissionApiResponse());

    expect(httpClient.get).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/${PROJECT_ID}/test-execution-manager/execution-group/${EXECUTION_GROUP_ID}/scenario-execution/can-push`
    );
  });

  it("should send a request to fetch if scenario repush is allowed under an execution group", async () => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(
        of(getScenarioExecutionGroupActionPermissionApiResponse())
      );

    await expect(
      lastValueFrom(
        service.isRepushAllowed(
          PROJECT_ID,
          EXECUTION_GROUP_ID,
          SCENARIO_EXECUTION_ID
        )
      )
    ).resolves.toEqual(getScenarioExecutionGroupActionPermissionApiResponse());

    expect(httpClient.get).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/${PROJECT_ID}/test-execution-manager/execution-group/${EXECUTION_GROUP_ID}/scenario-execution/${SCENARIO_EXECUTION_ID}/can-repush`
    );
  });

  it("should check the analysis statuses eligibility correctly", (done) => {
    const url =
      appConfig.gatewayUrl +
      `projects/${PROJECT_ID}/test-execution-manager/scenario-executions/${SCENARIO_EXECUTION_ID}/analysis-status-eligibility`;
    const analysisStatusEligibility: AnalysisStatusEligibility = {
      nextAnalysisStatuses: [
        {
          analysisStatus: ScenarioAnalysisStatus.NA,
          isEligible: true,
        },
        {
          analysisStatus: ScenarioAnalysisStatus.FAILED,
          isEligible: false,
        },
      ],
      isUpdateEligible: true,
      updateIneligibilityReason:
        AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_PASSED,
    };
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(of(analysisStatusEligibility));

    service
      .checkAnalysisStatusesEligibility(PROJECT_ID, SCENARIO_EXECUTION_ID)
      .subscribe((result) => {
        expect(result).toEqual(analysisStatusEligibility);
        expect(httpClient.get).toHaveBeenCalledWith(url);
        done();
      });
  });

  it("should return the analysis status eligibility with the ineligibility reason for each status", async () => {
    const analysisStatusEligibility: AnalysisStatusEligibility = {
      nextAnalysisStatuses: [
        {
          analysisStatus: ScenarioAnalysisStatus.NA,
          isEligible: true,
        },
        {
          analysisStatus: ScenarioAnalysisStatus.FAILED,
          isEligible: false,
          ineligibilityReason:
            AnalysisStatusUpdateIneligibilityReason.NO_REGRESSIONS_LINKED,
        },
      ],
      isUpdateEligible: true,
      updateIneligibilityReason:
        AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_PASSED,
    };
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(of(analysisStatusEligibility));

    const result = await firstValueFrom(
      service.checkAnalysisStatusesEligibility(
        PROJECT_ID,
        SCENARIO_EXECUTION_ID
      )
    );
    expect(result).toEqual(analysisStatusEligibility);
  });

  it("should handle failing to check the analysis statuses eligibility", (done) => {
    const errorResponse = new HttpErrorResponse({
      status: 500,
      error: "failed",
    });
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(throwError(() => errorResponse));
    service
      .checkAnalysisStatusesEligibility(PROJECT_ID, SCENARIO_EXECUTION_ID)
      .subscribe({
        error: (error) => {
          expect(error.message).toEqual("failed");
          done();
        },
      });
  });

  describe("repush from final product", () => {
    const request: RepushScenarioExecutionFromFinalProductRequest = {
      rtpCommitId: RTP_COMMIT_ID,
      finalProductId: FINAL_PRODUCT_ID,
      executionGroupId: EXECUTION_GROUP_ID,
    };

    const apiRequest: RepushScenarioExecutionFromFinalProductApiRequest = {
      rtpCommitId: RTP_COMMIT_ID,
      finalProductId: FINAL_PRODUCT_ID,
      executionGroupId: EXECUTION_GROUP_ID,
    };

    it("should call repush with factory product endpoint successfully", () => {
      service.repushScenarioExecutionFromFinalProduct(
        PROJECT_ID,
        SCENARIO_EXECUTION_ID,
        request
      );

      expect(httpClient.post).toHaveBeenCalledWith(
        `${appConfig.gatewayUrl}projects/${PROJECT_ID}/test-execution-manager/scenario-executions/${SCENARIO_EXECUTION_ID}/repush-from-final-product`,
        apiRequest
      );
    });

    it("should return scenario execution repush response successfully", () => {
      jest.spyOn(httpClient, "post").mockReturnValue(
        of({
          testExecutionId: REPUSHED_SCENARIO_EXECUTION_ID,
        } as ExecuteScenarioResponse)
      );

      service
        .repushScenarioExecutionFromFinalProduct(
          PROJECT_ID,
          SCENARIO_EXECUTION_ID,
          request
        )
        .subscribe((value) => {
          expect(value).toEqual({
            testExecutionId: REPUSHED_SCENARIO_EXECUTION_ID,
          } as ExecuteScenarioResponse);
        });
    });

    it("should throw error on failure to repush scenario with factory product id", (done) => {
      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(throwError(() => new Error("error")));

      const response = service.repushScenarioExecutionFromFinalProduct(
        PROJECT_ID,
        SCENARIO_EXECUTION_ID,
        request
      );
      response.subscribe({
        error: (error) => {
          expect(error.message).toBe("error");
          done();
        },
      });
    });
  });

  describe("bulk repush from final product", () => {
    it("should work correctly in happy path", (done) => {
      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(of({ failedRepushes: SCENARIO_EXECUTIONS }));

      const request = {
        rtpCommitId: RTP_COMMIT_ID,
        finalProductId: FINAL_PRODUCT_ID,
        scenariosToBeRepushed: SCENARIO_EXECUTIONS,
      } as BulkRepushFromFinalProductRequest;

      const apiRequest = {
        rtpCommitId: RTP_COMMIT_ID,
        finalProductId: FINAL_PRODUCT_ID,
        testScenarioExecutions: SCENARIO_EXECUTIONS,
      } as BulkRepushFromFinalProductApiRequest;

      const result = service.bulkRepushFromFinalProduct(PROJECT_ID, request);
      result.subscribe((value) => {
        expect(httpClient.post).toHaveBeenCalledWith(
          `${appConfig.gatewayUrl}projects/${PROJECT_ID}/test-execution-manager/scenario-executions/bulk-repush-from-final-product`,
          apiRequest
        );
        expect(value).toEqual({ failedRepushes: SCENARIO_EXECUTIONS });
        done();
      });
    });

    it("should throw error in case of non successful request", (done) => {
      const errorMessage = "errorMessage";
      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(
          throwError(() => new HttpErrorResponse({ error: errorMessage }))
        );

      const request = {
        rtpCommitId: RTP_COMMIT_ID,
        finalProductId: FINAL_PRODUCT_ID,
        scenariosToBeRepushed: SCENARIO_EXECUTIONS,
      } as BulkRepushFromFinalProductRequest;

      const result = service.bulkRepushFromFinalProduct(PROJECT_ID, request);
      result.subscribe({
        error: (value) => {
          expect(value.message).toEqual(errorMessage);
          done();
        },
      });
    });
  });

  describe("fetch archived test execution report", () => {
    it("should return the report if successful", (done) => {
      const archivedReportContent = "report content";
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(of({ runDetails: archivedReportContent }));

      const result = service.fetchArchivedReport(
        PROJECT_ID,
        SCENARIO_EXECUTION_ID,
        TEST_PACKAGE_EXECUTION_ID
      );
      result.subscribe((value) => {
        expect(httpClient.get).toHaveBeenCalledWith(
          `${appConfig.gatewayUrl}test-execution-service/projects/${PROJECT_ID}/scenario-executions/${SCENARIO_EXECUTION_ID}/test-executions/${TEST_PACKAGE_EXECUTION_ID}/archived-report`
        );
        expect(value).toEqual({ runDetails: archivedReportContent });
        done();
      });
    });

    it("should throw error in case failed to fetch the report", (done) => {
      const errorMessage = "errorMessage";
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(
          throwError(() => new HttpErrorResponse({ error: errorMessage }))
        );

      const result = service.fetchArchivedReport(
        PROJECT_ID,
        SCENARIO_EXECUTION_ID,
        TEST_PACKAGE_EXECUTION_ID
      );
      result.subscribe({
        error: (value) => {
          expect(value.message).toEqual(errorMessage);
          done();
        },
      });
    });
  });
});
function getScenarioExecutionGroupActionPermissionApiResponse(): ScenarioExecutionGroupActionPermissionApiModel {
  return {
    actionAllowed: SCENARIO_EXECUTION_ALLOWED,
    rejectionReasons: [""],
    warnings: ["SHOULD_HOUSKEEP_BEFORE_NEXT_LAUNCH"],
  };
}
function getRunScenarioApiResponse(): RunScenarioApiResponse {
  return {
    testExecutionId: SCENARIO_EXECUTION_ID,
  };
}
function getRunScenarioResponse(): RunScenarioResponse {
  return {
    testExecutionId: SCENARIO_EXECUTION_ID,
  };
}
function getRunScenarioRequest(): RunScenarioRequest {
  return {
    scenarioDefinitionId: SCENARIO_DEFINITION_ID,
    subContextId: SUB_CONTEXT_ID,
    commitId: COMMIT_ID,
    branchName: BRANCH,
    machineGroupId: MACHINE_GROUP_ID,
    supportReconActivities: SUPPORT_RECON_ACTIVITIES,
  };
}

function getRunScenarioRequestWithDisableKeepExecutionFlag(
  disableKeepExecution: boolean
): RunScenarioRequest {
  return {
    scenarioDefinitionId: SCENARIO_DEFINITION_ID,
    subContextId: SUB_CONTEXT_ID,
    commitId: COMMIT_ID,
    branchName: BRANCH,
    machineGroupId: MACHINE_GROUP_ID,
    disableKeepExecution: disableKeepExecution,
  };
}
function getRunScenarioApiRequest(): RunScenarioApiRequest {
  return {
    scenarioDefinitionId: SCENARIO_DEFINITION_ID,
    subContextId: SUB_CONTEXT_ID,
    branchName: BRANCH,
    fullMaintenance: false,
    machineGroupId: MACHINE_GROUP_ID,
    supportReconActivities: SUPPORT_RECON_ACTIVITIES,
  };
}

function getRunScenarioApiRequestWithDisableKeepExecutionFlag(
  disableKeepExecution: boolean
): RunScenarioApiRequest {
  return {
    scenarioDefinitionId: SCENARIO_DEFINITION_ID,
    subContextId: SUB_CONTEXT_ID,
    branchName: BRANCH,
    fullMaintenance: false,
    machineGroupId: MACHINE_GROUP_ID,
    disableKeepExecution: disableKeepExecution,
  };
}

function getRunScenarioApiRequestWithValidationScope(
  validationScopeEnabled: boolean
): RunScenarioApiRequest {
  return {
    scenarioDefinitionId: SCENARIO_DEFINITION_ID,
    subContextId: SUB_CONTEXT_ID,
    branchName: BRANCH,
    fullMaintenance: false,
    machineGroupId: MACHINE_GROUP_ID,
    validationScopeEnabled: validationScopeEnabled,
  };
}

function getRunScenarioApiRequestWithIncidentEnabled(
  incidentEnabled: boolean
): RunScenarioApiRequest {
  return {
    scenarioDefinitionId: SCENARIO_DEFINITION_ID,
    subContextId: SUB_CONTEXT_ID,
    branchName: BRANCH,
    fullMaintenance: false,
    machineGroupId: MACHINE_GROUP_ID,
    incidentEnabled: incidentEnabled,
  };
}

function getRunScenarioApiRequestWithStopServicesFlag(
  stopServices: boolean
): RunScenarioApiRequest {
  return {
    scenarioDefinitionId: SCENARIO_DEFINITION_ID,
    subContextId: SUB_CONTEXT_ID,
    branchName: BRANCH,
    fullMaintenance: false,
    machineGroupId: MACHINE_GROUP_ID,
    stopServices: stopServices,
  };
}

function getRunScenarioRequestWithStopServicesFlag(
  stopServices: boolean
): RunScenarioRequest {
  return {
    scenarioDefinitionId: SCENARIO_DEFINITION_ID,
    subContextId: SUB_CONTEXT_ID,
    commitId: COMMIT_ID,
    branchName: BRANCH,
    machineGroupId: MACHINE_GROUP_ID,
    stopServices: stopServices,
  };
}

function getRunScenarioRequestWithValidationScope(
  validationScopeEnabled: boolean
): RunScenarioRequest {
  return {
    scenarioDefinitionId: SCENARIO_DEFINITION_ID,
    subContextId: SUB_CONTEXT_ID,
    commitId: COMMIT_ID,
    branchName: BRANCH,
    machineGroupId: MACHINE_GROUP_ID,
    validationScopeEnabled: validationScopeEnabled,
  };
}

function getRunScenarioRequestWithIncidentEnabled(
  incidentEnabled: boolean
): RunScenarioRequest {
  return {
    scenarioDefinitionId: SCENARIO_DEFINITION_ID,
    subContextId: SUB_CONTEXT_ID,
    commitId: COMMIT_ID,
    branchName: BRANCH,
    machineGroupId: MACHINE_GROUP_ID,
    incidentEnabled: incidentEnabled,
  };
}

const TEST_EXECUTION_MODE = TestExecutionMode.WEB_TEST_ENGINE;
function getExpectedScenarioExecution(id: string): ScenarioExecution {
  return {
    analysisStatus: ANALYSIS_STATUS,
    assignee: ASSIGNEE,
    environmentStatus: EnvironmentStatus.READY,
    mxBuildId: MX_BUILD_ID,
    mxVersion: MX_VERSION,
    name: SCENARIO_NAME,
    contextId: PROCESS_ID,
    testUnitId: TEST_UNIT_ID,
    scenarioDefinitionId: SCENARIO_DEFINITION_ID,
    id: id,
    startDate: START_DATE,
    endDate: END_DATE,
    status: SCENARIO_STATUS,
    terminationMessage: TERMINATION_MESSAGE,
    logFileUrl: LOG_FILE_URL,
    environmentId: ENVIRONMENT_ID,
    commitId: COMMIT_ID,
    branch: BRANCH,
    testExecutions: [
      {
        id: TEST_PACKAGE_EXECUTION_ID,
        testPackageDefinitionName: TEST_PACKAGE_DEFINITION_NAME,
        testSelectionNames: TEST_SELECTION_NAMES,
        testPackageDefinitionId: TEST_PACKAGE_DEFINITION_ID,
        report: {
          completeReportUrl: COMPLETE_REPORT_URL,
          performanceReportUrl: PERFORMANCE_REPORT_URL,
          hardwareMonitoringReportUrl: HARDWARE_MONITORING_REPORT_URL,
          url: REPORT_URL,
          uploading: false,
        },
        testPackageRunLocation: TEST_PACKAGE_RUN_LOCATION,
        status: TEST_PACKAGE_EXECUTION_STATUS,
        startDate: START_DATE,
        endDate: END_DATE,
        isExecutionEnded: true,
        nameUponExecution: TEST_EXECUTION_NAME_UPON_EXECUTION,
        executionMode: TEST_EXECUTION_MODE,
      },
    ],
    comment: COMMENT,
    repushable: true,
    isFinished: true,
    isFailed: true,
    executionGroupId: EXECUTION_GROUP_ID,
    detections: detections,
    linkedIncidents: linkedIncidents,
    factoryProductId: FACTORY_PRODUCT_ID,
    fullMaintenance: FULL_MAINTENANCE,
    cleaningStatus: SCENARIO_EXECUTION_CLEANING_STATUS,
    validation: {
      scope: {
        referenceFactoryProductId: REFERENCE_FACTORY_PRODUCT_ID,
        requestedFactoryProductId: REQUESTED_FACTORY_PRODUCT_ID,
      },
      jumpType: JUMP_TYPE,
    },
    rtpCommitId: RTP_COMMIT_ID,
    finalProductId: FINAL_PRODUCT_ID,
    keptExecution: KEPT_EXECUTION,
    supportReconActivities: SUPPORT_RECON_ACTIVITIES,
    qualityLevel: QUALITY_LEVEL_CQG,
    businessProcesses: [
      {
        id: BUSINESS_PROCESS_ID,
        name: BUSINESS_PROCESS_NAME,
      },
      {
        id: BUSINESS_PROCESS_ID_2,
        name: BUSINESS_PROCESS_NAME_2,
      },
    ],
    project: {
      id: PROJECT_ID,
      name: PROJECT_NAME,
    },
  };
}

function getActualScenarioExecution(id: string): ScenarioExecutionApiModel {
  return {
    analysisStatus: ANALYSIS_STATUS,
    assignee: ASSIGNEE,
    mxBuildId: MX_BUILD_ID,
    mxVersion: MX_VERSION,
    name: SCENARIO_NAME,
    contextId: PROCESS_ID,
    scenarioDefinitionId: SCENARIO_DEFINITION_ID,
    id: id,
    testUnitId: TEST_UNIT_ID,
    startDate: START_DATE,
    endDate: END_DATE,
    status: SCENARIO_STATUS,
    terminationMessage: TERMINATION_MESSAGE,
    logFileUrl: LOG_FILE_URL,
    commitId: COMMIT_ID,
    branch: BRANCH,
    envInfo: {
      environmentId: ENVIRONMENT_ID,
      status: ENVIRONMENT_STATUS,
    },
    testExecutions: [
      {
        id: TEST_PACKAGE_EXECUTION_ID,
        testPackageName: TEST_PACKAGE_DEFINITION_NAME,
        testSelectionNames: TEST_SELECTION_NAMES,
        testPackageDefinitionId: TEST_PACKAGE_DEFINITION_ID,
        testPackageRunLocation: TEST_PACKAGE_RUN_LOCATION,
        report: {
          completeReportUrl: COMPLETE_REPORT_URL,
          performanceReportUrl: PERFORMANCE_REPORT_URL,
          hardwareMonitoringReportUrl: HARDWARE_MONITORING_REPORT_URL,
          url: REPORT_URL,
          uploading: false,
        },
        testExecutionStatus: TEST_PACKAGE_EXECUTION_STATUS,
        startDate: START_DATE,
        endDate: END_DATE,
        executionEnded: true,
        nameUponExecution: TEST_EXECUTION_NAME_UPON_EXECUTION,
        executionMode: TEST_EXECUTION_MODE,
      },
    ],
    comment: COMMENT,
    repushable: true,
    finished: true,
    failed: true,
    executionGroupId: EXECUTION_GROUP_ID,
    detections: detections,
    linkedIncidents: linkedIncidents,
    fullMaintenance: FULL_MAINTENANCE,
    factoryProductId: FACTORY_PRODUCT_ID,
    finalProductId: FINAL_PRODUCT_ID,
    rtpCommitId: RTP_COMMIT_ID,
    cleaningStatus: SCENARIO_EXECUTION_CLEANING_STATUS,
    validation: {
      scope: {
        referenceFactoryProductId: REFERENCE_FACTORY_PRODUCT_ID,
        requestedFactoryProductId: REQUESTED_FACTORY_PRODUCT_ID,
      },
      jumpType: JUMP_TYPE,
    },
    keptExecution: KEPT_EXECUTION,
    supportReconActivities: SUPPORT_RECON_ACTIVITIES,
    qualityLevel: QUALITY_LEVEL_CQG,
    businessProcesses: [
      {
        id: BUSINESS_PROCESS_ID,
        name: BUSINESS_PROCESS_NAME,
      },
      {
        id: BUSINESS_PROCESS_ID_2,
        name: BUSINESS_PROCESS_NAME_2,
      },
    ],
    project: {
      id: PROJECT_ID,
      name: PROJECT_NAME,
    },
  };
}
