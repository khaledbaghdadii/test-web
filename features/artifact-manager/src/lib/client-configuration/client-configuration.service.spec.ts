import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { APP_CONFIG } from "@mxflow/config";
import {
  ClientConfigurationService,
  ClientConfigurationsPage,
  FetchClientConfigurationFilter,
} from "@mxflow/features/artifact-manager";

const MOCK_GATEWAY_URL = "https://mock-gateway-url.com";
const MOCK_CREATED_BY = "User1";
const MOCK_CLIENT_CONFIGURATION_ID = "clientconfiguraiton1";
const MOCK_CLIENT_CONFIGURATION_TYPE = "TypeA";
const MOCK_CLIENT_CONFIGURATION_BRANCH = "branch1";
const MOCK_PROJECT_ID1 = "projectId1";
const MOCK_PROJECT_ID2 = "projectId2";
const MOCK_VERSION = "version";
const MOCK_COMMIT = "commit1";
const MOCK_MX_ASSET = {
  locations: [
    {
      storage: {
        name: "STORAGE",
      },
      relativePath: "RELATIVE_PATH",
      fullPath: "FULL_PATH",
    },
  ],
};

const MOCK_MAVEN_BUILD = {
  version: MOCK_VERSION,
};
const MOCK_PAGE_SIZE = 10;
const MOCK_PAGE_INDEX = 0;
const MOCK_SEARCH_KEY = "searchKey";
const PURGED = false;
const MOCK_FETCH_CLIENT_CONFIGRATION_FILTER: FetchClientConfigurationFilter = {
  pageSize: MOCK_PAGE_SIZE,
  pageIndex: MOCK_PAGE_INDEX,
  typeSearchKey: MOCK_CLIENT_CONFIGURATION_TYPE,
  branchSearchKey: MOCK_CLIENT_CONFIGURATION_BRANCH,
  searchKey: MOCK_SEARCH_KEY,
  projectIds: [MOCK_PROJECT_ID1, MOCK_PROJECT_ID2],
  purged: PURGED,
};
const MOCK_CLIENT_CONFIGURATION_PAGE: ClientConfigurationsPage = {
  content: [
    {
      id: MOCK_CLIENT_CONFIGURATION_ID,
      type: MOCK_CLIENT_CONFIGURATION_TYPE,
      branch: MOCK_CLIENT_CONFIGURATION_BRANCH,
      commitId: MOCK_COMMIT,
      projectId: MOCK_PROJECT_ID1,
      asset: MOCK_MX_ASSET,
      mavenBuild: MOCK_MAVEN_BUILD,
      createdOn: new Date(),
      createdBy: MOCK_CREATED_BY,
    },
  ],
  totalPages: 1,
  totalElements: 1,
  size: MOCK_PAGE_SIZE,
  number: MOCK_PAGE_INDEX,
  last: true,
};

describe("ClientConfigurationService", () => {
  let service: ClientConfigurationService;
  let httpMock: HttpTestingController;
  const mockAppConfig = {
    gatewayUrl: MOCK_GATEWAY_URL,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ClientConfigurationService,
        { provide: APP_CONFIG, useValue: mockAppConfig },
      ],
    });
    service = TestBed.inject(ClientConfigurationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should call getAllClientConfigurations and return a ClientConfigurationsPage", () => {
    service
      .getAllClientConfigurations(MOCK_FETCH_CLIENT_CONFIGRATION_FILTER)
      .subscribe((res) => {
        expect(res).toEqual(MOCK_CLIENT_CONFIGURATION_PAGE);
      });

    const req = httpMock.expectOne(
      `${MOCK_GATEWAY_URL}artifact-management/client-configurations?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&sort=createdOn,desc&typeSearchKey=${MOCK_CLIENT_CONFIGURATION_TYPE}&branchSearchKey=${MOCK_CLIENT_CONFIGURATION_BRANCH}&searchKey=${encodeURIComponent(
        MOCK_FETCH_CLIENT_CONFIGRATION_FILTER.searchKey
      )}&projectIds=${MOCK_PROJECT_ID1}&projectIds=${MOCK_PROJECT_ID2}&purged=${PURGED}`
    );
    expect(req.request.method).toBe("GET");
    req.flush(MOCK_CLIENT_CONFIGURATION_PAGE);
  });

  it("should handle errors from getAllClientConfigurations", () => {
    service
      .getAllClientConfigurations(MOCK_FETCH_CLIENT_CONFIGRATION_FILTER)
      .subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

    const req = httpMock.expectOne(
      `${MOCK_GATEWAY_URL}artifact-management/client-configurations?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&sort=createdOn,desc&typeSearchKey=${MOCK_CLIENT_CONFIGURATION_TYPE}&branchSearchKey=${MOCK_CLIENT_CONFIGURATION_BRANCH}&searchKey=${encodeURIComponent(
        MOCK_FETCH_CLIENT_CONFIGRATION_FILTER.searchKey
      )}&projectIds=${MOCK_PROJECT_ID1}&projectIds=${MOCK_PROJECT_ID2}&purged=${PURGED}`
    );
    req.flush("Something went wrong", {
      status: 500,
      statusText: "Server Error",
    });
  });
});
