import { lastValueFrom, of, throwError } from "rxjs";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { AppConfig } from "@mxflow/config";
import { FinalProductService } from "./final-product.service";
import {
  FinalProductApiResponse,
  FinalProductsApiResponse,
} from "./model/final-product-api-response";
import { FinalProduct, FinalProducts } from "./model/final-product";
import { FinalProductFilters } from "./model/final-product-filters";
import {
  FinalProductLatestSyncState,
  FinalProductState,
} from "@mxflow/features/artifact-manager";
import { SyncFinalProductApiRequest } from "./model/sync-final-product-api-request";

const finalProductApiResponse: FinalProductApiResponse = {
  id: "finalProductId",
  projectId: "projectId",
  branch: "branch",
  repositoryId: "repositoryId",
  tag: "tag",
  validationLevel: "validationLevel",
  version: "version",
  environmentDefinitionId: "environmentDefinitionId",
  configurationCommitId: "configurationCommitId",
  state: "available",
  latestSyncState: FinalProductLatestSyncState.SUCCESS,
  createdOn: "createdOnDate",
  rtpProduct: {
    id: "id",
    tag: "tag",
    rtpCommitId: "rtpCommitId",
  },
  factoryProduct: {
    id: "id",
    type: "type",
    softwareProduct: {
      id: "id",
      version: "version",
      revision: "revision",
    },
  },
  clientConfigurations: [
    {
      id: "id",
      type: "type",
      branch: "branch",
      commitId: "commitId",
    },
  ],
  mxBundles: [
    {
      id: "id",
      type: "type",
    },
  ],
  isTools: [
    {
      id: "id",
      type: "type",
      name: "name",
    },
  ],
  syncRequests: [],
};

const finalProductsApiResponse: FinalProductsApiResponse = {
  content: [finalProductApiResponse],
  last: true,
  size: 1,
  number: 1,
  totalElements: 2,
  totalPages: 1,
};

const expectedFinalProduct: FinalProduct = {
  id: "finalProductId",
  projectId: "projectId",
  branch: "branch",
  repositoryId: "repositoryId",
  tag: "tag",
  validationLevel: "validationLevel",
  version: "version",
  environmentDefinitionId: "environmentDefinitionId",
  configurationCommitId: "configurationCommitId",
  state: "available",
  latestSyncState: FinalProductLatestSyncState.SUCCESS,
  createdOn: "createdOnDate",
  rtpProduct: {
    id: "id",
    tag: "tag",
    rtpCommitId: "rtpCommitId",
  },
  factoryProduct: {
    id: "id",
    type: "type",
    softwareProduct: {
      id: "id",
      version: "version",
      revision: "revision",
    },
  },
  clientConfigurations: [
    {
      id: "id",
      type: "type",
      branch: "branch",
      commitId: "commitId",
    },
  ],
  mxBundles: [
    {
      id: "id",
      type: "type",
    },
  ],
  isTools: [
    {
      id: "id",
      type: "type",
      name: "name",
    },
  ],
  syncRequests: [],
};

const expectedFinalProducts: FinalProducts = {
  content: [expectedFinalProduct],
  last: true,
  size: 1,
  number: 1,
  totalElements: 2,
  totalPages: 1,
};

const finalProductQueryParams: FinalProductFilters = {
  page: 1,
  size: 10,
  sort: "asc",
  tag: "tag",
  configurationCommitIdSearch: "commitId",
  branchFilter: "branch",
  validationLevelFilter: ["MQG"],
  bundleTypeSearchKey: "bundle1",
  commitIdSearchKey: "commitId",
  isToolTypeFilters: ["isTool1"],
  projectIds: ["project1", "project2"],
  searchKey: "searchKey",
  stateFilter: [FinalProductState.AVAILABLE, FinalProductState.FAILED],
  latestSyncStateFilter: FinalProductLatestSyncState.SUCCESS,
};

