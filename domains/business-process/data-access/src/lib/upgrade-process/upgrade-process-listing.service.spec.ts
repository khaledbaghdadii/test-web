import { HttpClient, HttpParams } from "@angular/common/http";
import { lastValueFrom, of } from "rxjs";
import {
  BusinessProcessExecutionStatus,
  BusinessProcessOfficialStatus,
} from "@mxflow/features/business-process";
import { BinaryUpgradeExecutionsQueryResult } from "./models/binary-upgrade-executions-query-result";
import { TestBed } from "@angular/core/testing";
import { UpgradeProcessListingService } from "./upgrade-process-listing.service";
import { APP_CONFIG } from "@mxflow/config";

const GATEWAY_URL = "gateway/";

describe("binary upgrade execution service", () => {
  const PAGE = 1;
  const PAGE_SIZE = 10;
  const PROJECT_ID = "projectId";
  const DEFINITION_IDS = ["DEFINITION_ID_1", "DEFINITION_ID_2"];
  const STATUSES = ["FAILED", "PASSED"];
  const PARENT_MX_ARCHIVAL_BRANCH = "v3.1.build";
  const OFFICIALITY_STATUES = ["OFFICIAL", "NA"];
  const BUSINESS_PROCESS_QUALITY_LEVELS = ["DQG", "MQG"];
  const CONFIG_BRANCH_NAME = "configBranch1";
  const START_DATE_RANGE_START = "2022-09-14T08:39:10.487018Z";
  const START_DATE_RANGE_END = "2022-09-14T08:50:10.487018Z";
  const END_DATE_RANGE_START = "2022-09-13T08:39:10.487018Z";
  const END_DATE_RANGE_END = "2022-09-14T08:50:10.487018Z";
  const EXPIRY_DATE_RANGE_START = "2022-09-13T08:39:10.487018Z";
  const EXPIRY_DATE_RANGE_END = "2022-09-14T08:50:10.487018Z";
  const SORT_BY_START_DATE = "ascending";
  const SORT_BY_EXPIRY_DATE = "ascending";
  const BU_QUERY_RESULT: BinaryUpgradeExecutionsQueryResult =
    getBinaryUpgradeQueryResult();

  let httpClient: Partial<HttpClient>;
  let service: UpgradeProcessListingService;

  beforeEach(() => {
    httpClient = {
      get: jest.fn().mockReturnValue(of(BU_QUERY_RESULT)),
      post: jest.fn().mockReturnValue(of({})),
    };

    TestBed.configureTestingModule({
      providers: [
        UpgradeProcessListingService,
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(UpgradeProcessListingService);
  });

  it("should return the queried binary upgrade executions given projectId, page, and page size", async () => {
    await expect(
      lastValueFrom(
        service.getBinaryUpgradeExecutions(PROJECT_ID, {
          page: PAGE,
          pageSize: PAGE_SIZE,
        })
      )
    ).resolves.toEqual(BU_QUERY_RESULT);

    expect(httpClient.get).toHaveBeenCalledWith(
      "gateway/projects/" +
        PROJECT_ID +
        "/business-process/executions/binary-upgrade",
      { params: new HttpParams().set("page", PAGE).set("pageSize", PAGE_SIZE) }
    );
  });

  it("should return the queried binary upgrade executions given all query params", async () => {
    await expect(
      lastValueFrom(
        service.getBinaryUpgradeExecutions(PROJECT_ID, {
          page: PAGE,
          pageSize: PAGE_SIZE,
          definitionIds: DEFINITION_IDS,
          statuses: STATUSES,
          parentMxArchivalBranchPhrase: PARENT_MX_ARCHIVAL_BRANCH,
          mxVersionPhrase: "mxVersion",
          mxBuildIdPhrase: "mxBuildId",
          configurationBranchNamePhrase: CONFIG_BRANCH_NAME,
          ownerPhrase: "owner",
          startDateRangeStart: START_DATE_RANGE_START,
          startDateRangeEnd: START_DATE_RANGE_END,
          endDateRangeStart: END_DATE_RANGE_START,
          endDateRangeEnd: END_DATE_RANGE_END,
          expiryDateRangeStart: EXPIRY_DATE_RANGE_START,
          expiryDateRangeEnd: EXPIRY_DATE_RANGE_END,
          namePhrase: "name",
          sortByStartDate: SORT_BY_START_DATE,
          sortByExpiryDate: SORT_BY_EXPIRY_DATE,
          officiality: OFFICIALITY_STATUES,
          businessProcessQualityLevel: BUSINESS_PROCESS_QUALITY_LEVELS,
          hidden: false,
        })
      )
    ).resolves.toEqual(BU_QUERY_RESULT);

    expect(httpClient.get).toHaveBeenCalledWith(
      "gateway/projects/" +
        PROJECT_ID +
        "/business-process/executions/binary-upgrade",
      {
        params: new HttpParams()
          .set("page", PAGE)
          .set("pageSize", PAGE_SIZE)
          .set("definitionIds", DEFINITION_IDS as any)
          .set("statuses", STATUSES as any)
          .set("parentMxArchivalBranchPhrase", PARENT_MX_ARCHIVAL_BRANCH)
          .set("mxVersionPhrase", "mxVersion")
          .set("mxBuildIdPhrase", "mxBuildId")
          .set("configurationBranchNamePhrase", CONFIG_BRANCH_NAME)
          .set("ownerPhrase", "owner")
          .set("startDateRangeStart", START_DATE_RANGE_START)
          .set("startDateRangeEnd", START_DATE_RANGE_END)
          .set("endDateRangeStart", END_DATE_RANGE_START)
          .set("endDateRangeEnd", END_DATE_RANGE_END)
          .set("expiryDateRangeStart", EXPIRY_DATE_RANGE_START)
          .set("expiryDateRangeEnd", EXPIRY_DATE_RANGE_END)
          .set("namePhrase", "name")
          .set("sortByStartDate", SORT_BY_START_DATE)
          .set("sortByExpiryDate", SORT_BY_START_DATE)
          .set("officiality", OFFICIALITY_STATUES as unknown as string)
          .set(
            "businessProcessQualityLevel",
            BUSINESS_PROCESS_QUALITY_LEVELS as unknown as string
          )
          .set("hidden", false),
      }
    );
  });

  function getBinaryUpgradeQueryResult(): BinaryUpgradeExecutionsQueryResult {
    return {
      totalElements: 30,
      content: [
        {
          id: "id",
          startDate: "startDate",
          endDate: "endDate",
          daysExtended: 9,
          expiryDate: "expiryDate",
          name: "name",
          status: BusinessProcessExecutionStatus.PENDING_INPUT,
          definitionName: "definitionName",
          processName: "processName",
          owner: "owner",
          officiality: BusinessProcessOfficialStatus.OFFICIAL,
          input: {
            factoryProductId: "factoryProductId",
            mxVersion: "mxVersion",
            mxBuildId: "mxBuildId",
            bipVersion: "bipVersion",
            bipBuildId: "bipBuildId",
            upgradeJump: "upgradeJump",
            repositoryId: "repositoryId",
            configurationBranchName: "configurationBranchName",
            configurationParentBranch: "configurationParentBranch",
            parentMxArchivalBranch: "parentMxArchivalBranch",
            createBranch: true,
            qualityGateExecutionInfraGroupId:
              "qualityGateExecutionInfraGroupId",
            binaryConversionInfraGroupId: "binaryConversionInfraGroupId",
            testScenarioIds: ["testScenarioId1", "testScenarioId2"],
            binaryConversionTestScenarioId: "binaryConversionTestScenarioId",
            referenceCommitId: "referenceCommitId",
            referenceFactoryProductId: "referenceFactoryProductId",
            referenceMxVersion: "referenceMxVersion",
            referenceMxBuildId: "referenceMxBuildId",
            referenceBipVersion: "referenceBipVersion",
            referenceBipBuildId: "referenceBipBuildId",
            referenceEnvironmentDefinitionId:
              "referenceEnvironmentDefinitionId",
            referenceEnvironmentInfraGroupId:
              "referenceEnvironmentInfraGroupId",
            businessProcessQualityLevel: "DQG",
          },
        },
      ],
    };
  }
});
