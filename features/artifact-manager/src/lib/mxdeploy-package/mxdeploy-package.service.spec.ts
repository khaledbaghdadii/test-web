import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { APP_CONFIG } from "@mxflow/config";
import { Asset } from "../asset/model/asset";
import { AssetLocation } from "../location/model/asset-location";
import { AssetLocationType } from "../location/model/asset-location-type";
import { VersionType } from "../version/version-type";
import {
  MxDeployPackage,
  MxDeployPackagesPage,
  FetchMxDeployPackagesFilter,
} from "./model/mxdeploy-package";
import { ArtifactMxDeployPackageService } from "./mxdeploy-package.service";
import { Storage } from "../storage/model/storage";
import { StorageType } from "../storage/model/storage-type";
import { StorageUseCase } from "../storage/model/storage-use-case";

const MOCK_GATEWAY_URL = "https://mock-gateway-url.com";
const MOCK_MX_DEPLOY_PACKAGE_ID = "1";
const MOCK_MX_DEPLOY_PACKAGE_TYPE = "Type1";
const MOCK_CREATED_BY = "User1";
const MOCK_OS = "Linux";
const MOCK_USER_CASE_1 = StorageUseCase.CLIENT_CONFIGURATIONS;
const MOCK_USER_CASE_2 = StorageUseCase.FACTORY_PRODUCTS;
const MOCK_USE_CASES = [MOCK_USER_CASE_1, MOCK_USER_CASE_2];
const PROJECT_ID1 = "projectId1";
const PROJECT_ID2 = "projectId2";
const FETCH_GLOBAL = true;
const MOCK_MAVEN_BUILD = {
  groupId: "groupId",
  artifactId: "artifactId",
  version: "version",
  classifier: "classifier",
  type: VersionType.MAVEN,
};
const MOCK_STORAGE: Storage = {
  id: "storage_id",
  baseUri: "base-uri",
  name: "name",
  storageType: StorageType.HTTP,
  useCases: MOCK_USE_CASES,
  createdOn: new Date(),
  createdBy: MOCK_CREATED_BY,
};
const MOCK_ASSET_LOCATION: AssetLocation = {
  storage: MOCK_STORAGE,
  relativePath: "/path",
  fullPath: "/full/path",
  type: AssetLocationType.PATH,
};
const MOCK_ASSET: Asset = {
  id: "asset-id",
  nickname: "nickname",
  locations: [MOCK_ASSET_LOCATION],
};

const MOCK_MX_DEPLOY_PACKAGE: MxDeployPackage = {
  id: MOCK_MX_DEPLOY_PACKAGE_ID,
  type: MOCK_MX_DEPLOY_PACKAGE_TYPE,
  version: MOCK_MAVEN_BUILD,
  asset: MOCK_ASSET,
  createdOn: new Date(),
  createdBy: MOCK_CREATED_BY,
  projectId: PROJECT_ID1,
};
const MOCK_PAGE_SIZE = 10;
const MOCK_PAGE_INDEX = 0;
const MOCK_SEARCH_KEY = "searchKey";
const PROJECT_ID = "projectId";
describe("ArtifactMxDeployPackageService", () => {
  let service: ArtifactMxDeployPackageService;
  let httpMock: HttpTestingController;
  const mockAppConfig = {
    gatewayUrl: MOCK_GATEWAY_URL,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ArtifactMxDeployPackageService,
        { provide: APP_CONFIG, useValue: mockAppConfig },
      ],
    });
    service = TestBed.inject(ArtifactMxDeployPackageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should call getAllMxDeployPackages and return an MxDeployPackagesPage", () => {
    const mockMxDeployPackagesPage: MxDeployPackagesPage = {
      content: [MOCK_MX_DEPLOY_PACKAGE],
      totalPages: 1,
      totalElements: 1,
      size: MOCK_PAGE_SIZE,
      number: MOCK_PAGE_INDEX,
      last: true,
    };

    const filters: FetchMxDeployPackagesFilter = {
      pageSize: MOCK_PAGE_SIZE,
      pageIndex: MOCK_PAGE_INDEX,
      os: MOCK_OS,
      type: MOCK_MX_DEPLOY_PACKAGE_TYPE,
      searchKey: MOCK_SEARCH_KEY,
      fetchGlobal: FETCH_GLOBAL,
      projectIds: [PROJECT_ID1, PROJECT_ID2],
    };

    service.getAllMxDeployPackages(filters).subscribe((res) => {
      expect(res).toEqual(mockMxDeployPackagesPage);
    });

    const req = httpMock.expectOne(
      `${MOCK_GATEWAY_URL}artifact-management/mxdeploy-packages?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&typeSearch=${MOCK_MX_DEPLOY_PACKAGE_TYPE}&operatingSystemSearch=${MOCK_OS}&searchKey=${encodeURIComponent(
        MOCK_SEARCH_KEY
      )}&fetchGlobal=${FETCH_GLOBAL}&projectIds=${PROJECT_ID1}&projectIds=${PROJECT_ID2}&sort=createdOn%2Cdesc`
    );
    expect(req.request.method).toBe("GET");
    req.flush(mockMxDeployPackagesPage);
  });

  it("should handle errors from getAllMxDeployPackages", () => {
    const filters: FetchMxDeployPackagesFilter = {
      pageSize: MOCK_PAGE_SIZE,
      pageIndex: MOCK_PAGE_INDEX,
      os: MOCK_OS,
      type: MOCK_MX_DEPLOY_PACKAGE_TYPE,
      searchKey: MOCK_SEARCH_KEY,
    };

    service.getAllMxDeployPackages(filters).subscribe({
      error: (error) => {
        expect(error.status).toBe(500);
      },
    });

    const req = httpMock.expectOne(
      `${MOCK_GATEWAY_URL}artifact-management/mxdeploy-packages?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&typeSearch=${MOCK_MX_DEPLOY_PACKAGE_TYPE}&operatingSystemSearch=${MOCK_OS}&searchKey=${encodeURIComponent(
        MOCK_SEARCH_KEY
      )}&sort=createdOn%2Cdesc`
    );
    req.flush("Something went wrong", {
      status: 500,
      statusText: "Server Error",
    });
  });

  it("should call getMxDeployPackageById and return an MxDeployPackage", () => {
    service
      .getMxDeployPackageById(MOCK_MX_DEPLOY_PACKAGE_ID, PROJECT_ID)
      .subscribe((res) => {
        expect(res).toEqual(MOCK_MX_DEPLOY_PACKAGE);
      });

    const req = httpMock.expectOne(
      `${MOCK_GATEWAY_URL}artifact-management/projects/${PROJECT_ID}/mxdeploy-packages/${MOCK_MX_DEPLOY_PACKAGE_ID}`
    );
    expect(req.request.method).toBe("GET");
    req.flush(MOCK_MX_DEPLOY_PACKAGE);
  });

  it("should handle errors from getMxDeployPackageById", () => {
    service
      .getMxDeployPackageById(MOCK_MX_DEPLOY_PACKAGE_ID, PROJECT_ID)
      .subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

    const req = httpMock.expectOne(
      `${MOCK_GATEWAY_URL}artifact-management/projects/${PROJECT_ID}/mxdeploy-packages/${MOCK_MX_DEPLOY_PACKAGE_ID}`
    );
    req.flush("Something went wrong", {
      status: 500,
      statusText: "Server Error",
    });
  });
});
