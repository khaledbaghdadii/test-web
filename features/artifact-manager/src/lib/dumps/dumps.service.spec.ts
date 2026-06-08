import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { APP_CONFIG } from "@mxflow/config";
import {
  ArtifactDumpsService,
  Asset,
  AssetLocation,
  AssetLocationType,
  Dump,
  DumpServerType,
  DumpsPage,
  DumpStripe,
  FetchDumpsFilter,
  MxDeployPackageResponse,
  Storage,
  StorageType,
  StorageUseCase,
} from "@mxflow/features/artifact-manager";
import { CreateAssetRequest } from "../asset/model/request/create-asset-request";
import {
  CreateDumpRequest,
  DumpStripeRequest,
} from "./model/request/create-dump-request";
import { CreatePathBasedAssetLocationRequest } from "../location/model/request/create-path-based-asset-location-request";

const MOCK_SEARCH_KEY = "MOCK_SEARCH_KEY";
const MOCK_GATEWAY_URL = "https://mock-gateway-url.com";
const MOCK_DUMP_ID = "1";
const MOCK_DUMP_NAME = "MOCK_DUMP_NAME";
const MOCK_DUMP_DESCRIPTION = "MOCK_DUMP_DESCRIPTION";
const MOCK_CREATED_BY = "User1";
const MOCK_USER_CASE_1 = StorageUseCase.CLIENT_CONFIGURATIONS;
const MOCK_USER_CASE_2 = StorageUseCase.FACTORY_PRODUCTS;
const MOCK_USE_CASES = [MOCK_USER_CASE_1, MOCK_USER_CASE_2];
const MOCK_STORAGE: Storage = {
  id: "storage_id",
  baseUri: "base-uri",
  name: "name",
  storageType: StorageType.HTTP,
  useCases: MOCK_USE_CASES,
  createdOn: new Date(),
  createdBy: MOCK_CREATED_BY,
};
const MOCK_ASSET_LOCATION_NICKNAME = "MOCK_ASSET_LOCATION_NICKNAME";
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
const SERVER_TYPE = DumpServerType.ORACLE;
const PROJECT_ID = "PROJECT-ID";
const PROJECT_ID2 = "PROJECT-ID2";
const SERVER_VERISON = "SERVER-VERSION";
const MX_DB_TYPE1 = "MX-DB-TYPE1";
const MX_DB_TYPE2 = "MX-DB-TYPE2";
const MX_DB_TYPES = [MX_DB_TYPE1, MX_DB_TYPE2];
const VERSION = "VERSION";
const SIZE = 1000;
const SCHEMA = "SCHEMA";

const DUMP_STRIPE_ID1 = "DUMP-ID1";
const DUMP_STRIPE_NAME1 = "DUMP-NAME1";
const DUMP_STRIPE_ID2 = "DUMP-ID2";
const DUMP_STRIPE_NAME2 = "DUMP-NAME2";

const DUMP_DUMP_STRIPE1: DumpStripe = {
  id: DUMP_STRIPE_ID1,
  name: DUMP_STRIPE_NAME1,
};

const DUMP_DUMP_STRIPE2: DumpStripe = {
  id: DUMP_STRIPE_ID2,
  name: DUMP_STRIPE_NAME2,
};

const DUMP_STRIPES: DumpStripe[] = [DUMP_DUMP_STRIPE1, DUMP_DUMP_STRIPE2];

const MOCK_DUMP: Dump = {
  id: MOCK_DUMP_ID,
  serverType: SERVER_TYPE,
  serverVersion: SERVER_VERISON,
  projectId: PROJECT_ID,
  mxDbTypes: MX_DB_TYPES,
  version: VERSION,
  size: SIZE,
  schema: SCHEMA,
  compressed: true,
  purged: true,
  archived: false,
  mxDeployPackage: MOCK_MXDEPLOY_PACKAGE,
  asset: MOCK_ASSET,
  createdOn: new Date(),
  createdBy: MOCK_CREATED_BY,
  stripes: DUMP_STRIPES,
};

const DUMPS_PAGE: DumpsPage = {
  content: [MOCK_DUMP],
  size: 1,
  number: 1,
  totalPages: 1,
  totalElements: 1,
  last: true,
};
const MOCK_PAGE_SIZE = 10;
const MOCK_PAGE_INDEX = 0;

