import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { APP_CONFIG } from "@mxflow/config";
import { ArtifactBundlesService } from "./bundles.service";
import {
  Bundles,
  BundlesPage,
  FetchBundlesFilter,
  FetchProjectSpecificBundlesFilter,
  MxArtifact,
  MxBuild,
  SimpleAsset,
} from "./model/bundles";

const MOCK_GATEWAY_URL = "https://mock-gateway-url.com";
const MOCK_CREATED_BY = "User1";
const MOCK_BUNDLE_ID = "bundle1";
const MOCK_BUNDLE_TYPE = "TypeA";
const MOCK_PROJECT_ID1 = "projectId1";
const MOCK_PROJECT_ID2 = "projectId2";
const MOCK_FETCH_GLOBAL = true;
const MOCK_MX_BUILD_ID = "build1";
const MOCK_MX_BUILD_VERSION = "1.0.0";
const MOCK_MX_BUILD_BUILD_ID = "build-123";
const MOCK_MX_BUILD_REVISION = "rev1";
const MOCK_MX_ARTIFACT_ID_1 = "id1";
const MOCK_MX_ARTIFACT_ID_2 = "id2";
const MOCK_ASSET_ID_1 = "asset1";
const MOCK_ASSET_ID_2 = "asset2";
const MOCK_ASSET_FULL_PATH_1 = "fullPath1";
const MOCK_ASSET_FULL_PATH_2 = "fullPath2";
const PROJECT_ID = "projectId";
const MOCK_ASSET_1: SimpleAsset = {
  id: MOCK_ASSET_ID_1,
  locations: [
    {
      fullPath: MOCK_ASSET_FULL_PATH_1,
    },
  ],
};
const MOCK_ASSET_2: SimpleAsset = {
  id: MOCK_ASSET_ID_2,
  locations: [
    {
      fullPath: MOCK_ASSET_FULL_PATH_2,
    },
  ],
};
const MOCK_MX_ARTIFACT_TYPE_1 = "ArtifactType1";
const MOCK_MX_ARTIFACT_TYPE_2 = "ArtifactType2";
const MOCK_MX_BUILD: MxBuild = {
  id: MOCK_MX_BUILD_ID,
  version: MOCK_MX_BUILD_VERSION,
  buildId: MOCK_MX_BUILD_BUILD_ID,
  revision: MOCK_MX_BUILD_REVISION,
};
const MOCK_MX_ARTIFACTS: MxArtifact[] = [
  {
    id: MOCK_MX_ARTIFACT_ID_1,
    type: MOCK_MX_ARTIFACT_TYPE_1,
    projectId: PROJECT_ID,
    asset: MOCK_ASSET_1,
  },
  {
    id: MOCK_MX_ARTIFACT_ID_2,
    type: MOCK_MX_ARTIFACT_TYPE_2,
    projectId: PROJECT_ID,
    asset: MOCK_ASSET_2,
  },
];
const MOCK_BUNDLE: Bundles = {
  id: MOCK_BUNDLE_ID,
  type: MOCK_BUNDLE_TYPE,
  mxBuild: MOCK_MX_BUILD,
  projectId: MOCK_PROJECT_ID1,
  mxArtifacts: MOCK_MX_ARTIFACTS,
  createdOn: new Date(),
  createdBy: MOCK_CREATED_BY,
  purged: false,
};
const MOCK_PAGE_SIZE = 10;
const MOCK_PAGE_INDEX = 0;
const MOCK_SEARCH_KEY = "searchKey";
const MOCK_FETCH_BUNDLES_FILTER: FetchBundlesFilter = {
  pageSize: MOCK_PAGE_SIZE,
  pageIndex: MOCK_PAGE_INDEX,
  type: MOCK_BUNDLE_TYPE,
  version: MOCK_MX_BUILD_VERSION,
  buildId: MOCK_MX_BUILD_BUILD_ID,
  revision: MOCK_MX_BUILD_REVISION,
  searchKey: MOCK_SEARCH_KEY,
  projectIds: [MOCK_PROJECT_ID1, MOCK_PROJECT_ID2],
  fetchGlobal: MOCK_FETCH_GLOBAL,
};
const MOCK_FETCH_PROJECT_SPECIFIC_BUNDLES_FILTER: FetchProjectSpecificBundlesFilter =
  {
    bundleIds: [MOCK_BUNDLE_ID],
    pageIndex: MOCK_PAGE_INDEX,
    pageSize: MOCK_PAGE_SIZE,
    projectId: MOCK_PROJECT_ID1,
  };
