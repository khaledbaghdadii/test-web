import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { PageResponse } from "@mxflow/ui/mxevolve-dropdown";
import { FactoryProductApiService } from "./factory-product-api.service";
import { FactoryProduct } from "./models/factory-product";
import { SoftwareProductBuild } from "./models/software-product-build";
import { SoftwareProductVersion } from "./models/software-product-version";

describe("FactoryProductApiService", () => {
  let service: FactoryProductApiService;
  let httpMock: HttpTestingController;

  const GATEWAY_URL = "https://gateway.test/";

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
        FactoryProductApiService,
      ],
    });

    service = TestBed.inject(FactoryProductApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe("getFactoryProducts", () => {
    it("constructs the correct URL with default params", () => {
      service
        .getFactoryProducts("project-1", { pageIndex: 0, pageSize: 10 })
        .subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url ===
            `${GATEWAY_URL}artifact-management/projects/project-1/factory-products` &&
          request.params.get("page") === "0" &&
          request.params.get("size") === "10" &&
          request.params.get("sort") === "createdOn,asc"
      );

      expect(req.request.method).toBe("GET");
    });

    it("includes softwareProductVersionFilter when provided", () => {
      service
        .getFactoryProducts("project-1", {
          softwareProductVersionFilter: "3.1.65",
          pageIndex: 0,
          pageSize: 10,
        })
        .subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url ===
            `${GATEWAY_URL}artifact-management/projects/project-1/factory-products` &&
          request.params.get("softwareProductVersionFilter") === "3.1.65"
      );

      expect(req.request.method).toBe("GET");
    });

    it("includes softwareProductBuildIdFilter when provided", () => {
      service
        .getFactoryProducts("project-1", {
          softwareProductBuildFilter: "build-1",
          pageIndex: 0,
          pageSize: 10,
        })
        .subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url ===
            `${GATEWAY_URL}artifact-management/projects/project-1/factory-products` &&
          request.params.get("softwareProductBuildIdFilter") === "build-1"
      );

      expect(req.request.method).toBe("GET");
    });

    it("includes configurationComponentVersionSearch when provided", () => {
      service
        .getFactoryProducts("project-1", {
          configurationComponentVersionSearch: "bip-search",
          pageIndex: 0,
          pageSize: 10,
        })
        .subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url ===
            `${GATEWAY_URL}artifact-management/projects/project-1/factory-products` &&
          request.params.get("configurationComponentVersionSearch") ===
            "bip-search"
      );

      expect(req.request.method).toBe("GET");
    });

    it("does not include undefined filter params", () => {
      service
        .getFactoryProducts("project-1", { pageIndex: 0, pageSize: 10 })
        .subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url ===
          `${GATEWAY_URL}artifact-management/projects/project-1/factory-products`
      );

      expect(req.request.params.has("softwareProductVersionFilter")).toBe(
        false
      );
      expect(req.request.params.has("softwareProductBuildIdFilter")).toBe(
        false
      );
      expect(
        req.request.params.has("configurationComponentVersionSearch")
      ).toBe(false);
      expect(req.request.params.has("fetchGlobal")).toBe(false);
    });

    it("includes fetchGlobal when set to true", () => {
      service
        .getFactoryProducts("project-1", {
          fetchGlobal: true,
          pageIndex: 0,
          pageSize: 10,
        })
        .subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url ===
            `${GATEWAY_URL}artifact-management/projects/project-1/factory-products` &&
          request.params.get("fetchGlobal") === "true"
      );

      expect(req.request.method).toBe("GET");
    });

    it("includes fetchGlobal when set to false", () => {
      service
        .getFactoryProducts("project-1", {
          fetchGlobal: false,
          pageIndex: 0,
          pageSize: 10,
        })
        .subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url ===
            `${GATEWAY_URL}artifact-management/projects/project-1/factory-products` &&
          request.params.get("fetchGlobal") === "false"
      );

      expect(req.request.method).toBe("GET");
    });

    it("propagates errors", () => {
      let error: Error | undefined;
      service
        .getFactoryProducts("project-1", { pageIndex: 0, pageSize: 10 })
        .subscribe({
          error: (e) => {
            error = e;
          },
        });

      httpMock
        .expectOne(
          (request) =>
            request.url ===
            `${GATEWAY_URL}artifact-management/projects/project-1/factory-products`
        )
        .flush("Server error", {
          status: 500,
          statusText: "Internal Server Error",
        });

      expect(error).toBeDefined();
    });
  });

  describe("getFactoryProductById", () => {
    it("constructs the correct URL", () => {
      service.getFactoryProductById("project-1", "fp-123").subscribe();

      const req = httpMock.expectOne(
        `${GATEWAY_URL}artifact-management/projects/project-1/factory-products/fp-123`
      );

      expect(req.request.method).toBe("GET");
    });

    it("returns the factory product", () => {
      const mockFactoryProduct = {
        id: "fp-123",
        type: "OFFICIAL",
        softwareProduct: {
          id: "sp-1",
          version: "3.1.65",
          revision: "1",
          builds: [],
        },
        configurationComponents: [],
        createdOn: "2026-01-01",
        lastModifiedOn: "2026-01-01",
        createdBy: "user",
        lastModifiedBy: "user",
      };

      let result: FactoryProduct | undefined;
      service.getFactoryProductById("project-1", "fp-123").subscribe((r) => {
        result = r;
      });

      httpMock
        .expectOne(
          `${GATEWAY_URL}artifact-management/projects/project-1/factory-products/fp-123`
        )
        .flush(mockFactoryProduct);

      expect(result?.id).toBe("fp-123");
    });

    it("propagates errors", () => {
      let error: Error | undefined;
      service.getFactoryProductById("project-1", "fp-123").subscribe({
        error: (e) => {
          error = e;
        },
      });

      httpMock
        .expectOne(
          `${GATEWAY_URL}artifact-management/projects/project-1/factory-products/fp-123`
        )
        .flush("Not found", { status: 404, statusText: "Not Found" });

      expect(error).toBeDefined();
    });
  });

  describe("getDistinctVersions", () => {
    it("constructs the correct URL with query params", () => {
      service.getDistinctVersions("project-1", 0, 20).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url ===
            `${GATEWAY_URL}artifact-management/projects/project-1/factory-products/software-product-versions` &&
          request.params.get("page") === "0" &&
          request.params.get("size") === "20"
      );

      expect(req.request.method).toBe("GET");
    });

    it("does not send purged param", () => {
      service.getDistinctVersions("project-1", 0, 20).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url ===
          `${GATEWAY_URL}artifact-management/projects/project-1/factory-products/software-product-versions`
      );

      expect(req.request.params.has("purged")).toBe(false);
    });

    it("maps Spring Page to PageResponse", () => {
      const springPage = {
        content: [{ version: "3.1.65" }, { version: "3.1.64" }],
        last: false,
        totalPages: 5,
        totalElements: 50,
        size: 10,
        number: 0,
      };

      let result: PageResponse<SoftwareProductVersion> | undefined;
      service.getDistinctVersions("project-1", 0, 10).subscribe((r) => {
        result = r;
      });

      httpMock
        .expectOne(
          (request) =>
            request.url ===
            `${GATEWAY_URL}artifact-management/projects/project-1/factory-products/software-product-versions`
        )
        .flush(springPage);

      expect(result).toEqual({
        content: [{ version: "3.1.65" }, { version: "3.1.64" }],
        last: false,
      });
    });

    it("propagates errors", () => {
      let error: Error | undefined;
      service.getDistinctVersions("project-1", 0, 10).subscribe({
        error: (e) => {
          error = e;
        },
      });

      httpMock
        .expectOne(
          (request) =>
            request.url ===
            `${GATEWAY_URL}artifact-management/projects/project-1/factory-products/software-product-versions`
        )
        .flush("Server error", {
          status: 500,
          statusText: "Internal Server Error",
        });

      expect(error).toBeDefined();
    });

    it("encodes the projectId in the URL", () => {
      service.getDistinctVersions("project with spaces", 0, 10).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url ===
          `${GATEWAY_URL}artifact-management/projects/project%20with%20spaces/factory-products/software-product-versions`
      );

      expect(req.request.method).toBe("GET");
    });
  });

  describe("getDistinctBuilds", () => {
    it("constructs the correct URL with query params", () => {
      service.getDistinctBuilds("project-1", "3.1.65", 0, 10).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url ===
            `${GATEWAY_URL}artifact-management/projects/project-1/factory-products/software-product-builds` &&
          request.params.get("softwareProductVersion") === "3.1.65" &&
          request.params.get("page") === "0" &&
          request.params.get("size") === "10"
      );

      expect(req.request.method).toBe("GET");
    });

    it("does not send purged param", () => {
      service.getDistinctBuilds("project-1", "3.1.65", 0, 10).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url ===
          `${GATEWAY_URL}artifact-management/projects/project-1/factory-products/software-product-builds`
      );

      expect(req.request.params.has("purged")).toBe(false);
    });

    it("maps Spring Page to PageResponse", () => {
      const springPage = {
        content: [
          { buildId: "build-1", projectId: undefined },
          { buildId: "build-2", projectId: "project-1" },
        ],
        last: true,
        totalPages: 1,
        totalElements: 2,
        size: 10,
        number: 0,
      };

      let result: PageResponse<SoftwareProductBuild> | undefined;
      service.getDistinctBuilds("project-1", "3.1.65", 0, 10).subscribe((r) => {
        result = r;
      });

      httpMock
        .expectOne(
          (request) =>
            request.url ===
            `${GATEWAY_URL}artifact-management/projects/project-1/factory-products/software-product-builds`
        )
        .flush(springPage);

      expect(result).toEqual({
        content: [
          { buildId: "build-1", projectId: undefined },
          { buildId: "build-2", projectId: "project-1" },
        ],
        last: true,
      });
    });

    it("propagates errors", () => {
      let error: Error | undefined;
      service.getDistinctBuilds("project-1", "3.1.65", 0, 10).subscribe({
        error: (e) => {
          error = e;
        },
      });

      httpMock
        .expectOne(
          (request) =>
            request.url ===
            `${GATEWAY_URL}artifact-management/projects/project-1/factory-products/software-product-builds`
        )
        .flush("Server error", {
          status: 500,
          statusText: "Internal Server Error",
        });

      expect(error).toBeDefined();
    });
  });
});
