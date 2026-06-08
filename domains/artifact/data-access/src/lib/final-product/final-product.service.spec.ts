import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { firstValueFrom } from "rxjs";
import { FinalProductState } from "./final-product.model";
import { FinalProductService } from "./final-product.service";

describe("FinalProductService", () => {
  const GATEWAY_URL = "https://gateway.test/";

  let service: FinalProductService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
        FinalProductService,
      ],
    });

    service = TestBed.inject(FinalProductService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("fetches a final product by id", async () => {
    const resultPromise = firstValueFrom(
      service.getFinalProductById("project-001", "final-product-001")
    );

    const request = httpController.expectOne(
      `${GATEWAY_URL}artifact-management/projects/project-001/final-products/final-product-001`
    );
    expect(request.request.method).toBe("GET");
    request.flush({
      id: "final-product-001",
      projectId: "project-001",
      branch: "release/branch",
      repositoryId: "repo-001",
      clientConfigurations: [],
      environmentDefinitionId: "env-def-001",
      version: "1",
      configurationCommitId: "abc123",
      state: FinalProductState.AVAILABLE,
      mxBundles: [],
      isTools: [],
      createdOn: "2026-06-01T10:00:00Z",
      syncRequests: [],
    });

    const result = await resultPromise;

    expect(result.id).toBe("final-product-001");
    expect(result.configurationCommitId).toBe("abc123");
  });

  it("fetches final products with filters", () => {
    service
      .getFinalProducts("project-001", {
        page: 0,
        size: 10,
        sort: "createdOn,desc",
        validationLevelFilter: ["MQG", "DQG"],
        searchKey: "tag-1",
      })
      .subscribe();

    const request = httpController.expectOne(
      (req) =>
        req.url ===
          `${GATEWAY_URL}artifact-management/projects/project-001/final-products` &&
        req.params.get("page") === "0" &&
        req.params.get("size") === "10" &&
        req.params.get("sort") === "createdOn,desc" &&
        req.params.getAll("validationLevelFilter")?.join(",") === "MQG,DQG" &&
        req.params.get("searchKey") === "tag-1"
    );

    expect(request.request.method).toBe("GET");
    request.flush({
      content: [],
      totalPages: 0,
      totalElements: 0,
      size: 10,
      number: 0,
      last: true,
    });
  });

  it("propagates backend error messages", async () => {
    const resultPromise = firstValueFrom(
      service.getFinalProductById("project-001", "missing")
    ).catch((error) => error);

    const request = httpController.expectOne(
      `${GATEWAY_URL}artifact-management/projects/project-001/final-products/missing`
    );
    request.flush(
      { message: "final product not found" },
      { status: 404, statusText: "Not Found" }
    );

    const result = await resultPromise;

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("final product not found");
  });
});
