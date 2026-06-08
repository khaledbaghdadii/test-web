import { Matchers, Pact } from "@pact-foundation/pact";
import { eachLike } from "@pact-foundation/pact/src/dsl/matchers";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { catchError, lastValueFrom, of } from "rxjs";
import { FactoryProductApiService } from "./factory-product-selector/factory-product-api.service";
import { FinalProductService } from "./final-product/final-product.service";

const PROJECT_ID = "projectId";
const FACTORY_PRODUCT_ID = "factoryProductId";
const SOFTWARE_PRODUCT_VERSION = "3.1.65";
const SOFTWARE_PRODUCT_BUILD_ID = "buildId";
const SEARCH_KEY = "searchKey";
const FINAL_PRODUCT_ID = "finalProductId";

describe("artifact management contract tests", () => {
  const provider = new Pact({
    consumer: "web-artifact",
    provider: "artifact-management-service",
  });

  const projectId = PROJECT_ID;

  let factoryProductApiService: FactoryProductApiService;
  let finalProductService: FinalProductService;

  beforeAll(async () => {
    await provider.setup();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        {
          provide: GATEWAY_CONFIG,
          useValue: {
            gatewayUrl: `http://127.0.0.1:${provider.opts.port}/`,
          },
        },
        FactoryProductApiService,
        FinalProductService,
      ],
    });

    factoryProductApiService = TestBed.inject(FactoryProductApiService);
    finalProductService = TestBed.inject(FinalProductService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("validates contract for fetching a factory product by id", async () => {
    await provider.addInteraction({
      state: "factory product exists",
      uponReceiving: "a request to fetch a factory product by id",
      withRequest: {
        method: "GET",
        path: `/artifact-management/projects/${projectId}/factory-products/${FACTORY_PRODUCT_ID}`,
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: factoryProductMatcher(),
      },
    });

    const response = await lastValueFrom(
      factoryProductApiService.getFactoryProductById(
        projectId,
        FACTORY_PRODUCT_ID
      )
    );

    expect(response).not.toBeNull();
    expect(response.id).toBeDefined();
  });

  test("validates contract for fetching factory products with filters", async () => {
    await provider.addInteraction({
      state: "factory products exist",
      uponReceiving:
        "a request to fetch project scoped factory products with filters",
      withRequest: {
        method: "GET",
        path: `/artifact-management/projects/${projectId}/factory-products`,
        query: {
          page: "0",
          size: "20",
          sort: "createdOn,asc",
          softwareProductVersionFilter: SOFTWARE_PRODUCT_VERSION,
          softwareProductBuildIdFilter: SOFTWARE_PRODUCT_BUILD_ID,
          configurationComponentVersionSearch: SEARCH_KEY,
          fetchGlobal: "true",
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          content: eachLike(factoryProductMatcher()),
          totalPages: Matchers.integer(1),
          totalElements: Matchers.integer(1),
          size: Matchers.integer(20),
          number: Matchers.integer(0),
          last: Matchers.boolean(true),
        },
      },
    });

    const response = await lastValueFrom(
      factoryProductApiService.getFactoryProducts(projectId, {
        pageIndex: 0,
        pageSize: 20,
        softwareProductVersionFilter: SOFTWARE_PRODUCT_VERSION,
        softwareProductBuildFilter: SOFTWARE_PRODUCT_BUILD_ID,
        configurationComponentVersionSearch: SEARCH_KEY,
        fetchGlobal: true,
      })
    );

    expect(response.content.length).toBeGreaterThan(0);
  });

  test("validates contract for fetching factory products returns error", async () => {
    await provider.addInteraction({
      state: "cannot get factory products",
      uponReceiving:
        "a request to fetch project scoped factory products that fails",
      withRequest: {
        method: "GET",
        path: `/artifact-management/projects/${projectId}/factory-products`,
        query: {
          page: "0",
          size: "10",
          sort: "createdOn,asc",
        },
      },
      willRespondWith: {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          status: Matchers.integer(500),
          message: Matchers.string("factory products failure"),
          timestamp: Matchers.string("2026-04-01T00:00:00Z"),
          failureReason: Matchers.string("unexpected error"),
        },
      },
    });

    const result = await lastValueFrom(
      factoryProductApiService
        .getFactoryProducts(projectId, { pageIndex: 0, pageSize: 10 })
        .pipe(catchError((error) => of(error.message)))
    );

    expect(result).toBeTruthy();
  });

  test("validates contract for fetching distinct software product versions", async () => {
    await provider.addInteraction({
      state: "can get distinct software product versions",
      uponReceiving: "a request to fetch distinct software product versions",
      withRequest: {
        method: "GET",
        path: `/artifact-management/projects/${projectId}/factory-products/software-product-versions`,
        query: {
          page: "0",
          size: "20",
          searchKey: SEARCH_KEY,
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          content: eachLike({
            version: Matchers.string(SOFTWARE_PRODUCT_VERSION),
          }),
          last: Matchers.boolean(true),
        },
      },
    });

    const response = await lastValueFrom(
      factoryProductApiService.getDistinctVersions(projectId, 0, 20, SEARCH_KEY)
    );

    expect(response.content.length).toBeGreaterThan(0);
  });

  test("validates contract for fetching distinct software product builds", async () => {
    await provider.addInteraction({
      state: "can get distinct software product builds",
      uponReceiving: "a request to fetch distinct software product builds",
      withRequest: {
        method: "GET",
        path: `/artifact-management/projects/${projectId}/factory-products/software-product-builds`,
        query: {
          softwareProductVersion: SOFTWARE_PRODUCT_VERSION,
          page: "0",
          size: "20",
          searchKey: SEARCH_KEY,
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          content: eachLike({
            buildId: Matchers.string(SOFTWARE_PRODUCT_BUILD_ID),
            projectId: Matchers.string(projectId),
          }),
          last: Matchers.boolean(true),
        },
      },
    });

    const response = await lastValueFrom(
      factoryProductApiService.getDistinctBuilds(
        projectId,
        SOFTWARE_PRODUCT_VERSION,
        0,
        20,
        SEARCH_KEY
      )
    );

    expect(response.content.length).toBeGreaterThan(0);
  });

  test("validates contract for fetching a factory product by id returns error", async () => {
    await provider.addInteraction({
      state: "factory product does not exist",
      uponReceiving: "a request to fetch a missing factory product by id",
      withRequest: {
        method: "GET",
        path: `/artifact-management/projects/${projectId}/factory-products/${FACTORY_PRODUCT_ID}`,
      },
      willRespondWith: {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: Matchers.string("not found"),
        },
      },
    });

    const result = await lastValueFrom(
      factoryProductApiService
        .getFactoryProductById(projectId, FACTORY_PRODUCT_ID)
        .pipe(catchError((error) => of(error.message)))
    );

    expect(result).toBeTruthy();
  });

  test("validates contract for fetching a final product by id", async () => {
    await provider.addInteraction({
      state: "final product exists",
      uponReceiving: "a request to fetch a final product by id",
      withRequest: {
        method: "GET",
        path: `/artifact-management/projects/${projectId}/final-products/${FINAL_PRODUCT_ID}`,
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: finalProductMatcher(),
      },
    });

    const response = await lastValueFrom(
      finalProductService.getFinalProductById(projectId, FINAL_PRODUCT_ID)
    );

    expect(response).not.toBeNull();
    expect(response.id).toBeDefined();
    expect(response.configurationCommitId).toBeDefined();
  });

  test("validates contract for fetching final products with filters", async () => {
    await provider.addInteraction({
      state: "final products exist",
      uponReceiving: "a request to fetch project scoped final products",
      withRequest: {
        method: "GET",
        path: `/artifact-management/projects/${projectId}/final-products`,
        query: {
          page: "0",
          size: "50",
          sort: "createdOn,desc",
          validationLevelFilter: ["MQG", "DQG"],
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
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
      finalProductService.getFinalProducts(projectId, {
        page: 0,
        size: 50,
        sort: "createdOn,desc",
        validationLevelFilter: ["MQG", "DQG"],
      })
    );

    expect(response.content.length).toBeGreaterThan(0);
  });
});

function factoryProductMatcher(): Record<string, unknown> {
  return {
    createdOn: Matchers.string("2026-01-01T00:00:00Z"),
    lastModifiedOn: Matchers.string("2026-01-01T00:00:00Z"),
    createdBy: Matchers.string("user"),
    lastModifiedBy: Matchers.string("user"),
    id: Matchers.string(FACTORY_PRODUCT_ID),
    type: Matchers.string("OFFICIAL"),
    softwareProduct: {
      id: Matchers.string("softwareProductId"),
      version: Matchers.string(SOFTWARE_PRODUCT_VERSION),
      revision: Matchers.string("revision"),
      patch: Matchers.string("patch"),
      builds: eachLike({
        id: Matchers.string("softwareProductBuildId"),
        purged: Matchers.boolean(false),
        mxBuild: {
          version: Matchers.string(SOFTWARE_PRODUCT_VERSION),
          buildId: Matchers.string("buildId"),
          revision: Matchers.string("revision"),
          os: Matchers.string("Linux"),
        },
        core: {
          id: Matchers.string("coreBundleId"),
          type: Matchers.string("CORE"),
        },
        mxBundles: eachLike({
          id: Matchers.string("bundleId"),
          type: Matchers.string("BUNDLE"),
        }),
      }),
    },
    configurationComponents: eachLike({
      id: Matchers.string("configurationComponentId"),
      type: Matchers.string("BIP"),
      version: Matchers.string("1.0.0"),
      purged: Matchers.boolean(false),
      builds: eachLike({
        id: Matchers.string("configurationComponentBuildId"),
        purged: Matchers.boolean(false),
        mxBuild: {
          version: Matchers.string(SOFTWARE_PRODUCT_VERSION),
          buildId: Matchers.string("buildId"),
        },
        mxBundles: eachLike({
          id: Matchers.string("bundleId"),
          type: Matchers.string("BUNDLE"),
        }),
      }),
    }),
  };
}

function finalProductMatcher(): Record<string, unknown> {
  return {
    id: Matchers.string(FINAL_PRODUCT_ID),
    projectId: Matchers.string(PROJECT_ID),
    branch: Matchers.string("release/branch"),
    repositoryId: Matchers.string("repositoryId"),
    tag: Matchers.string("FP-1"),
    clientConfigurations: Matchers.eachLike({
      id: Matchers.string(),
      type: Matchers.string(),
      branch: Matchers.string(),
      commitId: Matchers.string(),
    }),
    validationLevel: Matchers.string("MQG"),
    environmentDefinitionId: Matchers.string(),
    version: Matchers.string(),
    configurationCommitId: Matchers.string(),
    state: Matchers.string("AVAILABLE"),
    mxBundles: Matchers.eachLike({
      id: Matchers.string(),
      type: Matchers.string(),
    }),
    isTools: Matchers.eachLike({
      id: Matchers.string(),
      name: Matchers.string(),
      type: Matchers.string(),
    }),
    createdOn: Matchers.iso8601DateTimeWithMillis(),
    syncRequests: [],
  };
}
