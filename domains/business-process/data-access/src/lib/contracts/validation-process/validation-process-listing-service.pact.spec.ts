import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { Matchers, Pact } from "@pact-foundation/pact";
import { lastValueFrom } from "rxjs";
import { eachLike, like } from "@pact-foundation/pact/src/dsl/matchers";
import { ValidationProcessListingService } from "../../validation-process/validation-process-listing.service";
import { ValidationProcessExecutionMapperService } from "../../validation-process/validation-process-execution-mapper.service";

const projectId = "projectId";

describe("Validation process listing service contract tests", () => {
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
        ValidationProcessListingService,
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

  test("querying master validation process executions with filters returns the total count and executions", async () => {
    await provider.addInteraction({
      state: "master validation process executions exist with filters",
      uponReceiving:
        "a request to query master validation process executions with filters",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/master-validation`,
        method: "GET",
        query: {
          page: Matchers.term({ generate: "1", matcher: "[0-9]+" }),
          pageSize: Matchers.term({ generate: "10", matcher: "[0-9]+" }),
          namePhrase: Matchers.string(),
          ownerPhrase: Matchers.string(),
          statuses: Matchers.term({ generate: "RUNNING", matcher: ".*" }),
          officiality: Matchers.term({
            generate: "OFFICIAL",
            matcher: "OFFICIAL|UNOFFICIAL|NA",
          }),
          businessProcessQualityLevel: Matchers.term({
            generate: "MQG",
            matcher: "MQG|DQG|NA",
          }),
          hidden: Matchers.term({ generate: "false", matcher: "true|false" }),
          sort: Matchers.string(),
          startDateRangeStart: Matchers.iso8601DateTimeWithMillis(),
          startDateRangeEnd: Matchers.iso8601DateTimeWithMillis(),
          endDateRangeStart: Matchers.iso8601DateTimeWithMillis(),
          endDateRangeEnd: Matchers.iso8601DateTimeWithMillis(),
          expiryDateRangeStart: Matchers.iso8601DateTimeWithMillis(),
          expiryDateRangeEnd: Matchers.iso8601DateTimeWithMillis(),
        },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: like({
          totalElements: Matchers.integer(),
          last: Matchers.boolean(),
          content: eachLike({
            id: Matchers.string(),
            name: Matchers.string(),
            projectId: Matchers.string(),
            projectName: Matchers.string(),
            owner: Matchers.string(),
            definitionName: Matchers.string(),
            processName: Matchers.string(),
            startDate: Matchers.string(),
            endDate: Matchers.string(),
            expiryDate: Matchers.string(),
            status: Matchers.string(),
            officiality: Matchers.string(),
            businessProcessQualityLevel: Matchers.string(),
            daysExtended: Matchers.integer(),
            hidden: Matchers.boolean(),
            familyId: Matchers.string(),
            familyName: Matchers.string(),
            definitionId: Matchers.string(),
            sourceDefinitionId: Matchers.string(),
            errorMessage: Matchers.string(),
            input: {
              repositoryId: Matchers.string(),
              createBranch: Matchers.boolean(),
              archivalBranchName: Matchers.string(),
              parentBranch: Matchers.string(),
              businessProcessQualityLevel: Matchers.string(),
              finalProductId: Matchers.string(),
              rtpCommitId: Matchers.string(),
              nightlyRepusherEnabled: Matchers.boolean(),
              configCommitId: Matchers.string(),
              qualityGateExecutionInfraGroupId: Matchers.string(),
              scenarioDefinitionIds: eachLike(Matchers.string()),
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
              validationResult: null,
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
          }),
        }),
      },
    });

    const service = TestBed.inject(ValidationProcessListingService);
    const result = await lastValueFrom(
      service.getValidationProcessExecutions(projectId, {
        page: 1,
        pageSize: 10,
        namePhrase: "some-exec",
        ownerPhrase: "owner1",
        statuses: ["RUNNING"],
        officiality: ["OFFICIAL"],
        businessProcessQualityLevel: ["MQG"],
        hidden: false,
        sort: "startDate,asc",
        startDateRangeStart: "2024-01-01T00:00:00.000Z",
        startDateRangeEnd: "2024-12-31T23:59:59.999Z",
        endDateRangeStart: "2024-01-01T00:00:00.000Z",
        endDateRangeEnd: "2024-12-31T23:59:59.999Z",
        expiryDateRangeStart: "2024-01-01T00:00:00.000Z",
        expiryDateRangeEnd: "2024-12-31T23:59:59.999Z",
      })
    );

    expect(result).not.toBeNull();
    expect(result.executions).toBeDefined();
  });
});
