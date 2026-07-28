import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, lastValueFrom, of } from "rxjs";
import { CommitsService } from "./commits/commits.service";
import { TagService } from "./tags/tag.service";

const PROJECT_ID = "projectId";
const REPOSITORY_ID = "repositoryId";

const provider = new Pact({
  consumer: "web-scm",
  provider: "scm-service",
});

let appConfig: AppConfig;

beforeAll(async () => {
  await provider.setup();
  const port = provider.opts.port;
  appConfig = {
    gatewayUrl: `http://127.0.0.1:${port}/`,
  } as AppConfig;
});

afterEach(async () => {
  await provider.verify();
});

afterAll(async () => {
  await provider.finalize();
});

describe("CommitsService contract tests", () => {
  let service: CommitsService;

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

  test("should fetch a single commit by id", async () => {
    await provider.addInteraction({
      state: "a commit exists for the given id",
      uponReceiving: "a request to fetch a commit by id",
      withRequest: {
        method: "GET",
        path: `/scm-operations/projects/${PROJECT_ID}/repositories/${REPOSITORY_ID}/commits/commitId`,
      },
      willRespondWith: {
        status: 200,
        body: {
          id: Matchers.string(),
          displayId: Matchers.string(),
          author: {
            displayName: Matchers.string(),
            emailAddress: Matchers.string(),
            name: Matchers.string(),
          },
          authorTimestamp: Matchers.string(),
          committer: {
            displayName: Matchers.string(),
            emailAddress: Matchers.string(),
            name: Matchers.string(),
          },
          committerTimestamp: Matchers.string(),
          message: Matchers.string(),
          parent: {
            displayId: Matchers.string(),
            id: Matchers.string(),
          },
        },
      },
    });

    const commit = await lastValueFrom(
      service.getCommit({
        projectId: PROJECT_ID,
        repositoryId: REPOSITORY_ID,
        commitId: "commitId",
      })
    );

    expect(commit).not.toBeNull();
    expect(commit.id).toBeTruthy();
    expect(commit.message).toBeTruthy();
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

describe("TagService contract tests", () => {
  let service: TagService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        TagService,
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    service = TestBed.inject(TagService);
  });

  test("should fetch a tag by name", async () => {
    await provider.addInteraction({
      state: "tag exists",
      uponReceiving: "a request to fetch a tag by name",
      withRequest: {
        method: "GET",
        path: `/scm-operations/projects/${PROJECT_ID}/repositories/${REPOSITORY_ID}/tags/tagName`,
      },
      willRespondWith: {
        status: 200,
        body: {
          name: Matchers.string(),
          commitId: Matchers.string(),
        },
      },
    });

    const tag = await lastValueFrom(
      service.getTag(PROJECT_ID, REPOSITORY_ID, "tagName")
    );

    expect(tag).not.toBeNull();
    expect(tag.name).toBeTruthy();
    expect(tag.commitId).toBeTruthy();
  });

  test("should fail when tag is not found", async () => {
    await provider.addInteraction({
      state: "tag does not exist",
      uponReceiving: "a request to fetch a tag that does not exist",
      withRequest: {
        method: "GET",
        path: `/scm-operations/projects/${PROJECT_ID}/repositories/${REPOSITORY_ID}/tags/unknownTag`,
      },
      willRespondWith: {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          status: 400,
          message: Matchers.string(),
        },
      },
    });

    const result = await lastValueFrom(
      service
        .getTag(PROJECT_ID, REPOSITORY_ID, "unknownTag")
        .pipe(catchError((error) => of(error.status)))
    );

    expect(result).toBe(400);
  });
});
