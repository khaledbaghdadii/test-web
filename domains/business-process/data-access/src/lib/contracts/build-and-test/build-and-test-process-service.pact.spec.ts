import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { Matchers, Pact } from "@pact-foundation/pact";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { lastValueFrom } from "rxjs";
import { BuildAndTestExecutionFetcherService } from "../../build-and-test/build-and-test-execution-fetcher.service";
import { BuildAndTestExecutionsService } from "../../build-and-test/build-and-test-executions.service";
import { BuildAndTestUserInputService } from "../../build-and-test/build-and-test-user-input.service";
import { BusinessProcessDefinitionService } from "../../build-and-test/business-process-definition.service";

const PROJECT_ID = "projectId";
const PROCESS_ID = "processId";

describe("Build and Test process service contract tests", () => {
  const provider = new Pact({
    consumer: "web-bp",
    provider: "business-process-execution-service",
  });

  let appConfig: AppConfig;
  let executionFetcher: BuildAndTestExecutionFetcherService;
  let executionsService: BuildAndTestExecutionsService;
  let userInputService: BuildAndTestUserInputService;
  let definitionService: BusinessProcessDefinitionService;

  beforeAll(async () => {
    await provider.setup();
    appConfig = {
      gatewayUrl: `http://127.0.0.1:${provider.opts.port}/`,
    };
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        BuildAndTestExecutionFetcherService,
        BuildAndTestExecutionsService,
        BuildAndTestUserInputService,
        BusinessProcessDefinitionService,
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    executionFetcher = TestBed.inject(BuildAndTestExecutionFetcherService);
    executionsService = TestBed.inject(BuildAndTestExecutionsService);
    userInputService = TestBed.inject(BuildAndTestUserInputService);
    definitionService = TestBed.inject(BusinessProcessDefinitionService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("fetches a CI process execution with merge and backport fields", async () => {
    await provider.addInteraction({
      state: "a ci process execution exists",
      uponReceiving: "a request to fetch a ci process execution by id from web-bp",
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/executions/ci-process/${PROCESS_ID}`,
        method: "GET",
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          id: Matchers.string(PROCESS_ID),
          name: Matchers.string("Build and Test"),
          projectId: Matchers.string(PROJECT_ID),
          definitionId: Matchers.string("definitionId"),
          definitionName: Matchers.string("definitionName"),
          familyName: Matchers.string("Build & Test"),
          processName: Matchers.string("CI"),
          owner: Matchers.string("owner"),
          startDate: Matchers.string("2026-06-08T10:00:00Z"),
          endDate: Matchers.string("2026-06-08T11:00:00Z"),
          expiryDate: Matchers.string("2026-06-15T10:00:00Z"),
          supportsResourceManagement: Matchers.boolean(),
          hasPredefinedMergeRequestInputs: Matchers.boolean(),
          notificationsRecipients: Matchers.eachLike(Matchers.string("user")),
          ciVersion: Matchers.integer(2),
          source: {
            id: Matchers.string("sourceId"),
            type: Matchers.term({
              generate: "BUSINESS_PROCESS",
              matcher: "BUSINESS_PROCESS|USER",
            }),
          },
          input: {
            repositoryId: Matchers.string("repositoryId"),
            configurationBranchName: Matchers.string("configurationBranchName"),
            configurationParentBranch: Matchers.string("master"),
            userStoryIds: Matchers.eachLike(Matchers.string("VAL-1")),
            buildEnvironment: {
              skipEnvironmentDeployment: Matchers.boolean(),
              scenarioDefinitionId: Matchers.string("scenarioDefinitionId"),
            },
            buildAndTestInfraGroup: Matchers.string("infraGroup"),
            buildEnvironmentInfraGroup: Matchers.string("buildInfraGroup"),
          },
          status: Matchers.string("RUNNING"),
          createBranchStage: {
            developmentId: Matchers.string("developmentId"),
            name: Matchers.string("Create Branch"),
            status: Matchers.string("PASSED"),
            startDate: Matchers.string("2026-06-08T10:00:00Z"),
            endDate: Matchers.string("2026-06-08T10:05:00Z"),
          },
          prepareBuildStage: {
            name: Matchers.string("Prepare Setup"),
            status: Matchers.string("PASSED"),
            startDate: Matchers.string("2026-06-08T10:05:00Z"),
            endDate: Matchers.string("2026-06-08T10:15:00Z"),
            requester: Matchers.string("requester"),
            latestScenarioExecutionId: Matchers.string("scenarioExecutionId"),
          },
          buildAndTestStage: {
            name: Matchers.string("Build & Test"),
            status: Matchers.string("PASSED"),
            startDate: Matchers.string("2026-06-08T10:15:00Z"),
            endDate: Matchers.string("2026-06-08T10:45:00Z"),
            requester: Matchers.string("requester"),
            technicalReseedExecutionGroupId: Matchers.string("reseedGroupId"),
            scenarioExecutionGroup: Matchers.string("scenarioGroupId"),
            readyForBuildAndTest: Matchers.boolean(),
            cherryPickRunning: Matchers.boolean(),
            cherryPickFailed: Matchers.boolean(),
          },
          integrateChangesStage: {
            name: Matchers.string("Merge"),
            status: Matchers.string("PENDING_INPUT"),
            startDate: Matchers.string("2026-06-08T10:45:00Z"),
            endDate: Matchers.string("2026-06-08T11:00:00Z"),
            requester: Matchers.string("requester"),
            latestMergeJobId: Matchers.string("mergeJobId"),
            backportRequested: Matchers.boolean(),
            willPublishFinalProduct: Matchers.boolean(),
            finalProductPublishing: {
              id: Matchers.string("finalProductId"),
              publishingStartDate: Matchers.string("2026-06-08T11:00:00Z"),
              publishingEndDate: Matchers.string("2026-06-08T11:10:00Z"),
              finalProductFailure: Matchers.string(
                "FAILURE_PRE_PUBLISHING_REQUESTED"
              ),
            },
            backportMergeConfigurationIds: Matchers.eachLike(
              Matchers.string("backportConfigId")
            ),
            backportStopRequester: Matchers.string("backportRequester"),
            canStopBackport: Matchers.boolean(),
            backportExecutions: Matchers.eachLike(
              Matchers.string("backportExecutionId")
            ),
            failedBackportDefinitions: Matchers.eachLike(
              Matchers.string("definitionId")
            ),
            backports: Matchers.eachLike({
              mergeConfigurationId: Matchers.string("mergeConfigId"),
              startDate: Matchers.string("2026-06-08T11:00:00Z"),
              endDate: Matchers.string("2026-06-08T11:05:00Z"),
              willPublishFinalProduct: Matchers.boolean(),
              initializeDevelopmentState: {
                startDate: Matchers.string("2026-06-08T11:00:00Z"),
                endDate: Matchers.string("2026-06-08T11:01:00Z"),
                destinationBranchName: Matchers.string("support/1"),
                cherryPickBranchName: Matchers.string("cherry-pick/1"),
                developmentId: Matchers.string("backportDevelopmentId"),
              },
              applyBackportDevelopmentState: {
                startDate: Matchers.string("2026-06-08T11:01:00Z"),
                endDate: Matchers.string("2026-06-08T11:02:00Z"),
                requester: Matchers.string("requester"),
                cherryPickStatus: Matchers.string("commits-cherry-picked"),
              },
              mergeDevelopmentState: {
                startDate: Matchers.string("2026-06-08T11:02:00Z"),
                endDate: Matchers.string("2026-06-08T11:03:00Z"),
                latestMergeJobId: Matchers.string("backportMergeJobId"),
                requester: Matchers.string("requester"),
                mergeJobIds: Matchers.eachLike(
                  Matchers.string("backportMergeJobId")
                ),
                canRepush: Matchers.boolean(),
              },
              finalProductPublishing: {
                id: Matchers.string("backportFinalProductId"),
                publishingStartDate: Matchers.string("2026-06-08T11:03:00Z"),
                publishingEndDate: Matchers.string("2026-06-08T11:04:00Z"),
                finalProductFailure: Matchers.string(
                  "FAILURE_PRE_PUBLISHING_REQUESTED"
                ),
              },
            }),
          },
        },
      },
    });

    const execution = await lastValueFrom(
      executionFetcher.fetchExecution(PROJECT_ID, PROCESS_ID)
    );

    expect(execution.id).toBe(PROCESS_ID);
  });

  test("sends changes for review with v2 on-demand backport inputs", async () => {
    await provider.addInteraction({
      state: "a ci process exists and can send changes for review with backport",
      uponReceiving:
        "a request to send CI changes for review with on-demand backport inputs from web-bp",
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/executions/ci-process/${PROCESS_ID}/user-input/send-changes-for-review`,
        method: "POST",
        body: {
          mergeJobTitle: Matchers.string("VAL-1"),
          mergeConfigurationId: Matchers.string("mergeConfigId"),
          mergeJobReviewers: Matchers.eachLike(Matchers.string("reviewer")),
          backportChanges: true,
          backportInputs: Matchers.eachLike({
            definitionId: Matchers.string("definitionId"),
            repositoryId: Matchers.string("repositoryId"),
            mergeConfigurationId: Matchers.string("backportMergeConfigId"),
            buildAndTestInfraGroupId: Matchers.string("infraGroup"),
          }),
          shouldCleanDevelopment: Matchers.boolean(),
          developmentId: Matchers.string("developmentId"),
          supportsResourceManagement: Matchers.boolean(),
        },
      },
      willRespondWith: { status: 204 },
    });

    await lastValueFrom(
      userInputService.sendChangesForReview({
        projectId: PROJECT_ID,
        processId: PROCESS_ID,
        mergeJobTitle: "VAL-1",
        mergeConfigurationId: "mergeConfigId",
        mergeJobReviewers: ["reviewer"],
        backportChanges: true,
        backportInputs: [
          {
            definitionId: "definitionId",
            repositoryId: "repositoryId",
            mergeConfigurationId: "backportMergeConfigId",
            buildAndTestInfraGroupId: "infraGroup",
          },
        ],
        shouldCleanDevelopment: true,
        developmentId: "developmentId",
        supportsResourceManagement: true,
      })
    );
  });

  test("sends changes for review without backport", async () => {
    await provider.addInteraction({
      state: "a ci process exists and can send changes for review without backport",
      uponReceiving:
        "a request to send CI changes for review without backport from web-bp",
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/executions/ci-process/${PROCESS_ID}/user-input/send-changes-for-review`,
        method: "POST",
        body: {
          mergeJobTitle: Matchers.string("VAL-1"),
          mergeConfigurationId: Matchers.string("mergeConfigId"),
          mergeJobReviewers: Matchers.eachLike(Matchers.string("reviewer")),
          backportChanges: false,
          backportInputs: [],
          shouldCleanDevelopment: Matchers.boolean(),
          developmentId: Matchers.string("developmentId"),
          supportsResourceManagement: Matchers.boolean(),
        },
      },
      willRespondWith: { status: 204 },
    });

    await lastValueFrom(
      userInputService.sendChangesForReview({
        projectId: PROJECT_ID,
        processId: PROCESS_ID,
        mergeJobTitle: "VAL-1",
        mergeConfigurationId: "mergeConfigId",
        mergeJobReviewers: ["reviewer"],
        backportChanges: false,
        backportInputs: [],
        shouldCleanDevelopment: true,
        developmentId: "developmentId",
        supportsResourceManagement: true,
      })
    );
  });

  test.each([
    ["proceed-with-predefined-inputs", "proceedWithPredefinedInputs"],
    ["reopen-merge-request", "reopenMergeRequest"],
    ["fix-integration-issues", "fixIntegrationIssues"],
    ["commits-cherry-picked", "commitsCherryPicked"],
    ["repush-backport-merge-job", "repushBackportMergeRequest"],
  ])("posts CI user input action %s", async (path, methodName) => {
    const body =
      methodName === "proceedWithPredefinedInputs"
        ? {
            shouldCleanDevelopment: Matchers.boolean(),
            developmentId: Matchers.string("developmentId"),
            supportsResourceManagement: Matchers.boolean(),
          }
        : methodName === "reopenMergeRequest"
        ? {}
        : methodName === "fixIntegrationIssues"
        ? {}
        : { mergeConfigurationId: Matchers.string("mergeConfigId") };

    await provider.addInteraction({
      state: `a ci process accepts ${path}`,
      uponReceiving: `a request to ${path} from web-bp`,
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/executions/ci-process/${PROCESS_ID}/user-input/${path}`,
        method: "POST",
        body,
      },
      willRespondWith: { status: 204 },
    });

    if (methodName === "proceedWithPredefinedInputs") {
      await lastValueFrom(
        userInputService.proceedWithPredefinedInputs({
          projectId: PROJECT_ID,
          processId: PROCESS_ID,
          shouldCleanDevelopment: true,
          developmentId: "developmentId",
          supportsResourceManagement: true,
        })
      );
    } else if (methodName === "reopenMergeRequest") {
      await lastValueFrom(
        userInputService.reopenMergeRequest({
          projectId: PROJECT_ID,
          processId: PROCESS_ID,
        })
      );
    } else if (methodName === "fixIntegrationIssues") {
      await lastValueFrom(
        userInputService.fixIntegrationIssues(PROJECT_ID, PROCESS_ID)
      );
    } else if (methodName === "commitsCherryPicked") {
      await lastValueFrom(
        userInputService.commitsCherryPicked({
          projectId: PROJECT_ID,
          processId: PROCESS_ID,
          mergeConfigurationId: "mergeConfigId",
        })
      );
    } else {
      await lastValueFrom(
        userInputService.repushBackportMergeRequest({
          projectId: PROJECT_ID,
          processId: PROCESS_ID,
          mergeConfigurationId: "mergeConfigId",
        })
      );
    }
  });

  test("queries CI executions by ids for backport summary", async () => {
    await provider.addInteraction({
      state: "fetching ci process executions by ids",
      uponReceiving:
        "a request to query CI executions by ids for backport summary from web-bp",
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/executions/ci-process`,
        method: "GET",
        query: {
          ids: ["backportExecutionId"],
        },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          totalElements: Matchers.integer(1),
          content: Matchers.eachLike({
            id: Matchers.string("backportExecutionId"),
            name: Matchers.string("Backport execution"),
            startDate: Matchers.string("2026-06-08T11:00:00Z"),
            endDate: Matchers.string("2026-06-08T12:00:00Z"),
            expiryDate: Matchers.string("2026-06-15T11:00:00Z"),
            status: Matchers.string("PASSED"),
            owner: Matchers.string("owner"),
            definitionName: Matchers.string("Build and Test"),
            processName: Matchers.string("CI"),
            input: {
              configurationBranchName: Matchers.string("branch"),
              userStoryIds: Matchers.eachLike(Matchers.string("VAL-1")),
            },
          }),
        },
      },
    });

    const executions = await lastValueFrom(
      executionsService.getBuildAndTestExecutions(PROJECT_ID, {
        ids: ["backportExecutionId"],
      })
    );

    expect(executions.content.length).toBeGreaterThan(0);
  });

  test("fetches executable non-extendable business process definitions", async () => {
    await provider.addInteraction({
      state: "business process definitions exist",
      uponReceiving:
        "a request to fetch executable business process definitions from web-bp",
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/definitions`,
        method: "GET",
        query: {
          executable: "true",
          extendable: "false",
        },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: Matchers.eachLike({
          id: Matchers.string("definitionId"),
          name: Matchers.string("On-demand backport"),
          processName: Matchers.string("Backport"),
          description: Matchers.string("Definition"),
          sourceDefinitionId: Matchers.string("on-demand-backport"),
          providedInputs: Matchers.eachLike({
            inputId: Matchers.string("repositoryId"),
            value: Matchers.string("repositoryId"),
          }),
        }),
      },
    });

    const definitions = await lastValueFrom(
      definitionService.getBusinessProcessDefinitions({
        projectId: PROJECT_ID,
        executable: true,
        extendable: false,
      })
    );

    expect(definitions.length).toBeGreaterThan(0);
  });
});
