import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { lastValueFrom } from "rxjs";
import { BranchService } from "./branch/branch.service";

const PROJECT_ID = "projectId";
const REPOSITORY_ID = "repositoryId";
const BRANCH_NAME = "branchName";

describe("BranchService contract tests", () => {
  const provider = new Pact({
    consumer: "web-scm",
    provider: "scm-service",
  });

  let appConfig: AppConfig;
  let branchService: BranchService;

  beforeAll(async () => {
    await provider.setup();
    const port = provider.opts.port;
    appConfig = {
      gatewayUrl: `http://127.0.0.1:${port}/`,
    } as AppConfig;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        BranchService,
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    branchService = TestBed.inject(BranchService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  // Provider state + interaction copied verbatim from the legacy
  // web/libs/contract-tests/src/lib/scm-service.spec.pact.ts "getBranchDetails".
  test("fetching the head commit ID of a branch", async () => {
    await provider.addInteraction({
      state: "a repository with a specific branch exists",
      uponReceiving: "a request to fetch the branch details",
      withRequest: {
        method: "GET",
        path: `/scm-operations/projects/${PROJECT_ID}/repositories/${REPOSITORY_ID}/branches`,
        query: {
          branchName: Matchers.string(),
        },
      },
      willRespondWith: {
        status: 200,
        body: {
          latestCommitId: Matchers.string(),
        },
        headers: {
          "Content-Type": "application/json",
        },
      },
    });

    const branchDetails = await lastValueFrom(
      branchService.getBranchDetails({
        projectId: PROJECT_ID,
        repositoryId: REPOSITORY_ID,
        branchName: BRANCH_NAME,
      })
    );

    expect(branchDetails).not.toBeNull();
    expect(branchDetails.latestCommitId).not.toBeNull();
  });
});
