import { Matchers, Pact } from "@pact-foundation/pact";
import { eachLike } from "@pact-foundation/pact/src/dsl/matchers";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { lastValueFrom } from "rxjs";
import { BreadcrumbApiService } from "./breadcrumb-api.service";

const PROJECT_ID = "project-1";

function projectNode() {
  return {
    type: Matchers.string("PROJECT"),
    id: Matchers.string("project-1"),
    name: Matchers.string("Breadcrumb Project"),
    projectId: Matchers.string("project-1"),
    available: Matchers.boolean(true),
    siblings: [],
  };
}

function businessProcessNode() {
  return {
    type: Matchers.string("BUSINESS_PROCESS"),
    id: Matchers.string("bp-1"),
    name: Matchers.string("Upgrade BP"),
    businessProcessFamily: Matchers.string("binary-upgrade"),
    projectId: Matchers.string("project-1"),
    available: Matchers.boolean(true),
    parent: projectNode(),
    siblings: [],
  };
}

describe("breadcrumb api contract tests", () => {
  const provider = new Pact({
    consumer: "web-analytics",
    provider: "analytics-service",
  });

  let service: BreadcrumbApiService;

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
        BreadcrumbApiService,
      ],
    });

    service = TestBed.inject(BreadcrumbApiService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("validates the breadcrumb for a scenario with a single business process parent", async () => {
    await provider.addInteraction({
      state:
        "breadcrumb for a scenario with a single business process parent exists",
      uponReceiving:
        "a request for a scenario breadcrumb with a single business process parent",
      withRequest: {
        method: "GET",
        path: `/analytics/projects/${PROJECT_ID}/breadcrumb`,
        query: {
          resourceType: "SCENARIO",
          resourceId: "scenario-1",
        },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          target: {
            type: Matchers.string("SCENARIO"),
            id: Matchers.string("scenario-1"),
            name: Matchers.string("Login TPK"),
            projectId: Matchers.string("project-1"),
            available: Matchers.boolean(true),
            parent: businessProcessNode(),
            siblings: [],
          },
        },
      },
    });

    const response = await lastValueFrom(
      service.getBreadcrumb(PROJECT_ID, "SCENARIO", "scenario-1")
    );

    expect(response.target.parent?.type).toBe("BUSINESS_PROCESS");
  });

  test("validates the breadcrumb for a scenario with multiple business process parents", async () => {
    await provider.addInteraction({
      state:
        "breadcrumb for a scenario with multiple business process parents exists",
      uponReceiving:
        "a request for a scenario breadcrumb with multiple business process parents",
      withRequest: {
        method: "GET",
        path: `/analytics/projects/${PROJECT_ID}/breadcrumb`,
        query: {
          resourceType: "SCENARIO",
          resourceId: "scenario-1",
        },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          target: {
            type: Matchers.string("SCENARIO"),
            id: Matchers.string("scenario-1"),
            name: Matchers.string("Login TPK"),
            projectId: Matchers.string("project-1"),
            available: Matchers.boolean(true),
            parent: {
              type: Matchers.string("BUSINESS_PROCESS"),
              id: Matchers.string("bp-1"),
              name: Matchers.string("BP One"),
              projectId: Matchers.string("project-1"),
              available: Matchers.boolean(true),
              parent: projectNode(),
              siblings: eachLike({
                type: Matchers.string("BUSINESS_PROCESS"),
                id: Matchers.string("bp-2"),
                name: Matchers.string("BP Two"),
                projectId: Matchers.string("project-1"),
                available: Matchers.boolean(true),
                parent: projectNode(),
                siblings: [],
              }),
            },
            siblings: [],
          },
        },
      },
    });

    const response = await lastValueFrom(
      service.getBreadcrumb(PROJECT_ID, "SCENARIO", "scenario-1")
    );

    expect(response.target.parent?.siblings.length).toBeGreaterThan(0);
  });

  test("validates the breadcrumb for a scenario with a single merge request parent", async () => {
    await provider.addInteraction({
      state:
        "breadcrumb for a scenario with a single merge request parent exists",
      uponReceiving:
        "a request for a scenario breadcrumb with a single merge request parent",
      withRequest: {
        method: "GET",
        path: `/analytics/projects/${PROJECT_ID}/breadcrumb`,
        query: {
          resourceType: "SCENARIO",
          resourceId: "scenario-2",
        },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          target: {
            type: Matchers.string("SCENARIO"),
            id: Matchers.string("scenario-2"),
            name: Matchers.string("Trade TPK"),
            projectId: Matchers.string("project-1"),
            available: Matchers.boolean(true),
            parent: {
              type: Matchers.string("MERGE_REQUEST"),
              id: Matchers.string("mr-1"),
              name: Matchers.string("MR Title"),
              projectId: Matchers.string("project-1"),
              available: Matchers.boolean(true),
              parent: businessProcessNode(),
              siblings: [],
            },
            siblings: [],
          },
        },
      },
    });

    const response = await lastValueFrom(
      service.getBreadcrumb(PROJECT_ID, "SCENARIO", "scenario-2")
    );

    expect(response.target.parent?.type).toBe("MERGE_REQUEST");
  });

  test("validates the breadcrumb for an environment with an unavailable parent", async () => {
    await provider.addInteraction({
      state: "breadcrumb for an environment with an unavailable parent exists",
      uponReceiving:
        "a request for an environment breadcrumb with an unavailable parent",
      withRequest: {
        method: "GET",
        path: `/analytics/projects/${PROJECT_ID}/breadcrumb`,
        query: {
          resourceType: "ENVIRONMENT",
          resourceId: "env-1",
        },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          target: {
            type: Matchers.string("ENVIRONMENT"),
            id: Matchers.string("env-1"),
            projectId: Matchers.string("project-1"),
            available: Matchers.boolean(true),
            parent: {
              type: Matchers.string("BUSINESS_PROCESS"),
              projectId: Matchers.string("project-1"),
              available: Matchers.boolean(false),
              parent: projectNode(),
              siblings: [],
            },
            siblings: [],
          },
        },
      },
    });

    const response = await lastValueFrom(
      service.getBreadcrumb(PROJECT_ID, "ENVIRONMENT", "env-1")
    );

    expect(response.target.parent?.available).toBe(false);
  });

  test("validates that an unresolvable breadcrumb target responds with 404", async () => {
    await provider.addInteraction({
      state: "breadcrumb target cannot be resolved",
      uponReceiving:
        "a request for a breadcrumb whose target cannot be resolved",
      withRequest: {
        method: "GET",
        path: `/analytics/projects/${PROJECT_ID}/breadcrumb`,
        query: {
          resourceType: "SCENARIO",
          resourceId: "missing",
        },
      },
      willRespondWith: {
        status: 404,
      },
    });

    await expect(
      lastValueFrom(service.getBreadcrumb(PROJECT_ID, "SCENARIO", "missing"))
    ).rejects.toMatchObject({
      status: 404,
    });
  });
});
