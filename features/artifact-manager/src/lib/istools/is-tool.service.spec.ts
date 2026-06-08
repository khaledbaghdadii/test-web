import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { APP_CONFIG } from "@mxflow/config";
import {
  ArtifactIsToolsService,
  Asset,
  AssetLocation,
  AssetLocationType,
  FetchIsToolsFilter,
  IsTool,
  IsToolsPage,
  MxDeployPackageResponse,
  Storage,
  StorageType,
  StorageUseCase,
} from "@mxflow/features/artifact-manager";

const MOCK_GATEWAY_URL = "https://mock-gateway-url.com";
const MOCK_IS_TOOL_ID = "1";
const MOCK_ISTOOL_NAME = "IS TOOL 1";
const MOCK_ISTOOL_TYPE = "Type1";
const MOCK_CREATED_BY = "User1";
const MOCK_USER_CASE_1 = StorageUseCase.CLIENT_CONFIGURATIONS;
const MOCK_USER_CASE_2 = StorageUseCase.FACTORY_PRODUCTS;
const MOCK_USE_CASES = [MOCK_USER_CASE_1, MOCK_USER_CASE_2];
const MOCK_MAVEN_BUILD = {
  groupId: "groupId",
  artifactId: "artifactId",
  version: "version",
  classifier: "classifier",
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
const MOCK_MXDEPLOY_PACKAGE: MxDeployPackageResponse = {
  id: "mxdeploy-package-id",
  type: "mxdeploy-package-type",
  asset: MOCK_ASSET,
};
const MOCK_IS_TOOL: IsTool = {
  id: MOCK_IS_TOOL_ID,
  name: MOCK_ISTOOL_NAME,
  type: MOCK_ISTOOL_TYPE,
  mavenBuild: MOCK_MAVEN_BUILD,
  mxDeployPackage: MOCK_MXDEPLOY_PACKAGE,
  asset: MOCK_ASSET,
  archived: false,
  createdOn: new Date(),
  createdBy: MOCK_CREATED_BY,
};
const MOCK_PAGE_SIZE = 10;
const MOCK_PAGE_INDEX = 0;

describe("ArtifactIsToolsService", () => {
  let service: ArtifactIsToolsService;
  let httpMock: HttpTestingController;
  const mockAppConfig = {
    gatewayUrl: MOCK_GATEWAY_URL,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ArtifactIsToolsService,
        { provide: APP_CONFIG, useValue: mockAppConfig },
      ],
    });
    service = TestBed.inject(ArtifactIsToolsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should call getAllIsTools and return an IsToolsPage (with empty searchKey)", () => {
    const mockIsToolsPage: IsToolsPage = {
      content: [MOCK_IS_TOOL],
      totalPages: 1,
      totalElements: 1,
      size: MOCK_PAGE_SIZE,
      number: MOCK_PAGE_INDEX,
      last: true,
    };

    const filters: FetchIsToolsFilter = {
      pageSize: MOCK_PAGE_SIZE,
      pageIndex: MOCK_PAGE_INDEX,
      type: MOCK_ISTOOL_TYPE,
    };

    service.getAllIsTools(filters).subscribe((res) => {
      expect(res).toEqual(mockIsToolsPage);
    });

    const req = httpMock.expectOne(
      `${MOCK_GATEWAY_URL}artifact-management/is-tools?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&type=${MOCK_ISTOOL_TYPE}&searchKey=&sort=createdOn%2Cdesc`
    );
    expect(req.request.method).toBe("GET");
    req.flush(mockIsToolsPage);
  });

  it("should include non-empty searchKey when provided", () => {
    const mockIsToolsPage: IsToolsPage = {
      content: [MOCK_IS_TOOL],
      totalPages: 1,
      totalElements: 1,
      size: MOCK_PAGE_SIZE,
      number: MOCK_PAGE_INDEX,
      last: true,
    };

    const filters: FetchIsToolsFilter = {
      pageSize: MOCK_PAGE_SIZE,
      pageIndex: MOCK_PAGE_INDEX,
      type: MOCK_ISTOOL_TYPE,
      searchKey: "mx tool",
    };

    service.getAllIsTools(filters).subscribe((res) => {
      expect(res).toEqual(mockIsToolsPage);
    });

    const req = httpMock.expectOne(
      `${MOCK_GATEWAY_URL}artifact-management/is-tools?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&type=${MOCK_ISTOOL_TYPE}&searchKey=mx%20tool&sort=createdOn%2Cdesc`
    );
    expect(req.request.method).toBe("GET");
    req.flush(mockIsToolsPage);
  });

  it("should handle errors from getAllIsTools", () => {
    const filters: FetchIsToolsFilter = {
      pageSize: MOCK_PAGE_SIZE,
      pageIndex: MOCK_PAGE_INDEX,
      type: MOCK_ISTOOL_TYPE,
    };

    service.getAllIsTools(filters).subscribe({
      error: (error) => {
        expect(error.status).toBe(500);
      },
    });

    const req = httpMock.expectOne(
      `${MOCK_GATEWAY_URL}artifact-management/is-tools?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&type=${MOCK_ISTOOL_TYPE}&searchKey=&sort=createdOn%2Cdesc`
    );
    req.flush("Something went wrong", {
      status: 500,
      statusText: "Server Error",
    });
  });
});
