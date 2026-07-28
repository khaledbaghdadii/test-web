import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { Matchers, Pact } from "@pact-foundation/pact";
import { lastValueFrom } from "rxjs";
import { eachLike, like } from "@pact-foundation/pact/src/dsl/matchers";
import { ValidationProcessExecutionFetcherService } from "../../validation-process/validation-process-execution-fetcher.service";
import { ValidationProcessExecutionMapperService } from "../../validation-process/validation-process-execution-mapper.service";

const projectId = "projectId";
const executionId = "executionId";

describe("Validation process execution fetcher service contract tests", () => {
  const provider = new Pact({
    consumer: "web-bp",
    provider: "business-process-execution-service",
  });

  let appConfig: { gatewayUrl: string };

  beforeAll(async () => {
    await provider.setup();
    const port = provider.opts.port;
    appConfig = { gatewayUrl: `http://127.0.0.1:${port}/` };
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        ValidationProcessExecutionFetcherService,
        ValidationProcessExecutionMapperService,
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

  test("validate contract for fetching a master validation execution", async () => {
    await provider.addInteraction({
      state: "a master validation process execution exists",
      uponReceiving:
        "a request to fetch the details of a master validation process execution",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/master-validation/${executionId}`,
        method: "GET",
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          id: Matchers.string(),
          name: Matchers.string(),
          projectId: Matchers.string(),
          projectName: Matchers.string(),
          owner: Matchers.string(),
          sourceDefinitionId: Matchers.string(),
          definitionId: Matchers.string(),
          definitionName: Matchers.string(),
          familyId: Matchers.string(),
          familyName: Matchers.string(),
          processName: Matchers.string(),
          errorMessage: Matchers.string(),
          startDate: Matchers.string(),
          endDate: Matchers.string(),
          expiryDate: Matchers.string(),
          status: Matchers.string(),
          daysExtended: Matchers.integer(),
          officiality: Matchers.string(),
          hidden: Matchers.boolean(),
          businessProcessQualityLevel: Matchers.string(),
          notificationsRecipients: eachLike(Matchers.string()),
          input: {
            repositoryId: Matchers.string(),
            createBranch: Matchers.boolean(),
            archivalBranchName: Matchers.string(),
            parentBranch: Matchers.string(),
            scenarioDefinitionIds: eachLike(Matchers.string()),
            businessProcessQualityLevel: Matchers.string(),
            finalProductId: Matchers.string(),
            qualityGateExecutionInfraGroupId: Matchers.string(),
            configCommitId: Matchers.string(),
            rtpCommitId: Matchers.string(),
            nightlyRepusherEnabled: Matchers.boolean(),
          },
          createBranchStage: {
            name: Matchers.string(),
            status: Matchers.string(),
            startDate: Matchers.string(),
            endDate: Matchers.string(),
            errorMessage: Matchers.string(),
            developmentId: Matchers.string(),
            headCommitIdUponExecution: Matchers.string(),
            createdBranch: Matchers.boolean(),
          },
          executeQualityGatesStage: {
            name: Matchers.string(),
            status: Matchers.string(),
            startDate: Matchers.string(),
            endDate: Matchers.string(),
            errorMessage: Matchers.string(),
            validationResult: like({
              requester: Matchers.string(),
              decision: Matchers.string(),
              comment: Matchers.string(),
            }),
          },
          tagArchivalBranchStage: {
            name: Matchers.string(),
            status: Matchers.string(),
            startDate: Matchers.string(),
            endDate: Matchers.string(),
            errorMessage: Matchers.string(),
            configTagName: Matchers.string(),
            configCommitId: Matchers.string(),
            rtpTagName: Matchers.string(),
            rtpCommitId: Matchers.string(),
            promotedFinalProductId: Matchers.string(),
            promotionSuccessful: Matchers.boolean(),
            promotionErrorMessage: Matchers.string(),
          },
          integrateFixesStage: {
            name: Matchers.string(),
            status: Matchers.string(),
            startDate: Matchers.string(),
            endDate: Matchers.string(),
            errorMessage: Matchers.string(),
            latestMergeJobId: Matchers.string(),
            stopActionMaker: Matchers.string(),
            skipActionMaker: Matchers.string(),
            finalProductPublishing: like({
              id: Matchers.string(),
              publishingStartDate: Matchers.string(),
            }),
          },
        },
      },
    });

    const service = TestBed.inject(ValidationProcessExecutionFetcherService);
    const execution = await lastValueFrom(
      service.fetchExecution(projectId, executionId)
    );

    expect(execution).not.toBeNull();
    expect(execution.id).toBeTruthy();
  });
});
