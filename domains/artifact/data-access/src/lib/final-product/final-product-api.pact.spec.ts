import { Matchers, Pact } from "@pact-foundation/pact";
import { eachLike } from "@pact-foundation/pact/src/dsl/matchers";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { lastValueFrom } from "rxjs";
import { FinalProductApiService } from "./final-product-api.service";

const PROJECT_ID = "projectId";
const FINAL_PRODUCT_ID = "finalProductId";

describe("final product api service contract tests", () => {
  const provider = new Pact({
    consumer: "web-artifact",
    provider: "artifact-management-service",
  });

  let service: FinalProductApiService;

  beforeAll(async () => {
    await provider.setup();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        {
          provide: GATEWAY_CONFIG,
          useValue: { gatewayUrl: `http://127.0.0.1:${provider.opts.port}/` },
        },
        FinalProductApiService,
      ],
    });
    service = TestBed.inject(FinalProductApiService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("validates contract for fetching final products for a project", async () => {
    await provider.addInteraction({
      state: "can get final products without query params",
      uponReceiving: "a request to fetch final products for a project",
      withRequest: {
        method: "GET",
        path: `/artifact-management/projects/${PROJECT_ID}/final-products`,
        query: { page: "0", size: "50", fetchParent: "true" },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          content: eachLike(finalProductMatcher()),
          totalPages: Matchers.integer(1),
          totalElements: Matchers.integer(1),
          size: Matchers.integer(50),
          number: Matchers.integer(0),
          last: Matchers.boolean(true),
        },
      },
    });

    const response = await lastValueFrom(
      service.getFinalProducts(PROJECT_ID, { fetchParent: true })
    );

    expect(response.content.length).toBeGreaterThan(0);
  });

  test("validates contract for fetching a final product by id", async () => {
    await provider.addInteraction({
      state: "can get final product",
      uponReceiving: "a request to fetch a final product by id",
      withRequest: {
        method: "GET",
        path: `/artifact-management/projects/${PROJECT_ID}/final-products/${FINAL_PRODUCT_ID}`,
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: finalProductMatcher(),
      },
    });

    const response = await lastValueFrom(
      service.getFinalProductById(PROJECT_ID, FINAL_PRODUCT_ID)
    );

    expect(response.id).toBeDefined();
  });
});

function finalProductMatcher() {
  return {
    id: Matchers.string("fp-1"),
    projectId: Matchers.string(PROJECT_ID),
    branch: Matchers.string("main"),
    repositoryId: Matchers.string("repo-1"),
    version: Matchers.string("1.0.0"),
    configurationCommitId: Matchers.string("abc123"),
    state: Matchers.string("AVAILABLE"),
    createdOn: Matchers.string("2024-01-01T00:00:00Z"),
  };
}
