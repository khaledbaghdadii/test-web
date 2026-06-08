import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { APP_CONFIG } from "@mxflow/config";
import {
  AssetLocationType,
  FetchStoragesFilter,
  Storage,
  StoragePage,
  StorageUseCase,
} from "@mxflow/features/artifact-manager";
import { ArtifactStorageService } from "./storage.service";
import {
  LookupStorageLocationResponse,
  LookupStorageLocationStorageResponse,
} from "./model/response/lookup-storage-location-response";
import { LookupStorageLocationRequest } from "./model/request/lookup-storage-location-request";
import { provideHttpClient } from "@angular/common/http";
import { StorageType } from "./model/storage-type";

const MOCK_GATEWAY_URL = "https://mock-gateway-url.com";
const PROJECT_ID = "PROJECT_ID";
const MOCK_FULL_PATH = "/MOCK_FULL_PATH";
const MOCK_STORAGE_ID = "MOCK_STORAGE_ID";
const MOCK_STORAGE_TYPE = StorageType.HTTP;
const RELATIVE_PATH = "RELATIVE_PATH";
const MOCK_CREATED_BY = "MOCK_CREATED_BY";
const MOCK_USER_CASE_1 = StorageUseCase.CLIENT_CONFIGURATIONS;
const MOCK_USER_CASE_2 = StorageUseCase.FACTORY_PRODUCTS;
const MOCK_BASE_URI = "MOCK_BASE_URI";
const MOCK_NAME = "MOCK_NAME";
const MOCK_REPOSITORY = "MOCK_BASE_URI";
const MOCK_PROJECT_ID = "PROJECT_ID";
const MOCK_USE_CASES = [MOCK_USER_CASE_1, MOCK_USER_CASE_2];
const MOCK_STORAGE: Storage = {
  id: MOCK_STORAGE_ID,
  storageType: MOCK_STORAGE_TYPE,
  repository: MOCK_REPOSITORY,
  useCases: MOCK_USE_CASES,
  name: MOCK_NAME,
  createdOn: new Date(),
  createdBy: MOCK_CREATED_BY,
  projectId: MOCK_PROJECT_ID,
  baseUri: MOCK_BASE_URI,
};
const MOCK_PAGE_SIZE = 10;
const MOCK_PAGE_INDEX = 0;
const MOCK_SEARCH_KEY = "MOCK_SEARCH_KEY";
const MOCK_PROJECT_ID_2 = "MOCK_PROJECT_ID_2";
const MOCK_FETCH_GLOBAL = true;
const MOCK_FETCH_STORAGES_FILTER: FetchStoragesFilter = {
  pageSize: MOCK_PAGE_SIZE,
  pageIndex: MOCK_PAGE_INDEX,
  storageType: MOCK_STORAGE_TYPE,
  searchKey: MOCK_SEARCH_KEY,
  projectIds: [MOCK_PROJECT_ID, MOCK_PROJECT_ID_2],
  fetchGlobal: MOCK_FETCH_GLOBAL,
  useCases: MOCK_USE_CASES,
};
const MOCK_STORAGE_PAGE: StoragePage = {
  content: [MOCK_STORAGE],
  totalPages: 1,
  totalElements: 1,
  size: MOCK_PAGE_SIZE,
  number: MOCK_PAGE_INDEX,
  last: true,
};

describe("ArtifactStorageService", () => {
  let service: ArtifactStorageService;
  let httpMock: HttpTestingController;
  const mockAppConfig = {
    gatewayUrl: MOCK_GATEWAY_URL,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ArtifactStorageService,
        { provide: APP_CONFIG, useValue: mockAppConfig },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ArtifactStorageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("Lookup Storage Location Tests", () => {
    const request: LookupStorageLocationRequest = {
      fullPath: MOCK_FULL_PATH,
    };

    const storage: LookupStorageLocationStorageResponse = {
      id: MOCK_STORAGE_ID,
      storageType: MOCK_STORAGE_TYPE,
    };

    const response: LookupStorageLocationResponse = {
      exists: true,
      isDirectory: false,
      relativePath: RELATIVE_PATH,
      storage: storage,
      type: AssetLocationType.PATH,
    };

    it("should call lookupStorageLocation and return location metadata", () => {
      service.lookupStorageLocation(PROJECT_ID, request).subscribe((res) => {
        expect(res).toEqual(response);
      });
      const encodedPath = encodeURIComponent(request.fullPath);

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/projects/${PROJECT_ID}/storages/lookup?fullPath=${encodedPath}`
      );
      expect(req.request.method).toBe("GET");
      req.flush(response);
    });

    it("should handle errors from lookupStorageLocation", () => {
      service.lookupStorageLocation(PROJECT_ID, request).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });
      const encodedPath = encodeURIComponent(request.fullPath);

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/projects/${PROJECT_ID}/storages/lookup?fullPath=${encodedPath}`
      );
      req.flush("Something went wrong", {
        status: 500,
        statusText: "Server Error",
      });
    });
  });

  describe("Get Filtered Storages", () => {
    it("should call getFilteredStorages and return a StoragePage", () => {
      service
        .getFilteredStorages(MOCK_FETCH_STORAGES_FILTER)
        .subscribe((res) => {
          expect(res).toEqual(MOCK_STORAGE_PAGE);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/storages?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&sort=createdOn,desc&storageType=${MOCK_STORAGE_TYPE}&searchKey=${encodeURIComponent(
          MOCK_FETCH_STORAGES_FILTER.searchKey
        )}&projectIds=${MOCK_PROJECT_ID}&projectIds=${MOCK_PROJECT_ID_2}&fetchGlobal=${MOCK_FETCH_GLOBAL}&useCases=${MOCK_USER_CASE_1}&useCases=${MOCK_USER_CASE_2}`
      );
      expect(req.request.method).toBe("GET");
      req.flush(MOCK_STORAGE_PAGE);
    });

    it("should handle errors from getFilteredStorages", () => {
      service.getFilteredStorages(MOCK_FETCH_STORAGES_FILTER).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/storages?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&sort=createdOn,desc&storageType=${MOCK_STORAGE_TYPE}&searchKey=${encodeURIComponent(
          MOCK_FETCH_STORAGES_FILTER.searchKey
        )}&projectIds=${MOCK_PROJECT_ID}&projectIds=${MOCK_PROJECT_ID_2}&fetchGlobal=${MOCK_FETCH_GLOBAL}&useCases=${MOCK_USER_CASE_1}&useCases=${MOCK_USER_CASE_2}`
      );
      req.flush("Something went wrong", {
        status: 500,
        statusText: "Server Error",
      });
    });
  });
});
