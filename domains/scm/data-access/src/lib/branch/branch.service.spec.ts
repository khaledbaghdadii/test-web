import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { firstValueFrom } from "rxjs";
import { BranchService } from "./branch.service";
import { BranchDetails, BranchDetailsError } from "./branch-details.model";

const GATEWAY_URL = "https://api.test.com/";
const BRANCH_URL = `${GATEWAY_URL}scm-operations/projects/project-1/repositories/repo-1/branches`;

const MOCK_BRANCH_DETAILS: BranchDetails = {
  latestCommitId: "commit-123",
};

describe("BranchService", () => {
  let service: BranchService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BranchService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(BranchService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should fetch branch details for the requested branch name", async () => {
    const result = firstValueFrom(
      service.getBranchDetails({
        projectId: "project-1",
        repositoryId: "repo-1",
        branchName: "feature/x",
      })
    );

    const req = httpController.expectOne(
      (r) => r.url === BRANCH_URL && r.params.get("branchName") === "feature/x"
    );
    expect(req.request.method).toBe("GET");
    req.flush(MOCK_BRANCH_DETAILS);

    expect(await result).toEqual(MOCK_BRANCH_DETAILS);
  });

  it("should preserve the 404 status when the branch does not exist", async () => {
    const result = firstValueFrom(
      service.getBranchDetails({
        projectId: "project-1",
        repositoryId: "repo-1",
        branchName: "missing",
      })
    ).catch((e) => e);

    httpController
      .expectOne((r) => r.url === BRANCH_URL)
      .flush(
        { message: "Not found" },
        { status: 404, statusText: "Not Found" }
      );

    const error: BranchDetailsError = await result;
    expect(error).toBeInstanceOf(BranchDetailsError);
    expect(error.status).toBe(404);
    expect(error.message).toBe("Not found");
  });

  it("should surface the http status for non-404 failures", async () => {
    const result = firstValueFrom(
      service.getBranchDetails({
        projectId: "project-1",
        repositoryId: "repo-1",
        branchName: "boom",
      })
    ).catch((e) => e);

    httpController
      .expectOne((r) => r.url === BRANCH_URL)
      .flush(null, { status: 500, statusText: "Internal Server Error" });

    const error: BranchDetailsError = await result;
    expect(error).toBeInstanceOf(BranchDetailsError);
    expect(error.status).toBe(500);
  });
});
