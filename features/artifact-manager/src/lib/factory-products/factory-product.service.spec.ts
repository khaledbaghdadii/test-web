import { ArtifactFactoryProductsService } from "./factory-product.service";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import {
  FactoryProduct,
  FactoryProducts,
} from "../api-models/factory-product/factory-product";
import { SyncFactoryProductApiRequest } from "./model/request/sync-factory-product-api-request";
import { provideHttpClient } from "@angular/common/http";
import { Bundles } from "../bundles/model/bundles";

const MOCK_GATEWAY_URL = "https://mock-gateway-url.com";
const VALIDATION_DATE = new Date();
const VALIDATION_LEVEL = "CQG";
const SOFTWARE_PRODUCT_PATCH = "PATCH";
const PROJECT_ID1 = "projectId1";
const PROJECT_ID2 = "projectId2";
const FETCH_GLOBAL = true;

const factoryProduct: FactoryProduct = {
  configurationComponents: [
    {
      builds: [
        {
          id: "a1bb9d53-7f68-4981-8a33-ce0d2ec18f09",
          purged: false,
          mxBuild: {
            buildId: "6ae021d32d6-240412-0701-6698899-bipBuildBuildId",
            version: "archival.2024.027",
          },
          mxBundles: [],
        },
      ],
      id: "3d28381b-6c67-4b39-9db7-e1fc57be9b9d",
      type: "NewBIP",
      version: "archival.2024.027",
      purged: false,
    },
  ],
  createdBy: "mxflow-dev-admin",
  createdOn: "2024-07-15T08:46:01.770439Z",
  id: "0a91e12c-05b8-42c4-b2d0-8634acf4995c",
  projectId: PROJECT_ID1,
  lastModifiedBy: "mxflow-dev-admin",
  lastModifiedOn: "2024-07-15T08:46:01.770439Z",
  validationDate: VALIDATION_DATE,
  validationLevel: VALIDATION_LEVEL,
  softwareProduct: {
    builds: [
      {
        id: "82eec4fd-9907-4785-880b-efe635ed2890",
        purged: false,
        mxBuild: {
          buildId: "20005081-240508-1140-73994-SoftwareProductBuildBuildId4",
          os: "Windows-x86-5.2-64b",
          revision: "7027870",
          version: "v3.1.build.archival.2024.027",
        },
        core: {} as unknown as Bundles,
        mxBundles: [],
      },
    ],
    id: "19fb652a-d352-45e6-9c1a-19d5603a6d1c",
    revision: "7027870",
    version: "v3.1.build.archival.2024.0271",
    patch: SOFTWARE_PRODUCT_PATCH,
  },
  type: "MAINSTREAM",
};

