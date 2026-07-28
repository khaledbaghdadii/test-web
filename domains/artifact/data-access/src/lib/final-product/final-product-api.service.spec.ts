import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { FinalProductApiService } from "./final-product-api.service";
import type { FinalProduct, FinalProducts } from "./final-product.model";

const GATEWAY_URL = "https://test-gateway/";
const PROJECT_ID = "project-1";
const BASE_URL = `${GATEWAY_URL}artifact-management/projects/${PROJECT_ID}/final-products`;

const MOCK_FINAL_PRODUCT: FinalProduct = {
  id: "fp-001",
  projectId: PROJECT_ID,
  branch: "main",
  repositoryId: "repo-1",
  version: "1.0.0",
  configurationCommitId: "abc123",
  state: "AVAILABLE",
  createdOn: "2025-06-01T10:00:00Z",
  clientConfigurations: [],
  environmentDefinitionId: "env-1",
  mxBundles: [],
  isTools: [],
  syncRequests: [],
};

const MOCK_FINAL_PRODUCTS: FinalProducts = {
  content: [MOCK_FINAL_PRODUCT],
  totalPages: 1,
  totalElements: 1,
  size: 50,
  number: 0,
  last: true,
};

describe("FinalProductApiService", () => {
  let service: FinalProductApiService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        FinalProductApiService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });
    service = TestBed.inject(FinalProductApiService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe("getFinalProducts", () => {
    it("sends a GET request to the final-products endpoint", () => {
      service.getFinalProducts(PROJECT_ID).subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.method).toBe("GET");
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("sends default page 0 as a query param", () => {
      service.getFinalProducts(PROJECT_ID).subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.get("page")).toBe("0");
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("sends default size 50 as a query param", () => {
      service.getFinalProducts(PROJECT_ID).subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.get("size")).toBe("50");
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("sends custom page when provided in filters", () => {
      service.getFinalProducts(PROJECT_ID, { page: 3 }).subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.get("page")).toBe("3");
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("sends custom size when provided in filters", () => {
      service.getFinalProducts(PROJECT_ID, { size: 100 }).subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.get("size")).toBe("100");
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("sends branchFilter when provided", () => {
      service
        .getFinalProducts(PROJECT_ID, { branchFilter: "main" })
        .subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.get("branchFilter")).toBe("main");
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("does not send branchFilter when not provided", () => {
      service.getFinalProducts(PROJECT_ID).subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.has("branchFilter")).toBe(false);
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("sends configurationCommitIdFilter when provided", () => {
      service
        .getFinalProducts(PROJECT_ID, {
          configurationCommitIdFilter: "abc123",
        })
        .subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.get("configurationCommitIdFilter")).toBe(
        "abc123"
      );
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("does not send configurationCommitIdFilter when not provided", () => {
      service.getFinalProducts(PROJECT_ID).subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.has("configurationCommitIdFilter")).toBe(
        false
      );
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("sends fetchParent as true when provided", () => {
      service.getFinalProducts(PROJECT_ID, { fetchParent: true }).subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.get("fetchParent")).toBe("true");
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("sends fetchParent as false when explicitly provided", () => {
      service.getFinalProducts(PROJECT_ID, { fetchParent: false }).subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.get("fetchParent")).toBe("false");
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("does not send fetchParent when not provided", () => {
      service.getFinalProducts(PROJECT_ID).subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.has("fetchParent")).toBe(false);
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("sends stateFilter as comma-joined string when provided", () => {
      service
        .getFinalProducts(PROJECT_ID, {
          stateFilter: ["AVAILABLE", "EXPIRED"],
        })
        .subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.get("stateFilter")).toBe(
        "AVAILABLE,EXPIRED"
      );
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("does not send stateFilter when the array is empty", () => {
      service.getFinalProducts(PROJECT_ID, { stateFilter: [] }).subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.has("stateFilter")).toBe(false);
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("sends searchKey when provided", () => {
      service.getFinalProducts(PROJECT_ID, { searchKey: "abc123" }).subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.get("searchKey")).toBe("abc123");
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("does not send searchKey when not provided", () => {
      service.getFinalProducts(PROJECT_ID).subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.has("searchKey")).toBe(false);
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("sends sort when provided", () => {
      service
        .getFinalProducts(PROJECT_ID, { sort: "createdOn,desc" })
        .subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.get("sort")).toBe("createdOn,desc");
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("does not send sort when not provided", () => {
      service.getFinalProducts(PROJECT_ID).subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.has("sort")).toBe(false);
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("sends validationLevelFilter as repeated params when provided", () => {
      service
        .getFinalProducts(PROJECT_ID, {
          validationLevelFilter: ["MQG", "DQG"],
        })
        .subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.getAll("validationLevelFilter")).toEqual([
        "MQG",
        "DQG",
      ]);
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("does not send validationLevelFilter when the array is empty", () => {
      service
        .getFinalProducts(PROJECT_ID, { validationLevelFilter: [] })
        .subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.has("validationLevelFilter")).toBe(false);
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("returns the FinalProducts response on success", async () => {
      const resultPromise = firstValueFrom(
        service.getFinalProducts(PROJECT_ID)
      );

      httpController
        .expectOne((req) => req.url === BASE_URL)
        .flush(MOCK_FINAL_PRODUCTS);

      expect(await resultPromise).toEqual(MOCK_FINAL_PRODUCTS);
    });

    it("URL-encodes the project ID in the request URL", () => {
      service.getFinalProducts("project/with/slashes").subscribe();

      const request = httpController.expectOne((req) =>
        req.url.includes("project%2Fwith%2Fslashes")
      );
      expect(request.request.url).toContain("project%2Fwith%2Fslashes");
      request.flush(MOCK_FINAL_PRODUCTS);
    });

    it("throws an error when the server responds with 500", async () => {
      const resultPromise = firstValueFrom(
        service.getFinalProducts(PROJECT_ID)
      );

      httpController
        .expectOne((req) => req.url === BASE_URL)
        .flush("Internal server error", {
          status: 500,
          statusText: "Internal Server Error",
        });

      await expect(resultPromise).rejects.toThrow();
    });

    it("throws an error when the server responds with 404", async () => {
      const resultPromise = firstValueFrom(
        service.getFinalProducts(PROJECT_ID)
      );

      httpController
        .expectOne((req) => req.url === BASE_URL)
        .flush("Not found", { status: 404, statusText: "Not Found" });

      await expect(resultPromise).rejects.toThrow();
    });
  });

  describe("getFinalProductById", () => {
    const FINAL_PRODUCT_ID = "fp-001";
    const PRODUCT_URL = `${BASE_URL}/${FINAL_PRODUCT_ID}`;

    it("sends a GET request to the final-product-by-id endpoint", () => {
      service.getFinalProductById(PROJECT_ID, FINAL_PRODUCT_ID).subscribe();

      const request = httpController.expectOne(PRODUCT_URL);
      expect(request.request.method).toBe("GET");
      request.flush(MOCK_FINAL_PRODUCT);
    });

    it("URL-encodes the final product ID in the request URL", () => {
      const idWithSlashes = "fp/with/slashes";
      service.getFinalProductById(PROJECT_ID, idWithSlashes).subscribe();

      const request = httpController.expectOne((req) =>
        req.url.includes(encodeURIComponent(idWithSlashes))
      );
      expect(request.request.url).toContain(encodeURIComponent(idWithSlashes));
      request.flush(MOCK_FINAL_PRODUCT);
    });

    it("returns the FinalProduct on success", async () => {
      const resultPromise = firstValueFrom(
        service.getFinalProductById(PROJECT_ID, FINAL_PRODUCT_ID)
      );

      httpController.expectOne(PRODUCT_URL).flush(MOCK_FINAL_PRODUCT);

      expect(await resultPromise).toEqual(MOCK_FINAL_PRODUCT);
    });

    it("throws an error when the server responds with 500", async () => {
      const resultPromise = firstValueFrom(
        service.getFinalProductById(PROJECT_ID, FINAL_PRODUCT_ID)
      );

      httpController.expectOne(PRODUCT_URL).flush("Internal server error", {
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(resultPromise).rejects.toThrow();
    });

    it("throws an error when the server responds with 404", async () => {
      const resultPromise = firstValueFrom(
        service.getFinalProductById(PROJECT_ID, FINAL_PRODUCT_ID)
      );

      httpController
        .expectOne(PRODUCT_URL)
        .flush("Not found", { status: 404, statusText: "Not Found" });

      await expect(resultPromise).rejects.toThrow();
    });
  });
});