describe("ArtifactDumpsService", () => {
  let service: ArtifactDumpsService;
  let httpMock: HttpTestingController;
  const mockAppConfig = {
    gatewayUrl: MOCK_GATEWAY_URL,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ArtifactDumpsService,
        { provide: APP_CONFIG, useValue: mockAppConfig },
      ],
    });
    service = TestBed.inject(ArtifactDumpsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("Get All Dumps Tests", () => {
    it("should call getAllDumps when projectIds is defined and search key is defined and return a DumpsPage", () => {
      const projectIds = [PROJECT_ID, PROJECT_ID2];

      const filters: FetchDumpsFilter = {
        pageSize: MOCK_PAGE_SIZE,
        pageIndex: MOCK_PAGE_INDEX,
        projectIds: projectIds,
        searchKey: MOCK_SEARCH_KEY,
        archived: true,
        purged: true,
      };

      service.getAllDumps(filters).subscribe((res) => {
        expect(res).toEqual(DUMPS_PAGE);
      });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/dumps?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&sort=createdOn,desc&searchKey=${MOCK_SEARCH_KEY}&projectIds=${PROJECT_ID}&projectIds=${PROJECT_ID2}&archived=true&purged=true`
      );
      expect(req.request.method).toBe("GET");
      req.flush(DUMPS_PAGE);
    });

    it("should call getAllDumps when projectIds/archived/purged are undefined and search key is empty and return a DumpsPage", () => {
      const filters: FetchDumpsFilter = {
        pageSize: MOCK_PAGE_SIZE,
        pageIndex: MOCK_PAGE_INDEX,
        searchKey: "",
      };

      service.getAllDumps(filters).subscribe((res) => {
        expect(res).toEqual(DUMPS_PAGE);
      });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/dumps?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&sort=createdOn,desc`
      );
      expect(req.request.method).toBe("GET");
      req.flush(DUMPS_PAGE);
    });

    it("should handle errors from getAllDumps", () => {
      const filters: FetchDumpsFilter = {
        pageSize: MOCK_PAGE_SIZE,
        pageIndex: MOCK_PAGE_INDEX,
        searchKey: "",
      };

      service.getAllDumps(filters).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/dumps?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&sort=createdOn,desc`
      );
      req.flush("Something went wrong", {
        status: 500,
        statusText: "Server Error",
      });
    });
  });

  describe("Create Dump Tests", () => {
    const MOCK_CREATE_ASSET_LOCATION_REQUEST: CreatePathBasedAssetLocationRequest =
      {
        storageId: MOCK_STORAGE.id,
        relativePath: "/full/path",
        type: AssetLocationType.PATH,
      };

    const MOCK_CREATE_ASSET_REQUEST: CreateAssetRequest = {
      nickname: MOCK_ASSET_LOCATION_NICKNAME,
      locations: [MOCK_CREATE_ASSET_LOCATION_REQUEST],
    };

    const MOCK_STRIPES_REQUEST: DumpStripeRequest = {
      name: DUMP_STRIPE_NAME1,
    };

    const request: CreateDumpRequest = {
      name: MOCK_DUMP_NAME,
      description: MOCK_DUMP_DESCRIPTION,
      size: SIZE,
      asset: MOCK_CREATE_ASSET_REQUEST,
      mxDeployPackageId: MOCK_MXDEPLOY_PACKAGE.id,
      serverVersion: SERVER_VERISON,
      version: VERSION,
      mxDbTypes: MX_DB_TYPES,
      serverType: SERVER_TYPE,
      stripes: [MOCK_STRIPES_REQUEST],
      compressed: true,
      schema: SCHEMA,
    };

    it("should call createDump", () => {
      service.createDump(PROJECT_ID, request).subscribe((res) => {
        expect(res).toEqual(MOCK_DUMP);
      });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/projects/${PROJECT_ID}/dumps`
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toBe(request);
      req.flush(DUMPS_PAGE);
    });

    it("should handle errors from createDump", () => {
      service.createDump(PROJECT_ID, request).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/projects/${PROJECT_ID}/dumps`
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toBe(request);
      req.flush("Something went wrong", {
        status: 500,
        statusText: "Server Error",
      });
    });
  });

  describe("Archive Dump Tests", () => {
    it("should call archiveDump with PUT and return void on 204", () => {
      service.archiveDump(PROJECT_ID, MOCK_DUMP_ID).subscribe((res) => {
        expect(res).toBeUndefined();
      });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/projects/${PROJECT_ID}/dumps/${MOCK_DUMP_ID}/archive`
      );
      expect(req.request.method).toBe("PUT");
      expect(req.request.body).toBeNull();
      req.flush(null, { status: 204, statusText: "No Content" });
    });

    it("should handle errors from archiveDump", () => {
      service.archiveDump(PROJECT_ID, MOCK_DUMP_ID).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/projects/${PROJECT_ID}/dumps/${MOCK_DUMP_ID}/archive`
      );
      req.flush("Something went wrong", {
        status: 500,
        statusText: "Server Error",
      });
    });
  });
});
