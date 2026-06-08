import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { APP_CONFIG } from "@mxflow/config";
import {
  ArtifactLicensesService,
  Asset,
  AssetLocation,
  AssetLocationType,
  CreateLicenseRequest,
  CreateMavenBasedAssetLocationRequest,
  CreatePathBasedAssetLocationRequest,
  FetchLicensesFilter,
  License,
  LicensesPage,
  Storage,
  StorageType,
  StorageUseCase,
} from "@mxflow/features/artifact-manager";

const MOCK_GATEWAY_URL = "https://mock-gateway-url.com";
const MOCK_LICENSE_ID = "1";
const MOCK_CREATED_BY = "User1";
const MOCK_USER_CASE_1 = StorageUseCase.CLIENT_CONFIGURATIONS;
const MOCK_USER_CASE_2 = StorageUseCase.FACTORY_PRODUCTS;
const MOCK_USE_CASES = [MOCK_USER_CASE_1, MOCK_USER_CASE_2];
const REVISION = "REVISION";
const VERSION = "VERSION";
const PROJECT_ID = "PROJECT-ID";
const PROJECT_ID2 = "PROJECT-ID2";
const LICENSE_TYPE = "LICENSE_TYPE";

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

const MOCK_LICENSE: License = {
  id: MOCK_LICENSE_ID,
  projectId: PROJECT_ID,
  type: LICENSE_TYPE,
  asset: MOCK_ASSET,
  version: VERSION,
  revision: REVISION,
  archived: false,
  expirationDate: new Date(),
  createdOn: new Date(),
  createdBy: MOCK_CREATED_BY,
};

const LICENSES_PAGE: LicensesPage = {
  content: [MOCK_LICENSE],
  size: 1,
  number: 1,
  totalPages: 1,
  totalElements: 1,
  last: true,
};
const MOCK_PAGE_SIZE = 10;
const MOCK_PAGE_INDEX = 0;

describe("ArtifactLicensesService", () => {
  let service: ArtifactLicensesService;
  let httpMock: HttpTestingController;
  const mockAppConfig = {
    gatewayUrl: MOCK_GATEWAY_URL,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ArtifactLicensesService,
        { provide: APP_CONFIG, useValue: mockAppConfig },
      ],
    });
    service = TestBed.inject(ArtifactLicensesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("getAllLicenses Tests", () => {
    it("should call getAllLicenses when projectIds is defined and return a LicensesPage", () => {
      const projectIds = [PROJECT_ID, PROJECT_ID2];

      const filters: FetchLicensesFilter = {
        pageSize: MOCK_PAGE_SIZE,
        pageIndex: MOCK_PAGE_INDEX,
        projectIds: projectIds,
      };

      service.getAllLicenses(filters).subscribe((res) => {
        expect(res).toEqual(LICENSES_PAGE);
      });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/licenses?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&projectIds=${PROJECT_ID}&projectIds=${PROJECT_ID2}&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
      req.flush(LICENSES_PAGE);
    });

    it("should call getAllLicenses when projectIds is undefined and return a LicensesPage", () => {
      const filters: FetchLicensesFilter = {
        pageSize: MOCK_PAGE_SIZE,
        pageIndex: MOCK_PAGE_INDEX,
      };

      service.getAllLicenses(filters).subscribe((res) => {
        expect(res).toEqual(LICENSES_PAGE);
      });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/licenses?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
      req.flush(LICENSES_PAGE);
    });

    it("should handle errors from getAllLicenses", () => {
      const filters: FetchLicensesFilter = {
        pageSize: MOCK_PAGE_SIZE,
        pageIndex: MOCK_PAGE_INDEX,
      };

      service.getAllLicenses(filters).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/licenses?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&sort=createdOn%2Cdesc`
      );
      req.flush("Something went wrong", {
        status: 500,
        statusText: "Server Error",
      });
    });
  });

  describe("createLicense Tests", () => {
    const assetPathBasedLocationRequest: CreatePathBasedAssetLocationRequest = {
      storageId: "storageId",
      relativePath: "/full/path",
      type: AssetLocationType.PATH,
    };

    const assetMavenBasedLocationRequest: CreateMavenBasedAssetLocationRequest =
      {
        storageId: "storageId",
        type: AssetLocationType.MAVEN,
        artifactId: "artifactId",
        classifier: "classifier",
        groupId: "groupId",
        packagingType: "packagingType",
        version: "version",
      };

    const createLicenseRequest: CreateLicenseRequest = {
      type: "type",
      asset: {
        nickname: "nickname",
        locations: [
          assetPathBasedLocationRequest,
          assetMavenBasedLocationRequest,
        ],
      },
      version: "version",
      revision: "revision",
      expirationDate: new Date(),
    };

    it("should call createLicense", () => {
      service
        .createLicense(PROJECT_ID, createLicenseRequest)
        .subscribe((res) => {
          expect(res).toEqual(MOCK_LICENSE);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/projects/${PROJECT_ID}/licenses`
      );
      expect(req.request.method).toBe("POST");
      req.flush(MOCK_LICENSE);
    });

    it("should handle errors from createLicense", () => {
      service.createLicense(PROJECT_ID, createLicenseRequest).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/projects/${PROJECT_ID}/licenses`
      );
      expect(req.request.method).toBe("POST");
      req.flush("Something went wrong", {
        status: 500,
        statusText: "Server Error",
      });
    });
  });
});