const MOCK_BUNDLE_PAGE: BundlesPage = {
  content: [MOCK_BUNDLE],
  totalPages: 1,
  totalElements: 1,
  size: MOCK_PAGE_SIZE,
  number: MOCK_PAGE_INDEX,
  last: true,
};

describe("ArtifactBundlesService", () => {
  let service: ArtifactBundlesService;
  let httpMock: HttpTestingController;
  const mockAppConfig = {
    gatewayUrl: MOCK_GATEWAY_URL,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ArtifactBundlesService,
        { provide: APP_CONFIG, useValue: mockAppConfig },
      ],
    });
    service = TestBed.inject(ArtifactBundlesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
  describe("Get All Bundles", () => {
    it("should call getAllBundles and return a BundlesPage", () => {
      service.getAllBundles(MOCK_FETCH_BUNDLES_FILTER).subscribe((res) => {
        expect(res).toEqual(MOCK_BUNDLE_PAGE);
      });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/mxbundles?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&sort=createdOn,desc&type=${MOCK_BUNDLE_TYPE}&version=${MOCK_MX_BUILD_VERSION}&buildId=${MOCK_MX_BUILD_BUILD_ID}&revision=${MOCK_MX_BUILD_REVISION}&searchKey=${encodeURIComponent(
          MOCK_FETCH_BUNDLES_FILTER.searchKey
        )}&projectIds=${MOCK_PROJECT_ID1}&projectIds=${MOCK_PROJECT_ID2}&fetchGlobal=${MOCK_FETCH_GLOBAL}`
      );
      expect(req.request.method).toBe("GET");
      req.flush(MOCK_BUNDLE_PAGE);
    });

    it("should handle errors from getAllBundles", () => {
      service.getAllBundles(MOCK_FETCH_BUNDLES_FILTER).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/mxbundles?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&sort=createdOn,desc&type=${MOCK_BUNDLE_TYPE}&version=${MOCK_MX_BUILD_VERSION}&buildId=${MOCK_MX_BUILD_BUILD_ID}&revision=${MOCK_MX_BUILD_REVISION}&searchKey=${encodeURIComponent(
          MOCK_FETCH_BUNDLES_FILTER.searchKey
        )}&projectIds=${MOCK_PROJECT_ID1}&projectIds=${MOCK_PROJECT_ID2}&fetchGlobal=${MOCK_FETCH_GLOBAL}`
      );
      req.flush("Something went wrong", {
        status: 500,
        statusText: "Server Error",
      });
    });
  });
  describe("Get Project Specific Bundles", () => {
    it("should get project specific bundles", (done) => {
      service
        .getProjectSpecificBundles(MOCK_FETCH_PROJECT_SPECIFIC_BUNDLES_FILTER)
        .subscribe((res) => {
          expect(res).toEqual(MOCK_BUNDLE_PAGE);
          done();
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/projects/${MOCK_FETCH_PROJECT_SPECIFIC_BUNDLES_FILTER.projectId}/mxbundles?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&sort=createdOn,desc&mxBundleIds=${MOCK_FETCH_PROJECT_SPECIFIC_BUNDLES_FILTER.bundleIds}`
      );
      expect(req.request.method).toBe("GET");
      req.flush(MOCK_BUNDLE_PAGE);
    });
    it("should handle errors from getProjectSpecificBundles", (done) => {
      service
        .getProjectSpecificBundles(MOCK_FETCH_PROJECT_SPECIFIC_BUNDLES_FILTER)
        .subscribe({
          error: (error) => {
            expect(error.status).toBe(500);
            done();
          },
        });
      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/projects/${MOCK_FETCH_PROJECT_SPECIFIC_BUNDLES_FILTER.projectId}/mxbundles?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&sort=createdOn,desc&mxBundleIds=${MOCK_FETCH_PROJECT_SPECIFIC_BUNDLES_FILTER.bundleIds}`
      );
      req.flush("Something went wrong", {
        status: 500,
        statusText: "Server Error",
      });
    });
  });
});