const expectedResponse: FactoryProducts = {
  content: [factoryProduct],
  last: true,
  number: 2,
  size: 12,
  totalElements: 32,
  totalPages: 3,
};
describe("Factory Product Service Test", () => {
  let service: ArtifactFactoryProductsService;
  let httpMock: HttpTestingController;
  const mockAppConfig = {
    gatewayUrl: MOCK_GATEWAY_URL,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ArtifactFactoryProductsService,
        { provide: APP_CONFIG, useValue: mockAppConfig },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ArtifactFactoryProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("fetch factory products", () => {
    it("should return correctly a factory product and add page size and index to request", async () => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
      req.flush(expectedResponse);
    });

    it("should add software product version filter to http call correctly", async () => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
          softwareProductVersionFilter: "version",
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&softwareProductVersionFilter=version&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
    });

    it("should add software product build filter correctly", () => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
          softwareProductBuildFilter: "build",
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&softwareProductBuildIdFilter=build&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
    });

    it("should add software product version search correctly", () => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
          softwareProductVersionSearch: "versionSearch",
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&softwareProductVersionSearch=versionSearch&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
    });

    it("should add configuration component version search correctly", () => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
          configurationComponentVersionSearch: "configVersionSearch",
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&configurationComponentVersionSearch=configVersionSearch&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
    });

    it("should add software product build search value correctly", () => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
          softwareProductBuildSearch: "buildSearch",
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&softwareProductBuildIdSearch=buildSearch&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
    });

    it("should add configuration component version filter value correctly", () => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
          configurationComponentVersionFilter:
            "configurationComponentVersionFilter",
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&configurationComponentVersionFilter=configurationComponentVersionFilter&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
    });

    it("should add factory product type filter value correctly", () => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
          factoryProductTypeFilter: "factoryProductTypeFilter",
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&factoryProductTypeFilter=factoryProductTypeFilter&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
    });

    it("should add software product revision filter value correctly", () => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
          softwareProductRevisionFilter: "softwareProductRevisionFilter",
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&softwareProductRevisionFilter=softwareProductRevisionFilter&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
    });

    it("should add software product os filter value correctly", () => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
          softwareProductOsFilter: "softwareProductOsFilter",
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&softwareProductOsFilter=softwareProductOsFilter&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
    });

    it("should add factory product type search value correctly", () => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
          factoryProductTypeSearch: "factoryProductTypeSearch",
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&factoryProductTypeSearch=factoryProductTypeSearch&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
    });

    it("should add software product revision search value correctly", () => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
          softwareProductRevisionSearch: "softwareProductRevisionSearch",
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&softwareProductRevisionSearch=softwareProductRevisionSearch&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
    });

    it("should add software product os search value correctly", () => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
          softwareProductOsSearch: "softwareProductOsSearch",
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&softwareProductOsSearch=softwareProductOsSearch&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
    });

    it("should add factory product validation level search value correctly", () => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
          factoryProductValidationLevelSearch:
            "factoryProductValidationLevelSearch",
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&factoryProductValidationLevelSearch=factoryProductValidationLevelSearch&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
    });

    it("should add search key value correctly", () => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
          searchKey: "searchKey",
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&searchKey=searchKey&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
    });

    it("should add parent factory product id value correctly", () => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
          parentFactoryProductIdFilter: "parentFactoryProductIdFilter",
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&parentFactoryProductIdFilter=parentFactoryProductIdFilter&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
    });

    it("should add factoryProductIdSearch filter correctly", (done) => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
          factoryProductIdSearch: "factoryProductIdSearch",
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
          done();
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&factoryProductIdSearch=factoryProductIdSearch&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
      req.flush(expectedResponse);
    });

    it("should add all given filters correctly", (done) => {
      service
        .getFactoryProducts({
          pageSize: 10,
          pageIndex: 0,
          softwareProductVersionFilter: "version",
          softwareProductBuildFilter: "build",
          softwareProductVersionSearch: "versionSearch",
          configurationComponentVersionSearch: "configVersionSearch",
          configurationComponentVersionFilter:
            "configurationComponentVersionFilter",
          factoryProductTypeFilter: "factoryProductTypeFilter",
          softwareProductRevisionFilter: "softwareProductRevisionFilter",
          softwareProductOsFilter: "softwareProductOsFilter",
          factoryProductTypeSearch: "factoryProductTypeSearch",
          softwareProductRevisionSearch: "softwareProductRevisionSearch",
          softwareProductOsSearch: "softwareProductOsSearch",
          factoryProductValidationLevelSearch:
            "factoryProductValidationLevelSearch",
          searchKey: "searchKey",
          parentFactoryProductIdFilter: "parentFactoryProductIdFilter",
          fetchGlobal: FETCH_GLOBAL,
          projectIds: [PROJECT_ID1, PROJECT_ID2],
          factoryProductIdSearch: "factoryProductIdSearch",
        })
        .subscribe((res) => {
          expect(res).toEqual(expectedResponse);
          done();
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products?page=0&size=10&factoryProductIdSearch=factoryProductIdSearch&softwareProductVersionFilter=version&softwareProductBuildIdFilter=build&softwareProductVersionSearch=versionSearch&configurationComponentVersionSearch=configVersionSearch&configurationComponentVersionFilter=configurationComponentVersionFilter&factoryProductTypeFilter=factoryProductTypeFilter&softwareProductRevisionFilter=softwareProductRevisionFilter&softwareProductOsFilter=softwareProductOsFilter&factoryProductTypeSearch=factoryProductTypeSearch&softwareProductRevisionSearch=softwareProductRevisionSearch&softwareProductOsSearch=softwareProductOsSearch&factoryProductValidationLevelSearch=factoryProductValidationLevelSearch&parentFactoryProductIdFilter=parentFactoryProductIdFilter&fetchGlobal=${FETCH_GLOBAL}&projectIds=${PROJECT_ID1}&projectIds=${PROJECT_ID2}&searchKey=searchKey&sort=createdOn%2Cdesc`
      );
      expect(req.request.method).toBe("GET");
      req.flush(expectedResponse);
    });
  });

  describe("syncFactoryProduct Tests", () => {
    const request: SyncFactoryProductApiRequest = {
      version: "version",
      buildId: "buildId",
    };

    it("should call syncFactoryProduct", () => {
      service.syncFactoryProduct(request).subscribe((res) => {
        expect(res).toEqual(factoryProduct);
      });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products/sync`
      );
      expect(req.request.method).toBe("PUT");
      req.flush(factoryProduct);
    });

    it("should handle errors from syncFactoryProduct", () => {
      service.syncFactoryProduct(request).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/factory-products/sync`
      );
      expect(req.request.method).toBe("PUT");
      req.flush("Something went wrong", {
        status: 500,
        statusText: "Server Error",
      });
    });
  });

  describe("cloneFactoryProduct test", () => {
    it("should call cloneFactoryProduct", (done) => {
      service
        .cloneFactoryProduct(PROJECT_ID1, factoryProduct.id)
        .subscribe((res) => {
          expect(res).toEqual(factoryProduct);
          done();
        });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/projects/${PROJECT_ID1}/factory-products/${factoryProduct.id}/clone`
      );

      expect(req.request.method).toBe("POST");
      req.flush(factoryProduct);
    });

    it("should handle errors from cloneFactoryProduct", (done) => {
      service.cloneFactoryProduct(PROJECT_ID1, factoryProduct.id).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}artifact-management/projects/${PROJECT_ID1}/factory-products/${factoryProduct.id}/clone`
      );
      expect(req.request.method).toBe("POST");
      req.flush("Something went wrong", {
        status: 500,
        statusText: "Server Error",
      });
    });
  });
});
