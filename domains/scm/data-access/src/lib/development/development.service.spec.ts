import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { firstValueFrom } from "rxjs";
import { DevelopmentService } from "./development.service";
import { Development, Developments } from "./development.model";

const GATEWAY_URL = "https://api.test.com/";

const MOCK_DEVELOPMENT: Development = {
  id: "dev-1",
  name: "feature/my-branch",
  source: "main",
  projectId: "project-1",
  repository: { id: "repo-1", url: "https://bitbucket.org/scm/PRJ/repo.git" },
  latestCommitId: "abc123def456",
  createdOn: "2026-01-01T00:00:00Z",
  parentCommitId: "parent123456",
  deleted: false,
};

const MOCK_DEVELOPMENTS: Developments = {
  content: [MOCK_DEVELOPMENT],
  totalElements: 1,
  totalPages: 1,
  size: 1,
  empty: false,
  last: true,
};

describe("DevelopmentService", () => {
  let service: DevelopmentService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DevelopmentService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(DevelopmentService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should fetch development details", async () => {
    const result = firstValueFrom(service.getDevelopment("project-1", "dev-1"));

    const req = httpController.expectOne(
      `${GATEWAY_URL}scm-management/projects/project-1/developments/dev-1`
    );
    expect(req.request.method).toBe("GET");
    req.flush(MOCK_DEVELOPMENT);

    expect(await result).toEqual(MOCK_DEVELOPMENT);
  });

  it("should append includeDeleted query param when true", async () => {
    const result = firstValueFrom(
      service.getDevelopment("project-1", "dev-1", true)
    );

    const req = httpController.expectOne(
      `${GATEWAY_URL}scm-management/projects/project-1/developments/dev-1?includeDeleted=true`
    );
    expect(req.request.method).toBe("GET");
    req.flush(MOCK_DEVELOPMENT);

    expect(await result).toEqual(MOCK_DEVELOPMENT);
  });

  it("should not append includeDeleted when not provided", () => {
    service.getDevelopment("project-1", "dev-1").subscribe();

    const req = httpController.expectOne(
      `${GATEWAY_URL}scm-management/projects/project-1/developments/dev-1`
    );
    expect(req.request.url).not.toContain("includeDeleted");
    req.flush(MOCK_DEVELOPMENT);
  });

  it("should map server error message", async () => {
    const result = firstValueFrom(
      service.getDevelopment("project-1", "dev-1")
    ).catch((e) => e);

    httpController
      .expectOne(
        `${GATEWAY_URL}scm-management/projects/project-1/developments/dev-1`
      )
      .flush(
        { message: "Not found" },
        { status: 404, statusText: "Not Found" }
      );

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Not found");
  });

  it("should use fallback error message when server provides none", async () => {
    const result = firstValueFrom(
      service.getDevelopment("project-1", "dev-1")
    ).catch((e) => e);

    httpController
      .expectOne(
        `${GATEWAY_URL}scm-management/projects/project-1/developments/dev-1`
      )
      .flush(null, { status: 500, statusText: "Internal Server Error" });

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Internal Server Error");
  });

  it("lists developments with encoded repository and branch filters", async () => {
    const result = firstValueFrom(
      service.getDevelopments("project-1", {
        repositoryId: "repo/one",
        name: "feature/my branch",
      })
    );

    const request = httpController.expectOne(
      `${GATEWAY_URL}scm-management/projects/project-1/developments?repositoryId=repo%2Fone&name=feature%2Fmy%20branch`
    );
    expect(request.request.method).toBe("GET");
    request.flush(MOCK_DEVELOPMENTS);

    expect(await result).toEqual(MOCK_DEVELOPMENTS);
  });

  it("lists developments without a query string when no filters are supplied", async () => {
    const result = firstValueFrom(service.getDevelopments("project-1", {}));

    const request = httpController.expectOne(
      `${GATEWAY_URL}scm-management/projects/project-1/developments`
    );
    expect(request.request.method).toBe("GET");
    request.flush(MOCK_DEVELOPMENTS);

    expect(await result).toEqual(MOCK_DEVELOPMENTS);
  });

  it("maps a development-list server error message", async () => {
    const result = firstValueFrom(
      service.getDevelopments("project-1", { repositoryId: "repo-1" })
    ).catch((error) => error);

    httpController
      .expectOne(
        `${GATEWAY_URL}scm-management/projects/project-1/developments?repositoryId=repo-1`
      )
      .flush(
        { message: "Developments unavailable" },
        { status: 500, statusText: "Internal Server Error" }
      );

    await expect(result).resolves.toMatchObject({
      message: "Developments unavailable",
    });
  });

  it("uses the generic development-list error message when the response has no detail", async () => {
    const result = firstValueFrom(
      service.getDevelopments("project-1", { name: "main" })
    ).catch((error) => error);

    httpController
      .expectOne(
        `${GATEWAY_URL}scm-management/projects/project-1/developments?name=main`
      )
      .flush(null, { status: 500, statusText: "Internal Server Error" });

    await expect(result).resolves.toMatchObject({
      message: expect.stringContaining("Internal Server Error"),
    });
  });
});
