import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { APP_CONFIG } from "@mxflow/config";
import { ArtifactMxArtifactsService } from "./mx-artifacts.service";
import { MxArtifactsPage, FetchMxArtifactsFilter } from "./model/mx-artifacts";

const MOCK_GATEWAY_URL = "https://mock-gateway-url.com";
const MOCK_CREATED_BY = "User1";
const MOCK_MX_ARTIFACTS_ID = "bundle1";
const MOCK_MX_ARTIFACTS_TYPE = "TypeA";
const MOCK_PROJECT_ID1 = "projectId1";
const MOCK_PROJECT_ID2 = "projectId2";
const MOCK_FETCH_GLOBAL = true;
const MOCK_MX_OS = "os";
const MOCK_MX_BUILD_VERSION = "1.0.0";
const MOCK_MX_BUILD_BUILD_ID = "build-123";
const MOCK_MX_BUILD_REVISION = "rev1";

const MOCK_MX_BUILD = {
  os: MOCK_MX_OS,
  version: MOCK_MX_BUILD_VERSION,
  buildId: MOCK_MX_BUILD_BUILD_ID,
  revision: MOCK_MX_BUILD_REVISION,
};

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

const MOCK_MX_ARTIFACTS = [
  {
    id: MOCK_MX_ARTIFACTS_ID,
    type: MOCK_MX_ARTIFACTS_TYPE,
    mxBuild: MOCK_MX_BUILD,
    projectId: MOCK_PROJECT_ID1,
    asset: MOCK_MX_ASSET,
    createdOn: new Date(),
    createdBy: MOCK_CREATED_BY,
  },
];

const MOCK_PAGE_SIZE = 10;
const MOCK_PAGE_INDEX = 0;
const MOCK_SEARCH_KEY = "searchKey";
const MOCK_FETCH_MX_ARTIFACTS_FILTER: FetchMxArtifactsFilter = {
  pageSize: MOCK_PAGE_SIZE,
  pageIndex: MOCK_PAGE_INDEX,
  typeFilter: MOCK_MX_ARTIFACTS_TYPE,
  versionFilter: MOCK_MX_BUILD_VERSION,
  buildIdFilter: MOCK_MX_BUILD_BUILD_ID,
  osFilter: MOCK_MX_OS,
  revisionFilter: MOCK_MX_BUILD_REVISION,
  searchKey: MOCK_SEARCH_KEY,
  projectIds: [MOCK_PROJECT_ID1, MOCK_PROJECT_ID2],
  fetchGlobal: MOCK_FETCH_GLOBAL,
};
const MOCK_MX_ARTIFACTS_PAGE: MxArtifactsPage = {
  content: MOCK_MX_ARTIFACTS,
  totalPages: 1,
  totalElements: 1,
  size: MOCK_PAGE_SIZE,
  number: MOCK_PAGE_INDEX,
  last: true,
};

describe("ArtifactMxArtifactsService", () => {
  let service: ArtifactMxArtifactsService;
  let httpMock: HttpTestingController;
  const mockAppConfig = {
    gatewayUrl: MOCK_GATEWAY_URL,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ArtifactMxArtifactsService,
        { provide: APP_CONFIG, useValue: mockAppConfig },
      ],
    });
    service = TestBed.inject(ArtifactMxArtifactsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should call getAllMxArtifacts and return a MxArtifactsPage", (done) => {
    service
      .getAllMxArtifacts(MOCK_FETCH_MX_ARTIFACTS_FILTER)
      .subscribe((res) => {
        expect(res).toEqual(MOCK_MX_ARTIFACTS_PAGE);
        done();
      });

    const req = httpMock.expectOne(
      `${MOCK_GATEWAY_URL}artifact-management/mxartifacts?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&sort=createdOn,desc&typeFilter=${MOCK_MX_ARTIFACTS_TYPE}&versionFilter=${MOCK_MX_BUILD_VERSION}&buildIdFilter=${MOCK_MX_BUILD_BUILD_ID}&osFilter=${MOCK_MX_OS}&revisionFilter=${MOCK_MX_BUILD_REVISION}&searchKey=${encodeURIComponent(
        MOCK_FETCH_MX_ARTIFACTS_FILTER.searchKey
      )}&projectIds=${MOCK_PROJECT_ID1}&projectIds=${MOCK_PROJECT_ID2}&fetchGlobal=${MOCK_FETCH_GLOBAL}`
    );
    expect(req.request.method).toBe("GET");
    req.flush(MOCK_MX_ARTIFACTS_PAGE);
  });

  it("should handle errors from getAllMxArtifacts", (done) => {
    service.getAllMxArtifacts(MOCK_FETCH_MX_ARTIFACTS_FILTER).subscribe({
      error: (error) => {
        expect(error.status).toBe(500);
        done();
      },
    });

    const req = httpMock.expectOne(
      `${MOCK_GATEWAY_URL}artifact-management/mxartifacts?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&sort=createdOn,desc&typeFilter=${MOCK_MX_ARTIFACTS_TYPE}&versionFilter=${MOCK_MX_BUILD_VERSION}&buildIdFilter=${MOCK_MX_BUILD_BUILD_ID}&osFilter=${MOCK_MX_OS}&revisionFilter=${MOCK_MX_BUILD_REVISION}&searchKey=${encodeURIComponent(
        MOCK_FETCH_MX_ARTIFACTS_FILTER.searchKey
      )}&projectIds=${MOCK_PROJECT_ID1}&projectIds=${MOCK_PROJECT_ID2}&fetchGlobal=${MOCK_FETCH_GLOBAL}`
    );
    req.flush("Something went wrong", {
      status: 500,
      statusText: "Server Error",
    });
  });
});
