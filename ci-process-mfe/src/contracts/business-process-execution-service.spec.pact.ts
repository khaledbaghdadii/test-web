import { EnvironmentProvider } from "../environments/environment";
import { TestBed } from "@angular/core/testing";
import { Matchers, Pact } from "@pact-foundation/pact";
import { provideHttpClient } from "@angular/common/http";
import { CiProcessExecutionService } from "../app/ci-process/ci-process-execution/service/ci-process-execution.service";
import {
  BuildAndTestProcessExecutionFetcherService,
  BuildAndTestProcessExecutionMapperService,
} from "@mxflow/features/business-process";
import { catchError, lastValueFrom, of } from "rxjs";
import { CiProcessExecutionsService } from "../app/ci-process/ci-process-executions/ci-process-executions.service";
import { eachLike, like } from "@pact-foundation/pact/src/dsl/matchers";
import { APP_CONFIG } from "@mxflow/config";

const projectId = "projectId";
const processId = "processId";
const reviewer = "reviewer";
const title = "title";
const mergeConfigurationId = "mergeConfiguration";

const PAGE = 1;
const PAGE_SIZE = 10;
const NAME = "name";
const OWNER = "owner";
const STATUSES = ["FAILED"];
const CONFIG_BRANCH_NAME = "configBranch1";
const DEFINITION_IDS = ["DEFINITION_ID_1"];
const USER_STORY_IDS = ["USER_ID"];
const END_DATE_RANGE_START = "2022-09-13T08:39:10.487018Z";
const END_DATE_RANGE_END = "2022-09-14T08:50:10.487018Z";
const START_DATE_RANGE_START = "2022-09-14T08:39:10.487018Z";
const START_DATE_RANGE_END = "2022-09-14T08:50:10.487018Z";
const EXPIRY_DATE_RANGE_START = "2022-09-14T08:39:10.487018Z";
const EXPIRY_DATE_RANGE_END = "2022-09-14T08:50:10.487018Z";
const backportDefinitionIds = "backportDefinitionIds";
const destinationBranchName = "destinationBranchName";

