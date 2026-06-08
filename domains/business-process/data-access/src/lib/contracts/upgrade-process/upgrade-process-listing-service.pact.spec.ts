import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { Matchers, Pact } from "@pact-foundation/pact";
import { lastValueFrom } from "rxjs";
import { UpgradeProcessListingService } from "../../upgrade-process/upgrade-process-listing.service";
import { eachLike, like } from "@pact-foundation/pact/src/dsl/matchers";
import { APP_CONFIG } from "@mxflow/config";

const projectId = "projectId";

describe("Upgrade process listing service contract tests", () => {
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
        UpgradeProcessListingService,
        { provide: GATEWAY_CONFIG, useValue: appConfig },
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

  test("querying binary upgrade process executions with filters returns the total count and executions", async () => {
    await provider.addInteraction({
      state: "binary upgrade process executions exist with filters",
      uponReceiving:
        "a request to query binary upgrade process executions with filters",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/binary-upgrade`,
        method: "GET",
        query: {
          page: Matchers.term({
            generate: "1",
            matcher: "[0-9]+",
          }),
          pageSize: Matchers.term({
            generate: "10",
            matcher: "[0-9]+",
          }),
          definitionIds: Matchers.string(),
          statuses: Matchers.term({
            generate: "NOT_STARTED",
            matcher: ".*",
          }),
          officiality: Matchers.term({
            generate: "OFFICIAL",
            matcher: "OFFICIAL|UNOFFICIAL|NA",
          }),
          hidden: Matchers.term({
            generate: "false",
            matcher: "true|false",
          }),
          parentMxArchivalBranchPhrase: Matchers.string(),
          mxVersionPhrase: Matchers.string(),
          mxBuildIdPhrase: Matchers.string(),
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
          businessProcessQualityLevel: Matchers.term({
            generate: "MQG",
            matcher: "MQG|DQG|NA",
          }),
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
            description: Matchers.string(),
            expiryDate: Matchers.string(),
            name: Matchers.string(),
            startDate: Matchers.string(),
            endDate: Matchers.string(),
            status: Matchers.string(),
            owner: Matchers.string(),
            definitionName: Matchers.string(),
            processName: Matchers.string(),
            officiality: Matchers.string(),
            input: {
              parentMxArchivalBranch: Matchers.string(),
              configurationBranchName: Matchers.string(),
              businessProcessQualityLevel: Matchers.string(),
              mxVersion: Matchers.string(),
              mxBuildId: Matchers.string(),
            },
          }),
        }),
      },
    });

    const service = TestBed.inject(UpgradeProcessListingService);

    const executionApiModel = await lastValueFrom(
      service.getBinaryUpgradeExecutions(projectId, {
        page: 1,
        pageSize: 10,
        definitionIds: ["DEFINITION_ID_1", "DEFINITION_ID_2"],
        statuses: ["FAILED", "PASSED"],
        parentMxArchivalBranchPhrase: "v3.1.build",
        mxVersionPhrase: "mxVersion",
        mxBuildIdPhrase: "mxBuildId",
        configurationBranchNamePhrase: "configBranch1",
        ownerPhrase: "owner",
        startDateRangeStart: "2022-09-14T08:39:10.487018Z",
        startDateRangeEnd: "2022-09-14T08:50:10.487018Z",
        endDateRangeStart: "2022-09-13T08:39:10.487018Z",
        endDateRangeEnd: "2022-09-14T08:50:10.487018Z",
        expiryDateRangeStart: "2022-09-13T08:39:10.487018Z",
        expiryDateRangeEnd: "2022-09-14T08:50:10.487018Z",
        namePhrase: "name",
        sort: "startDate,asc",
        officiality: ["OFFICIAL"],
        hidden: false,
        businessProcessQualityLevel: ["MQG"],
      })
    );

    expect(executionApiModel).not.toBeNull();
  });

  test("querying binary upgrade process executions without filters returns the total count and executions", async () => {
    await provider.addInteraction({
      state: "binary upgrade process executions exist without filters",
      uponReceiving:
        "a request to query binary upgrade process executions without filters",
      withRequest: {
        path: `/projects/${projectId}/business-process/executions/binary-upgrade`,
        method: "GET",
        query: {
          page: Matchers.term({
            generate: "1",
            matcher: "[0-9]+",
          }),
          pageSize: Matchers.term({
            generate: "10",
            matcher: "[0-9]+",
          }),
        },
      },
      willRespondWith: {
        headers: {
          "Content-Type": "application/json",
        },
        status: 200,
        body: like({
          totalElements: Matchers.integer(),
          content: eachLike({
            id: Matchers.string(),
            expiryDate: Matchers.string(),
            name: Matchers.string(),
            startDate: Matchers.string(),
            definitionName: Matchers.string(),
            endDate: Matchers.string(),
            status: Matchers.string(),
            owner: Matchers.string(),
            processName: Matchers.string(),
            officiality: Matchers.string(),
            input: {
              parentMxArchivalBranch: Matchers.string(),
              configurationBranchName: Matchers.string(),
              businessProcessQualityLevel: Matchers.string(),
              mxVersion: Matchers.string(),
              mxBuildId: Matchers.string(),
            },
          }),
        }),
      },
    });

    const service = TestBed.inject(UpgradeProcessListingService);

    const executionApiModel = await lastValueFrom(
      service.getBinaryUpgradeExecutions(projectId, {
        page: 1,
        pageSize: 10,
      })
    );

    expect(executionApiModel).not.toBeNull();
  });
});
