import { HttpClient } from "@angular/common/http";
import { MergeConfigurationService } from "./merge-configuration.service";
import { of, throwError } from "rxjs";
import { MergeConfiguration } from "./model/merge-configuration";
import { MergeConfigurationPage } from "./model/merge-configuration-page";
import { MergeConfigurationApiPage } from "./model/response/merge-configuration-api-page";
import { AppConfig } from "@mxflow/config";
import { MergeConfigurationFilterRequest } from "./model/request/merge-configuration-filter-request";
import { MergeConfigurationApiFilterRequest } from "./model/request/merge-configuration-api-filter-request";

describe("Service: MergeConfigurationService", () => {
  const GATEWAY_URL = "https://gateway.cd.murex.com/api/v1/";
  const PROJECT_ID = "projectId";
  const BRANCH_NAME = "master";
  const REPOSITORY_ID = "repoId";
  const MERGE_CONFIG = {
    id: "masterId",
    branchName: BRANCH_NAME,
    projectId: PROJECT_ID,
    mergeConfigurationDefinition: {
      id: "def-1",
      repositoryId: REPOSITORY_ID,
    },
  } as MergeConfiguration;
  const appConfig: AppConfig = {
    gatewayUrl: GATEWAY_URL,
  } as unknown as AppConfig;
  const DEFAULT_PAGE_INDEX = 0;
  const DEFAULT_PAGE_SIZE = 20;
  const ERROR_MESSAGE = "error";

  let service: MergeConfigurationService;
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    } as unknown as HttpClient;

    service = new MergeConfigurationService(appConfig, httpClient);
  });

  it("should get filtered merge configurations of a project", async () => {
    const filterRequest: MergeConfigurationFilterRequest =
      getMergeConfigurationFilterRequest();
    const filterApiRequest: MergeConfigurationApiFilterRequest =
      getMergeConfigurationFilterRequest() as MergeConfigurationApiFilterRequest;
    jest
      .spyOn(httpClient, "post")
      .mockReturnValue(of(getMergeConfigurationApiPage()));

    service
      .getFilteredMergeConfigurations(PROJECT_ID, filterRequest)
      .subscribe({
        next: (data) => {
          expect(data).toEqual(getMergeConfigurationPage());
        },
      });

    expect(httpClient.post).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/settings/merge-configurations/filter?page=${DEFAULT_PAGE_INDEX}&size=${DEFAULT_PAGE_SIZE}`,
      filterApiRequest
    );
  });

  it("should throw an error on failure to get filtered merge configurations", async () => {
    const filterRequest: MergeConfigurationFilterRequest =
      getMergeConfigurationFilterRequest();
    const filterApiRequest: MergeConfigurationApiFilterRequest =
      getMergeConfigurationFilterRequest() as MergeConfigurationApiFilterRequest;
    const errorResponse = {
      error: {
        status: 500,
        message: ERROR_MESSAGE,
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      },
    };

    jest
      .spyOn(httpClient, "post")
      .mockReturnValue(throwError(() => errorResponse));

    service
      .getFilteredMergeConfigurations(PROJECT_ID, filterRequest)
      .subscribe({
        error: (error) => {
          expect(error.message).toEqual(ERROR_MESSAGE);
        },
      });

    expect(httpClient.post).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/settings/merge-configurations/filter?page=${DEFAULT_PAGE_INDEX}&size=${DEFAULT_PAGE_SIZE}`,
      filterApiRequest
    );
  });

  function getMergeConfigurationApiPage(): MergeConfigurationApiPage {
    return {
      content: [MERGE_CONFIG],
      totalPages: 1,
      totalElements: 1,
      size: 20,
      number: 0,
      last: true,
    };
  }

  function getMergeConfigurationPage(): MergeConfigurationPage {
    return {
      content: [MERGE_CONFIG],
      totalPages: 1,
      totalElements: 1,
      size: 20,
      number: 0,
      last: true,
    };
  }

  function getMergeConfigurationFilterRequest() {
    return {
      repositoryId: MERGE_CONFIG.mergeConfigurationDefinition.repositoryId,
    };
  }
});
