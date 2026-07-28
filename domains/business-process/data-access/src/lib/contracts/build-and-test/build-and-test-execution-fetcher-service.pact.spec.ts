import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { Matchers, Pact } from "@pact-foundation/pact";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { lastValueFrom } from "rxjs";
import { BuildAndTestExecutionsService } from "../../build-and-test/build-and-test-executions/build-and-test-executions.service";

const PROJECT_ID = "projectId";
const PROCESS_ID = "processId";

describe("Build and test execution fetcher service contract tests", () => {
  const provider = new Pact({
    consumer: "web-bp",
    provider: "business-process-execution-service",
  });

  let appConfig: AppConfig;
  let executionFetcher: BuildAndTestExecutionsService;

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
        BuildAndTestExecutionsService,
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    executionFetcher = TestBed.inject(BuildAndTestExecutionsService);
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
      uponReceiving:
        "a request to fetch a ci process execution by id from web-bp",
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
});
