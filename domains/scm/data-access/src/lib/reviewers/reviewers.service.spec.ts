import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { firstValueFrom } from "rxjs";
import {
  ReviewersService,
  ReviewersPage,
  DefaultReviewersResponse,
} from "./reviewers.service";

const GATEWAY_URL = "https://api.test.com/";

const MOCK_REVIEWERS_PAGE: ReviewersPage = {
  content: [
    { name: "jdoe", displayName: "John Doe" },
    { name: "jsmith", displayName: "Jane Smith" },
  ],
  totalElements: 2,
  page: 0,
  last: true,
};

const MOCK_DEFAULT_REVIEWERS: DefaultReviewersResponse = {
  content: [{ name: "jdoe", displayName: "John Doe" }],
};

describe("ReviewersService", () => {
  let service: ReviewersService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ReviewersService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(ReviewersService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should fetch reviewers with correct URL", async () => {
    const result = firstValueFrom(
      service.getReviewers("project-1", "repo-1", "john", 0, 10)
    );

    const req = httpController.expectOne(
      `${GATEWAY_URL}scm-operations/projects/project-1/repositories/repo-1/reviewers?page=0&size=10&filter=john`
    );
    expect(req.request.method).toBe("GET");
    req.flush(MOCK_REVIEWERS_PAGE);

    expect(await result).toEqual(MOCK_REVIEWERS_PAGE);
  });

  it("should fetch default reviewers with correct URL and params", async () => {
    const result = firstValueFrom(
      service.getDefaultReviewers(
        "project-1",
        "repo-1",
        "feature/branch",
        "main"
      )
    );

    const req = httpController.expectOne(
      (r) =>
        r.url ===
          `${GATEWAY_URL}scm-operations/projects/project-1/repositories/repo-1/default-reviewers` &&
        r.params.get("sourceBranch") === "feature/branch" &&
        r.params.get("targetBranch") === "main"
    );
    expect(req.request.method).toBe("GET");
    req.flush(MOCK_DEFAULT_REVIEWERS);

    expect(await result).toEqual(MOCK_DEFAULT_REVIEWERS);
  });

  it("should map server error message for getReviewers", async () => {
    const result = firstValueFrom(
      service.getReviewers("project-1", "repo-1", "", 0, 10)
    ).catch((e) => e);

    httpController
      .expectOne((r) => r.url.includes("reviewers"))
      .flush(
        { message: "Not found" },
        { status: 404, statusText: "Not Found" }
      );

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Not found");
  });

  it("should map server error message for getDefaultReviewers", async () => {
    const result = firstValueFrom(
      service.getDefaultReviewers("project-1", "repo-1", "src", "dest")
    ).catch((e) => e);

    httpController
      .expectOne((r) => r.url.includes("default-reviewers"))
      .flush(
        { message: "Repo not found" },
        { status: 404, statusText: "Not Found" }
      );

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Repo not found");
  });

  it("should use fallback error message for getReviewers when server provides none", async () => {
    const result = firstValueFrom(
      service.getReviewers("project-1", "repo-1", "", 0, 10)
    ).catch((e) => e);

    httpController
      .expectOne((r) => r.url.includes("reviewers"))
      .flush(null, { status: 500, statusText: "Internal Server Error" });

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Internal Server Error");
  });

  it("should use fallback error message for getDefaultReviewers when server provides none", async () => {
    const result = firstValueFrom(
      service.getDefaultReviewers("project-1", "repo-1", "src", "dest")
    ).catch((e) => e);

    httpController
      .expectOne((r) => r.url.includes("default-reviewers"))
      .flush(null, { status: 500, statusText: "Internal Server Error" });

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Internal Server Error");
  });
});