describe("Service: FinalProductService", () => {
  let service: FinalProductService;
  let httpClient: HttpClient;
  const appConfig: AppConfig = {
    gatewayUrl: "https://gateway.cd.murex.com/api/v1/",
  } as unknown as AppConfig;

  beforeEach(() => {
    httpClient = {
      get: jest.fn(() => {
        return of(finalProductApiResponse);
      }),
      post: jest.fn(() => {
        return of({});
      }),
    } as unknown as HttpClient;

    service = new FinalProductService(appConfig, httpClient);
  });

  describe("fetch final product by id", () => {
    it("should return correct final product by id", async () => {
      const result = await lastValueFrom(
        service.getFinalProductById("id", "projectId")
      );
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          "artifact-management/projects/projectId/final-products/id"
      );
      expect(result).toEqual(finalProductApiResponse);
    });

    it("should throw an error when failing to fetch final product by id", async () => {
      httpClient = {
        get: jest.fn(() => {
          return throwError(() => new Error("Fake error"));
        }),
      } as unknown as HttpClient;

      service = new FinalProductService(appConfig, httpClient);

      service.getFinalProductById("id", "projectId").subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
        },
      });
    });
  });

  describe("fetch final products", () => {
    beforeEach(() => {
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(of(finalProductsApiResponse));
    });

    it("should fetch all final products happy path", async () => {
      const actualFinalProducts = await lastValueFrom(
        service.getFinalProducts(finalProductQueryParams, "projectId")
      );
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/final-products`,
        {
          params: new HttpParams({
            fromObject: { ...finalProductQueryParams },
          }),
        }
      );
      expect(actualFinalProducts).toEqual(expectedFinalProducts);
    });

    it("should add page index as query params when passed as a filter", () => {
      service.getFinalProducts({ page: 0 }, "projectId");
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/final-products`,
        {
          params: new HttpParams({ fromObject: { page: 0 } }),
        }
      );
    });

    it("should add page size as query params when passed as a filter", () => {
      service.getFinalProducts({ size: 10 }, "projectId");
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/final-products`,
        {
          params: new HttpParams({ fromObject: { size: 10 } }),
        }
      );
    });

    it("should add configCommitId as query params when passed as a filter", () => {
      service.getFinalProducts(
        { configurationCommitIdSearch: "ae123" },
        "projectId"
      );
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/final-products`,
        {
          params: new HttpParams({
            fromObject: { configurationCommitIdSearch: "ae123" },
          }),
        }
      );
    });

    it("should add tag as query params when passed as a filter", () => {
      service.getFinalProducts({ tag: "tag" }, "projectId");
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/final-products`,
        {
          params: new HttpParams({ fromObject: { tag: "tag" } }),
        }
      );
    });

    it("should add branchFilter as query params when passed as a filter", () => {
      service.getFinalProducts({ branchFilter: "test-branch" }, "projectId");
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/final-products`,
        {
          params: new HttpParams({
            fromObject: { branchFilter: "test-branch" },
          }),
        }
      );
    });

    it("should add stateFilter as query params when passed as a filter", () => {
      service.getFinalProducts(
        {
          stateFilter: [FinalProductState.AVAILABLE, FinalProductState.FAILED],
        },
        "projectId"
      );
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/final-products`,
        {
          params: new HttpParams({
            fromObject: {
              stateFilter: [
                FinalProductState.AVAILABLE,
                FinalProductState.FAILED,
              ],
            },
          }),
        }
      );
    });

    it("should add latestSyncStateFilter as query params when passed as a filter", () => {
      service.getFinalProducts(
        { latestSyncStateFilter: FinalProductLatestSyncState.SUCCESS },
        "projectId"
      );
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/final-products`,
        {
          params: new HttpParams({
            fromObject: {
              latestSyncStateFilter: FinalProductLatestSyncState.SUCCESS,
            },
          }),
        }
      );
    });

    it("should add sort as query params when passed as a filter", () => {
      service.getFinalProducts({ sort: "asc" }, "projectId");
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/final-products`,
        {
          params: new HttpParams({ fromObject: { sort: "asc" } }),
        }
      );
    });

    it("should not include a filter with an undefined value", () => {
      service.getFinalProducts(
        { sort: "asc", configurationCommitIdSearch: undefined },
        "projectId"
      );
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/final-products`,
        {
          params: new HttpParams({ fromObject: { sort: "asc" } }),
        }
      );
    });

    it("should not include a filter with an empty value", () => {
      service.getFinalProducts(
        { sort: "asc", validationLevelFilter: [] },
        "projectId"
      );
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/final-products`,
        {
          params: new HttpParams({
            fromObject: { sort: "asc", validationLevelFilter: [] },
          }),
        }
      );
    });

    it("should not include a filter with a null value", () => {
      service.getFinalProducts(
        { sort: "asc", configurationCommitIdSearch: null as unknown as string },
        "projectId"
      );
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/final-products`,
        {
          params: new HttpParams({ fromObject: { sort: "asc" } }),
        }
      );
    });
    it("should sort by createdOn descending", () => {
      service.getFinalProducts({ sort: "createdOn,desc" }, "projectId");
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/final-products`,
        {
          params: new HttpParams({ fromObject: { sort: "createdOn,desc" } }),
        }
      );
    });
    it("should throw error on failure to fetch final products", (done) => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "error",
      });
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(throwError(() => errorResponse));
      service.getFinalProducts({}, "projectId").subscribe({
        error: (error) => {
          expect(error.message).toEqual("error");
          done();
        },
      });
    });
  });

  describe("fetch filtered final products", () => {
    beforeEach(() => {
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(of(finalProductsApiResponse));
    });

    it("should fetch all final products happy path", async () => {
      const actualFinalProducts = await lastValueFrom(
        service.getFilteredFinalProducts(finalProductQueryParams)
      );
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl + `artifact-management/final-products`,
        {
          params: new HttpParams({
            fromObject: { ...finalProductQueryParams },
          }),
        }
      );
      expect(actualFinalProducts).toEqual(expectedFinalProducts);
    });

    it("should sort by createdOn descending", () => {
      service.getFilteredFinalProducts({ sort: "createdOn,desc" });
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl + `artifact-management/final-products`,
        {
          params: new HttpParams({ fromObject: { sort: "createdOn,desc" } }),
        }
      );
    });

    it("should not include a filter with an undefined value", () => {
      service.getFilteredFinalProducts({
        sort: "asc",
        configurationCommitIdSearch: undefined,
      });
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl + `artifact-management/final-products`,
        {
          params: new HttpParams({ fromObject: { sort: "asc" } }),
        }
      );
    });

    it("should throw error on failure to fetch final products", () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "error",
      });
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(throwError(() => errorResponse));
      service.getFilteredFinalProducts({}).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
        },
      });
    });
  });

  describe("sync final product", () => {
    const syncToNfsRequest: SyncFinalProductApiRequest = {
      infraGroupId: "infraGroupId",
      environmentDefinitionIds: ["environmentDefinitionId"],
      lightPackage: false,
      destinationMetadata: {
        storageType: "nfs",
        packageName: "packageName",
        directoryName: "directoryName",
      },
    };
    it("should sync final product to nfs location happy path", async () => {
      await lastValueFrom(
        service.syncFinalProduct(
          "projectId",
          "finalProductId",
          syncToNfsRequest
        )
      );
      expect(httpClient.post).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/final-products/finalProductId/sync`,
        syncToNfsRequest
      );
    });
    it("should sync final product to nexus3 happy path", async () => {
      const syncToNexusRequest: SyncFinalProductApiRequest = {
        infraGroupId: "infraGroupId",
        environmentDefinitionIds: ["environmentDefinitionId"],
        lightPackage: false,
        destinationMetadata: {
          storageType: "nexus3",
          groupId: "groupId",
          artifactId: "artifactId",
          version: "version",
          classifier: "classifier",
        },
      };
      await lastValueFrom(
        service.syncFinalProduct(
          "projectId",
          "finalProductId",
          syncToNexusRequest
        )
      );
      expect(httpClient.post).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/final-products/finalProductId/sync`,
        syncToNexusRequest
      );
    });

    it("should throw an error when failing to sync final product", (done) => {
      httpClient = {
        post: jest.fn(() => {
          return throwError(() => new Error("Fake error"));
        }),
      } as unknown as HttpClient;

      service = new FinalProductService(appConfig, httpClient);

      service
        .syncFinalProduct("projectId", "finalProductId", syncToNfsRequest)
        .subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
            done();
          },
        });
    });
  });
});
