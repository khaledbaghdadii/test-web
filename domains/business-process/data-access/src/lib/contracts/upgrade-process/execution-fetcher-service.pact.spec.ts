import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { Matchers, Pact } from "@pact-foundation/pact";
import { catchError, lastValueFrom, of } from "rxjs";
import { ExecutionFetcherService } from "../../upgrade-process/execution-fetcher.service";
import { eachLike, like } from "@pact-foundation/pact/src/dsl/matchers";

const projectId = "projectId";
const processId = "processId";

describe("Upgrade process execution fetcher service contract tests", () => {
  const provider = new Pact({
    consumer: "web-bp",
    provider: "business-process-execution-service",
  });

  let appConfig: { gatewayUrl: string };

  beforeAll(async () => {
    await provider.setup();
    const port = provider.opts.port;
    appConfig = {
      gatewayUrl: `http://127.0.0.1:${port}/`,
    };
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        ExecutionFetcherService,
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("validate contract for fetching a business process execution details", async () => {
    const description = "Business process description";

    await provider.addInteraction({
      state: "a binary upgrade process execution exists",
      uponReceiving:
        "a request to fetch the details of a binary upgrade process execution",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/binary-upgrade/${processId}`,
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
          description: like(description),
          startDate: Matchers.string(),
          expiryDate: Matchers.string(),
          endDate: Matchers.string(),
          status: Matchers.string(),
          projectId: Matchers.string(),
          errorMessage: Matchers.string(),
          notificationsRecipients: Matchers.eachLike(Matchers.string()),
          definitionId: Matchers.string(),
          input: {
            factoryProductId: Matchers.string(),
            mxVersion: Matchers.string(),
            mxBuildId: Matchers.string(),
            bipVersion: Matchers.string(),
            bipBuildId: Matchers.string(),
            parentMxArchivalBranch: Matchers.string(),
            upgradeJump: Matchers.string(),
            repositoryId: Matchers.string(),
            businessProcessQualityLevel: Matchers.string(),
            configurationBranchName: Matchers.string(),
            configurationParentBranch: Matchers.string(),
            createBranch: Matchers.boolean(),
            qualityGateExecutionInfraGroupId: Matchers.string(),
            binaryConversionInfraGroupId: Matchers.string(),
            testScenarioIds: eachLike(Matchers.string()),
            binaryConversionTestScenarioId: Matchers.string(),
            referenceCommitId: Matchers.string(),
            referenceFactoryProductId: Matchers.string(),
            referenceMxVersion: Matchers.string(),
            referenceMxBuildId: Matchers.string(),
            referenceBipVersion: Matchers.string(),
            referenceBipBuildId: Matchers.string(),
            referenceEnvironmentDefinitionId: Matchers.string(),
            referenceEnvironmentInfraGroupId: Matchers.string(),
          },
          createBranchStage: {
            developmentId: Matchers.string(),
            createBranch: Matchers.boolean(),
            repositoryId: Matchers.string(),
            lastCommitId: Matchers.string(),
            name: Matchers.string(),
            status: Matchers.string(),
            startDate: Matchers.string(),
            endDate: Matchers.string(),
            errorMessage: Matchers.string(),
          },
          binaryConversionStage: {
            actionRequester: Matchers.string(),
            referenceExecutionId: Matchers.string(),
            decision: Matchers.string(),
            name: Matchers.string(),
            status: Matchers.string(),
            startDate: Matchers.string(),
            endDate: Matchers.string(),
            errorMessage: Matchers.string(),
          },
          executeQualityGateStage: {
            validationResult: {
              requester: Matchers.string(),
              decision: Matchers.string(),
              comment: Matchers.string(),
            },
            keptResourcesDecisionMade: Matchers.boolean(),
            name: Matchers.string(),
            status: Matchers.string(),
            startDate: Matchers.string(),
            endDate: Matchers.string(),
            errorMessage: Matchers.string(),
          },
          tagUpgradeBranchStage: {
            tagName: Matchers.string(),
            taggedCommitId: Matchers.string(),
            name: Matchers.string(),
            status: Matchers.string(),
            startDate: Matchers.string(),
            endDate: Matchers.string(),
            errorMessage: Matchers.string(),
          },
          integrateChangesStage: {
            pullRequestTitle: Matchers.string(),
            sourceBranch: Matchers.string(),
            destinationBranch: Matchers.string(),
            pullRequestUrl: Matchers.string(),
            skipped: Matchers.boolean(),
            requester: Matchers.string(),
            name: Matchers.string(),
            status: Matchers.string(),
            startDate: Matchers.string(),
            endDate: Matchers.string(),
            errorMessage: Matchers.string(),
          },
          referenceEnvironmentDeployment: {
            supported: Matchers.boolean(),
            enabledInCurrentlyActiveStage: Matchers.boolean(),
            limitReached: Matchers.boolean(),
            canCleanAndDeploy: Matchers.boolean(),
            referenceEnvironments: eachLike(Matchers.string()),
            requestIds: eachLike(Matchers.string()),
          },
        },
      },
    });

    const service = TestBed.inject(ExecutionFetcherService);

    const execution = await lastValueFrom(
      service.fetchExecution(projectId, processId)
    );

    expect(execution).not.toBeNull();
    expect(execution.description).toBe(description);
  });

  test("validate contract for fetching a business process execution details when description cannot be resolved", async () => {
    await provider.addInteraction({
      state:
        "a binary upgrade process execution exists but description cannot be resolved",
      uponReceiving:
        "a request to fetch the details of a binary upgrade process execution when description cannot be resolved",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/binary-upgrade/${processId}`,
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
          description: null,
          startDate: Matchers.string(),
          expiryDate: Matchers.string(),
          endDate: Matchers.string(),
          status: Matchers.string(),
          projectId: Matchers.string(),
          errorMessage: Matchers.string(),
          notificationsRecipients: Matchers.eachLike(Matchers.string()),
          definitionId: Matchers.string(),
          input: {
            factoryProductId: Matchers.string(),
            mxVersion: Matchers.string(),
            mxBuildId: Matchers.string(),
            bipVersion: Matchers.string(),
            bipBuildId: Matchers.string(),
            parentMxArchivalBranch: Matchers.string(),
            upgradeJump: Matchers.string(),
            repositoryId: Matchers.string(),
            businessProcessQualityLevel: Matchers.string(),
            configurationBranchName: Matchers.string(),
            configurationParentBranch: Matchers.string(),
            createBranch: Matchers.boolean(),
            qualityGateExecutionInfraGroupId: Matchers.string(),
            binaryConversionInfraGroupId: Matchers.string(),
            testScenarioIds: eachLike(Matchers.string()),
            binaryConversionTestScenarioId: Matchers.string(),
            referenceCommitId: Matchers.string(),
            referenceFactoryProductId: Matchers.string(),
            referenceMxVersion: Matchers.string(),
            referenceMxBuildId: Matchers.string(),
            referenceBipVersion: Matchers.string(),
            referenceBipBuildId: Matchers.string(),
            referenceEnvironmentDefinitionId: Matchers.string(),
            referenceEnvironmentInfraGroupId: Matchers.string(),
          },
          createBranchStage: {
            developmentId: Matchers.string(),
            createBranch: Matchers.boolean(),
            repositoryId: Matchers.string(),
            lastCommitId: Matchers.string(),
            name: Matchers.string(),
            status: Matchers.string(),
            startDate: Matchers.string(),
            endDate: Matchers.string(),
            errorMessage: Matchers.string(),
          },
          binaryConversionStage: {
            actionRequester: Matchers.string(),
            referenceExecutionId: Matchers.string(),
            decision: Matchers.string(),
            name: Matchers.string(),
            status: Matchers.string(),
            startDate: Matchers.string(),
            endDate: Matchers.string(),
            errorMessage: Matchers.string(),
          },
          executeQualityGateStage: {
            validationResult: {
              requester: Matchers.string(),
              decision: Matchers.string(),
              comment: Matchers.string(),
            },
            keptResourcesDecisionMade: Matchers.boolean(),
            name: Matchers.string(),
            status: Matchers.string(),
            startDate: Matchers.string(),
            endDate: Matchers.string(),
            errorMessage: Matchers.string(),
          },
          tagUpgradeBranchStage: {
            tagName: Matchers.string(),
            taggedCommitId: Matchers.string(),
            name: Matchers.string(),
            status: Matchers.string(),
            startDate: Matchers.string(),
            endDate: Matchers.string(),
            errorMessage: Matchers.string(),
          },
          integrateChangesStage: {
            pullRequestTitle: Matchers.string(),
            sourceBranch: Matchers.string(),
            destinationBranch: Matchers.string(),
            pullRequestUrl: Matchers.string(),
            skipped: Matchers.boolean(),
            requester: Matchers.string(),
            name: Matchers.string(),
            status: Matchers.string(),
            startDate: Matchers.string(),
            endDate: Matchers.string(),
            errorMessage: Matchers.string(),
          },
          referenceEnvironmentDeployment: {
            supported: Matchers.boolean(),
            enabledInCurrentlyActiveStage: Matchers.boolean(),
            limitReached: Matchers.boolean(),
            canCleanAndDeploy: Matchers.boolean(),
            referenceEnvironments: eachLike(Matchers.string()),
            requestIds: eachLike(Matchers.string()),
          },
        },
      },
    });

    const service = TestBed.inject(ExecutionFetcherService);

    const execution = await lastValueFrom(
      service.fetchExecution(projectId, processId)
    );

    expect(execution).not.toBeNull();
    expect(execution.description).toBeNull();
  });

  test("validate contract for fetching a business process execution that does not exist", async () => {
    await provider.addInteraction({
      state: "a binary upgrade process execution that does not exists",
      uponReceiving:
        "a request to fetch the details of a binary upgrade process execution",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/binary-upgrade/${processId}`,
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

    const service = TestBed.inject(ExecutionFetcherService);

    const errorMessage: string = await lastValueFrom(
      service
        .fetchExecution(projectId, processId)
        .pipe(catchError((error) => of(error.message)))
    );
    expect(errorMessage).not.toBeNull();
  });
});
