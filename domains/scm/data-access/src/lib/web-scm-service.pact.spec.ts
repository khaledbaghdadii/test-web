import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, lastValueFrom, of } from "rxjs";
import { CommitsService } from "./commits/commits.service";

const PROJECT_ID = "projectId";
const REPOSITORY_ID = "repositoryId";

describe("CommitsService contract tests", () => {
  const provider = new Pact({
    consumer: "web-scm",
    provider: "scm-service",
  });

  let appConfig: AppConfig;
  let service: CommitsService;

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
        CommitsService,
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    service = TestBed.inject(CommitsService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("should fetch the commit difference between two branches", async () => {
    await provider.addInteraction({
      state: "two branches exist and have commit difference",
      uponReceiving: "a request to fetch the commit difference between them",
      withRequest: {
        method: "GET",
        path: `/scm-operations/projects/${PROJECT_ID}/repositories/${REPOSITORY_ID}/commits/difference`,
        query: {
          sourceBranch: Matchers.string(),
          destinationBranch: Matchers.string(),
        },
      },
      willRespondWith: {
        status: 200,
        body: Matchers.eachLike({
          id: Matchers.string(),
          committerDisplayName: Matchers.string(),
          committerDisplayEmail: Matchers.string(),
          timeStamp: Matchers.string(),
          message: Matchers.string(),
          url: Matchers.string(),
        }),
      },
    });

    const commits = await lastValueFrom(
      service.getCommitDifferences({
        projectId: PROJECT_ID,
        repositoryId: REPOSITORY_ID,
        sourceBranch: "src",
        destinationBranch: "dest",
      })
    );

    expect(commits).not.toBeNull();
  });

  test("should fail to fetch commit differences", async () => {
    await provider.addInteraction({
      state: "non paginated commit difference fails",
      uponReceiving: "a request to fetch the commit difference that fails",
      withRequest: {
        method: "GET",
        path: `/scm-operations/projects/${PROJECT_ID}/repositories/${REPOSITORY_ID}/commits/difference`,
        query: {
          sourceBranch: Matchers.string(),
          destinationBranch: Matchers.string(),
        },
      },
      willRespondWith: {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    });

    const result = await lastValueFrom(
      service
        .getCommitDifferences({
          projectId: PROJECT_ID,
          repositoryId: REPOSITORY_ID,
          sourceBranch: "src",
          destinationBranch: "dest",
        })
        .pipe(catchError((error) => of(error.message)))
    );

    expect(result).toBeTruthy();
  });

  test("should fetch pull request commits", async () => {
    await provider.addInteraction({
      state: "a pull request with commits exists",
      uponReceiving: "a request to fetch pull request commits",
      withRequest: {
        method: "GET",
        path: `/scm-operations/projects/${PROJECT_ID}/repositories/${REPOSITORY_ID}/pull-requests/pullRequestId/commits`,
      },
      willRespondWith: {
        status: 200,
        body: {
          content: Matchers.eachLike({
            id: Matchers.string(),
            authorDisplayName: Matchers.string(),
            authorTimestamp: Matchers.string(),
            message: Matchers.string(),
            url: Matchers.string(),
          }),
        },
      },
    });

    const commits = await lastValueFrom(
      service.getPullRequestCommits({
        projectId: PROJECT_ID,
        repositoryId: REPOSITORY_ID,
        pullRequestId: "pullRequestId",
      })
    );

    expect(commits).not.toBeNull();
    expect(commits.length).toBeGreaterThan(0);
    expect(commits[0].committerDisplayName).toBeTruthy();
    expect(commits[0].timeStamp).toBeTruthy();
  });
});