describe("Ci process execution contract tests", () => {
  const pact = new Pact({
    consumer: "web-ci-process-mfe",
    provider: "business-process-execution-service",
  });

  let ciProcessExecutionService: CiProcessExecutionService;
  let ciProcessExecutionsService: CiProcessExecutionsService;
  let fetcherService: BuildAndTestProcessExecutionFetcherService;

  beforeEach(async () => {
    const port = pact.opts.port;
    const environment = { gatewayUrl: `http://127.0.0.1:${port}/` };
    const environmentProvider = {
      getEnvironment: jest.fn(() => environment),
    } as unknown as EnvironmentProvider;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        { provide: EnvironmentProvider, useValue: environmentProvider },
        { provide: APP_CONFIG, useValue: environment },
        BuildAndTestProcessExecutionMapperService,
        BuildAndTestProcessExecutionFetcherService,
        CiProcessExecutionService,
        CiProcessExecutionsService,
      ],
    });

    ciProcessExecutionService = TestBed.inject(CiProcessExecutionService);
    ciProcessExecutionsService = TestBed.inject(CiProcessExecutionsService);
    fetcherService = TestBed.inject(BuildAndTestProcessExecutionFetcherService);
  });

  afterEach(async () => {
    await pact.verify();
  });

  beforeAll(async () => {
    await pact.setup();
  });

  afterAll(async () => {
    await pact.finalize();
  });

  describe("fetching a ci process execution contract test", () => {
    test("validate contract test for fetching a ci process execution by its process id", async () => {
      await pact.addInteraction({
        state: "a ci process execution exists",
        uponReceiving: "a request to fetch a ci process execution by id",
        withRequest: {
          path: `/projects/${projectId}/business-process/executions/ci-process/${processId}`,
          method: "GET",
        },
        willRespondWith: {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            id: Matchers.string(),
            name: Matchers.string(),
            projectId: Matchers.string(),
            definitionId: Matchers.string(),
            owner: Matchers.string(),
            errorMessage: Matchers.string(),
            startDate: Matchers.string(),
            endDate: Matchers.string(),
            expiryDate: Matchers.string(),
            notificationsRecipients: Matchers.eachLike(Matchers.string()),
            ciVersion: Matchers.integer(),
            source: {
              id: Matchers.string(),
              type: Matchers.term({
                generate: "BUSINESS_PROCESS",
                matcher: "BUSINESS_PROCESS|USER",
              }),
            },
            input: {
              repositoryId: Matchers.string(),
              configurationBranchName: Matchers.string(),
              configurationParentBranch: Matchers.string(),
              userStoryIds: Matchers.eachLike(Matchers.string()),
              buildEnvironment: {
                skipEnvironmentDeployment: Matchers.boolean(),
                scenarioDefinitionId: Matchers.string(),
              },
              buildAndTestInfraGroup: Matchers.string(),
              buildEnvironmentInfraGroup: Matchers.string(),
            },
            status: Matchers.string(),
            createBranchStage: {
              developmentId: Matchers.string(),
              name: Matchers.string(),
              status: Matchers.string(),
              startDate: Matchers.string(),
              endDate: Matchers.string(),
              errorMessage: Matchers.string(),
            },
            prepareBuildStage: {
              name: Matchers.string(),
              status: Matchers.string(),
              startDate: Matchers.string(),
              endDate: Matchers.string(),
              errorMessage: Matchers.string(),
              requester: Matchers.string(),
              latestScenarioExecutionId: Matchers.string(),
            },
            buildAndTestStage: {
              name: Matchers.string(),
              status: Matchers.string(),
              startDate: Matchers.string(),
              endDate: Matchers.string(),
              errorMessage: Matchers.string(),
              requester: Matchers.string(),
              technicalReseedExecutionGroupId: Matchers.string(),
              readyForBuildAndTest: Matchers.boolean(),
              cherryPickRunning: Matchers.boolean(),
              cherryPickFailed: Matchers.boolean(),
            },
            integrateChangesStage: {
              name: Matchers.string(),
              status: Matchers.string(),
              startDate: Matchers.string(),
              endDate: Matchers.string(),
              errorMessage: Matchers.string(),
              latestMergeJobId: Matchers.string(),
              backportRequested: Matchers.boolean(),
              willPublishFinalProduct: Matchers.boolean(),
              finalProductPublishing: {
                id: Matchers.string(),
                publishingStartDate: Matchers.string(),
                publishingEndDate: Matchers.string(),
                finalProductFailure: Matchers.string(),
              },
              backportMergeConfigurationIds: Matchers.eachLike(
                Matchers.string()
              ),
              backportStopRequester: Matchers.string(),
              canStopBackport: Matchers.boolean(),
              backportExecutions: Matchers.eachLike(Matchers.string()),
              failedBackportDefinitions: Matchers.eachLike(Matchers.string()),
              backports: Matchers.eachLike({
                mergeConfigurationId: Matchers.string(),
                startDate: Matchers.string(),
                endDate: Matchers.string(),
                willPublishFinalProduct: Matchers.boolean(),
                initializeDevelopmentState: {
                  startDate: Matchers.string(),
                  endDate: Matchers.string(),
                  destinationBranchName: Matchers.string(),
                  cherryPickBranchName: Matchers.string(),
                  developmentId: Matchers.string(),
                },
                applyBackportDevelopmentState: {
                  startDate: Matchers.string(),
                  endDate: Matchers.string(),
                  requester: Matchers.string(),
                  cherryPickStatus: Matchers.string(),
                },
                mergeDevelopmentState: {
                  startDate: Matchers.string(),
                  endDate: Matchers.string(),
                  latestMergeJobId: Matchers.string(),
                  requester: Matchers.string(),
                  mergeJobIds: Matchers.eachLike(Matchers.string()),
                  canRepush: Matchers.boolean(),
                },
                finalProductPublishing: {
                  id: Matchers.string(),
                  publishingStartDate: Matchers.string(),
                  publishingEndDate: Matchers.string(),
                  finalProductFailure: Matchers.string(),
                },
              }),
            },
          },
        },
      });

      const executionApiModel = await lastValueFrom(
        fetcherService.getBuildAndTestProcessExecution(projectId, processId)
      );

      expect(executionApiModel).not.toBeNull();
    });

    test("validate contract test for fetching a ci process execution by its process id that doesnt exist", async () => {
      await pact.addInteraction({
        state: "a ci process execution does not exist",
        uponReceiving: "a request to fetch a ci process execution",
        withRequest: {
          path: `/projects/${projectId}/business-process/executions/ci-process/${processId}`,
          method: "GET",
        },
        willRespondWith: {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            message: Matchers.string(),
          },
        },
      });

      const errorMessage = await lastValueFrom(
        fetcherService
          .getBuildAndTestProcessExecution(projectId, processId)
          .pipe(catchError((error) => of(error.message)))
      );
      expect(errorMessage).toBeTruthy();
    });
    test("validate contract test for fetching ci process executions with filters", async () => {
      await pact.addInteraction({
        state: "fetching ci process executions by ids",
        uponReceiving:
          "a request to fetch ci process executions with ids filter",
        withRequest: {
          path: `/projects/${projectId}/business-process/executions/ci-process`,
          method: "GET",
          query: {
            ids: ["execution-id-1", "execution-id-2"],
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            totalElements: Matchers.integer(),
            content: eachLike({
              id: Matchers.string(),
              name: Matchers.string(),
              startDate: Matchers.string(),
              endDate: Matchers.string(),
              expiryDate: Matchers.string(),
              status: Matchers.string(),
              owner: Matchers.string(),
              definitionName: Matchers.string(),
              processName: Matchers.string(),
              input: like({
                configurationBranchName: Matchers.string(),
              }),
            }),
          },
        },
      });

      const result = await lastValueFrom(
        ciProcessExecutionsService.getCiProcessExecutions(projectId, {
          ids: ["execution-id-1", "execution-id-2"],
        })
      );

      expect(result).not.toBeNull();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.totalElements).toBeDefined();
    });
  });

  test("should validate the contract test for sending changes for review with backport", async () => {
    await pact.addInteraction({
      state:
        "a ci process exists and can send changes for review with backport",
      uponReceiving: "a request to send changes for review",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/ci-process/${processId}/user-input/send-changes-for-review`,
        method: "POST",
        body: {
          mergeJobTitle: Matchers.string(),
          mergeConfigurationId: Matchers.string(),
          mergeJobReviewers: Matchers.eachLike(Matchers.string()),
          backportChanges: Matchers.boolean(),
          backportInputs: Matchers.eachLike({
            definitionId: Matchers.string(),
            repositoryId: Matchers.string(),
            mergeConfigurationId: Matchers.string(),
            buildAndTestInfraGroupId: Matchers.string(),
          }),
          shouldCleanDevelopment: Matchers.boolean(),
          developmentId: Matchers.string(),
          supportsResourceManagement: Matchers.boolean(),
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    await expect(
      lastValueFrom(
        ciProcessExecutionService.sendChangesForReview({
          projectId: projectId,
          ciProcessExecutionId: processId,
          mergeJobReviewers: [reviewer],
          mergeJobTitle: title,
          mergeConfigurationId: mergeConfigurationId,
          backportChanges: true,
          backportInputs: [
            {
              definitionId: backportDefinitionIds,
              repositoryId: "backportRepositoryId",
              mergeConfigurationId: "backportMergeConfigId",
              buildAndTestInfraGroupId: "backportInfraGroup",
            },
          ],
          shouldCleanDevelopment: false,
          developmentId: "developmentId",
          supportsResourceManagement: true,
        })
      )
    ).resolves.not.toThrow();
  });

  test("should validate the contract test for send changes for review without backport", async () => {
    await pact.addInteraction({
      state:
        "a ci process exists and can send changes for review without backport",
      uponReceiving: "a request to send changes for review",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/ci-process/${processId}/user-input/send-changes-for-review`,
        method: "POST",
        body: {
          mergeJobTitle: Matchers.string(),
          mergeConfigurationId: Matchers.string(),
          mergeJobReviewers: Matchers.eachLike(Matchers.string()),
          backportChanges: false,
          backportInputs: [],
          shouldCleanDevelopment: Matchers.boolean(),
          developmentId: Matchers.string(),
          supportsResourceManagement: Matchers.boolean(),
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    await expect(
      lastValueFrom(
        ciProcessExecutionService.sendChangesForReview({
          projectId: projectId,
          ciProcessExecutionId: processId,
          mergeJobReviewers: [reviewer],
          mergeJobTitle: title,
          mergeConfigurationId: mergeConfigurationId,
          backportChanges: false,
          backportInputs: [],
          shouldCleanDevelopment: false,
          developmentId: "developmentId",
          supportsResourceManagement: true,
        })
      )
    ).resolves.not.toThrow();
  });

  test("should validate the contract test for sending changes for review when cannot accept decision", async () => {
    await pact.addInteraction({
      state: "ci process send changes for review request failed",
      uponReceiving: "a request to send changes for review",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/ci-process/${processId}/user-input/send-changes-for-review`,
        method: "POST",
        body: {
          mergeJobTitle: Matchers.string(),
          mergeConfigurationId: Matchers.string(),
          mergeJobReviewers: Matchers.eachLike(Matchers.string()),
          backportChanges: Matchers.boolean(),
          backportInputs: Matchers.eachLike({
            definitionId: Matchers.string(),
            repositoryId: Matchers.string(),
            mergeConfigurationId: Matchers.string(),
            buildAndTestInfraGroupId: Matchers.string(),
          }),
          shouldCleanDevelopment: Matchers.boolean(),
          developmentId: Matchers.string(),
          supportsResourceManagement: Matchers.boolean(),
        },
      },
      willRespondWith: {
        status: 409,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: Matchers.string(),
        },
      },
    });

    const errorMessage = await lastValueFrom(
      ciProcessExecutionService
        .sendChangesForReview({
          projectId: projectId,
          ciProcessExecutionId: processId,
          mergeJobReviewers: [reviewer],
          mergeJobTitle: title,
          mergeConfigurationId: mergeConfigurationId,
          backportChanges: true,
          backportInputs: [
            {
              definitionId: backportDefinitionIds,
              repositoryId: "backportRepositoryId",
              mergeConfigurationId: "backportMergeConfigId",
              buildAndTestInfraGroupId: "backportInfraGroup",
            },
          ],
          shouldCleanDevelopment: false,
          developmentId: "developmentId",
          supportsResourceManagement: true,
        })
        .pipe(catchError((error) => of(error.message)))
    );
    expect(errorMessage).not.toBeNull();
  });

  describe("querying ci process executions contract tests", () => {
    test("querying ci process executions returns the total count and executions with filters", async () => {
      await pact.addInteraction({
        state: "ci process executions exist with filters",
        uponReceiving: "a request to query ci process executions",
        withRequest: {
          path: `/projects/${projectId}/business-process/executions/ci-process`,
          method: "GET",
          query: {
            page: Matchers.term({
              generate: PAGE.toString(),
              matcher: "[0-9]+",
            }),
            pageSize: Matchers.term({
              generate: PAGE_SIZE.toString(),
              matcher: "[0-9]+",
            }),
            definitionIds: Matchers.string(),
            userStoryIds: Matchers.string(),
            statuses: Matchers.term({
              generate: "NOT_STARTED",
              matcher: ".*",
            }),
            hidden: Matchers.term({
              generate: "false",
              matcher: "true|false",
            }),
            configurationBranchNamePhrase: Matchers.string(),
            ownerPhrase: Matchers.string(),
            startDateRangeStart: Matchers.iso8601DateTimeWithMillis(),
            startDateRangeEnd: Matchers.iso8601DateTimeWithMillis(),
            endDateRangeStart: Matchers.iso8601DateTimeWithMillis(),
            endDateRangeEnd: Matchers.iso8601DateTimeWithMillis(),
            expiryDateRangeStart: Matchers.iso8601DateTimeWithMillis(),
            expiryDateRangeEnd: Matchers.iso8601DateTimeWithMillis(),
            namePhrase: Matchers.string(),
            sort: Matchers.string(),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
          body: like({
            totalElements: Matchers.integer(),
            content: eachLike({
              id: Matchers.string(),
              name: Matchers.string(),
              startDate: Matchers.string(),
              endDate: Matchers.string(),
              expiryDate: Matchers.string(),
              status: Matchers.string(),
              owner: Matchers.string(),
              definitionName: Matchers.string(),
              processName: Matchers.string(),
              input: like({
                configurationBranchName: Matchers.string(),
                userStoryIds: Matchers.eachLike(Matchers.string()),
              }),
            }),
          }),
        },
      });

      const executionApiModel = await lastValueFrom(
        ciProcessExecutionsService.getCiProcessExecutions(projectId, {
          page: PAGE,
          pageSize: PAGE_SIZE,
          definitionIds: DEFINITION_IDS,
          userStoryIds: USER_STORY_IDS,
          statuses: STATUSES,
          configurationBranchNamePhrase: CONFIG_BRANCH_NAME,
          ownerPhrase: OWNER,
          startDateRangeStart: START_DATE_RANGE_START,
          startDateRangeEnd: START_DATE_RANGE_END,
          endDateRangeStart: END_DATE_RANGE_START,
          endDateRangeEnd: END_DATE_RANGE_END,
          expiryDateRangeStart: EXPIRY_DATE_RANGE_START,
          expiryDateRangeEnd: EXPIRY_DATE_RANGE_END,
          namePhrase: NAME,
          sort: "startDate,asc",
          hidden: false,
        })
      );

      expect(executionApiModel).not.toBeNull();
    });

    test("querying ci process executions returns the total count and executions without filters", async () => {
      await pact.addInteraction({
        state: "ci process executions exist without filters",
        uponReceiving:
          "a request to query ci process executions without filters",
        withRequest: {
          path: `/projects/${projectId}/business-process/executions/ci-process`,
          method: "GET",
          query: {
            page: Matchers.term({
              generate: PAGE.toString(),
              matcher: "[0-9]+",
            }),
            pageSize: Matchers.term({
              generate: PAGE_SIZE.toString(),
              matcher: "[0-9]+",
            }),
          },
        },
        willRespondWith: {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: like({
            totalElements: Matchers.integer(),
            content: eachLike({
              id: Matchers.string(),
              name: Matchers.string(),
              startDate: Matchers.string(),
              endDate: Matchers.string(),
              expiryDate: Matchers.string(),
              status: Matchers.string(),
              owner: Matchers.string(),
              definitionName: Matchers.string(),
              processName: Matchers.string(),
              input: like({
                configurationBranchName: Matchers.string(),
                userStoryIds: Matchers.eachLike(Matchers.string()),
              }),
            }),
          }),
        },
      });

      const executionApiModel = await lastValueFrom(
        ciProcessExecutionsService.getCiProcessExecutions(projectId, {
          page: PAGE,
          pageSize: PAGE_SIZE,
        })
      );

      expect(executionApiModel).not.toBeNull();
    });
  });

  test("validate contract for fixing the integrate changes issues", async () => {
    await pact.addInteraction({
      state:
        "a ci process exists and waiting for a user input for the integrate changes after the merge job failed",
      uponReceiving: "a request to fix the integrate changes issues",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/ci-process/${processId}/user-input/fix-integration-issues`,
        method: "POST",
      },
      willRespondWith: {
        status: 204,
      },
    });

    await lastValueFrom(
      ciProcessExecutionService.fixIntegrationIssues(projectId, processId)
    );
  });

  test("validate contract for fixing the integrate changes issues when cannot accept decision", async () => {
    await pact.addInteraction({
      state: "ci process pause integrate changes stage request failed",
      uponReceiving: "a request to fix the integrate changes issues",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/ci-process/${processId}/user-input/fix-integration-issues`,
        method: "POST",
      },
      willRespondWith: {
        status: 409,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: Matchers.string(),
        },
      },
    });

    const errorMessage = await lastValueFrom(
      ciProcessExecutionService
        .fixIntegrationIssues(projectId, processId)
        .pipe(catchError((error) => of(error.message)))
    );
    expect(errorMessage).not.toBeNull();
  });

  test("validate contract for commits cherry picked", async () => {
    await pact.addInteraction({
      state: "a ci process exists and waiting for a user to cherry pick commit",
      uponReceiving: "a request that commits are cherry picked",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/ci-process/${processId}/user-input/commits-cherry-picked`,
        method: "POST",
        body: {
          mergeConfigurationId: Matchers.string(),
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    await lastValueFrom(
      ciProcessExecutionService.commitsCherryPicked({
        projectId: projectId,
        processExecutionId: processId,
        mergeConfigurationId: destinationBranchName,
      })
    );
  });

  test("validate contract for commits cherry picked when cannot accept decision", async () => {
    await pact.addInteraction({
      state:
        "a ci process exists and not waiting for a user to cherry pick commit",
      uponReceiving: "a request that commits are cherry picked",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/ci-process/${processId}/user-input/commits-cherry-picked`,
        method: "POST",
        body: {
          mergeConfigurationId: Matchers.string(),
        },
      },
      willRespondWith: {
        status: 409,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: Matchers.string(),
        },
      },
    });

    const errorMessage = await lastValueFrom(
      ciProcessExecutionService
        .commitsCherryPicked({
          projectId: projectId,
          processExecutionId: processId,
          mergeConfigurationId: destinationBranchName,
        })
        .pipe(catchError((error) => of(error.message)))
    );
    expect(errorMessage).not.toBeNull();
  });

  test("validate contract for repushing backport merge request", async () => {
    await pact.addInteraction({
      state:
        "a ci process exists and waiting for a user to repush backport merge request",
      uponReceiving: "a request to repush backport merge request",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/ci-process/${processId}/user-input/repush-backport-merge-job`,
        method: "POST",
        body: {
          mergeConfigurationId: Matchers.string(),
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    await lastValueFrom(
      ciProcessExecutionService.repushBackportMergeRequest({
        projectId: projectId,
        processExecutionId: processId,
        mergeConfigurationId: destinationBranchName,
      })
    );
  });

  test("validate contract for repushing backport merger request when cannot accept decision", async () => {
    await pact.addInteraction({
      state:
        "a ci process exists and not waiting for a user to repush backport merge request",
      uponReceiving: "a request to repush backport merge request",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/ci-process/${processId}/user-input/repush-backport-merge-job`,
        method: "POST",
        body: {
          mergeConfigurationId: Matchers.string(),
        },
      },
      willRespondWith: {
        status: 409,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: Matchers.string(),
        },
      },
    });

    const errorMessage = await lastValueFrom(
      ciProcessExecutionService
        .repushBackportMergeRequest({
          projectId: projectId,
          processExecutionId: processId,
          mergeConfigurationId: destinationBranchName,
        })
        .pipe(catchError((error) => of(error.message)))
    );
    expect(errorMessage).not.toBeNull();
  });

  test("validate contract for proceeding with predefined inputs", async () => {
    await pact.addInteraction({
      state:
        "a ci process exists and waiting for a user to proceed with predefined inputs",
      uponReceiving: "a request to proceed with predefined inputs",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/ci-process/${processId}/user-input/proceed-with-predefined-inputs`,
        method: "POST",
        body: {
          shouldCleanDevelopment: Matchers.boolean(),
          developmentId: Matchers.string(),
          supportsResourceManagement: Matchers.boolean(),
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    await expect(
      lastValueFrom(
        ciProcessExecutionService.proceedWithPredefinedInputs({
          projectId: projectId,
          ciProcessExecutionId: processId,
          shouldCleanDevelopment: false,
          developmentId: "developmentId",
          supportsResourceManagement: true,
        })
      )
    ).resolves.not.toThrow();
  });

  test("validate contract for proceeding with predefined inputs when cannot accept decision", async () => {
    await pact.addInteraction({
      state:
        "a ci process does not have predefined merge request inputs available",
      uponReceiving: "a request to proceed with predefined inputs",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/ci-process/${processId}/user-input/proceed-with-predefined-inputs`,
        method: "POST",
        body: {
          shouldCleanDevelopment: Matchers.boolean(),
          developmentId: Matchers.string(),
          supportsResourceManagement: Matchers.boolean(),
        },
      },
      willRespondWith: {
        status: 409,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: Matchers.string(),
        },
      },
    });

    const errorMessage = await lastValueFrom(
      ciProcessExecutionService
        .proceedWithPredefinedInputs({
          projectId: projectId,
          ciProcessExecutionId: processId,
          shouldCleanDevelopment: false,
          developmentId: "developmentId",
          supportsResourceManagement: true,
        })
        .pipe(catchError((error) => of(error.message)))
    );
    expect(errorMessage).not.toBeNull();
  });

  test("validate contract for proceeding with predefined inputs with resource management support", async () => {
    await pact.addInteraction({
      state:
        "ci process proceeding with predefined inputs with resource management support",
      uponReceiving:
        "a request to proceed with predefined inputs with resource management",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/ci-process/${processId}/user-input/proceed-with-predefined-inputs`,
        // projects/{projectId}/business-process/executions/ci-process
        method: "POST",
        body: {
          shouldCleanDevelopment: Matchers.boolean(),
          developmentId: Matchers.string(),
          supportsResourceManagement: Matchers.boolean(),
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    await expect(
      lastValueFrom(
        ciProcessExecutionService.proceedWithPredefinedInputs({
          projectId: projectId,
          ciProcessExecutionId: processId,
          shouldCleanDevelopment: true,
          developmentId: "developmentId",
          supportsResourceManagement: true,
        })
      )
    ).resolves.not.toThrow();
  });
});
