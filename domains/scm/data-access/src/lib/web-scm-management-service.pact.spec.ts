import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, lastValueFrom, of } from "rxjs";
import { DevelopmentService } from "./development/development.service";
import { MergeRequestService } from "./mergerequest/merge-request.service";
import { MergeRequestPriority } from "@mxflow/features/scm-management";

const PROJECT_ID = "projectId";
const DEVELOPMENT_ID = "developmentId";
const MERGE_REQUEST_ID = "mergeRequestId";

describe("DevelopmentService contract tests", () => {
  const provider = new Pact({
    consumer: "web-scm",
    provider: "scm-management-service",
  });

  let appConfig: AppConfig;
  let developmentService: DevelopmentService;
  let mergeRequestService: MergeRequestService;

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
        DevelopmentService,
        MergeRequestService,
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    developmentService = TestBed.inject(DevelopmentService);
    mergeRequestService = TestBed.inject(MergeRequestService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("should get development successfully", async () => {
    await provider.addInteraction({
      state: "can get development",
      uponReceiving: "a request to get a development",
      withRequest: {
        method: "GET",
        path: `/scm-management/projects/${PROJECT_ID}/developments/${DEVELOPMENT_ID}`,
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          id: Matchers.string(),
          name: Matchers.string(),
          source: Matchers.string(),
          projectId: Matchers.string(),
          createdOn: Matchers.string(),
          parentCommitId: Matchers.string(),
          latestCommitId: Matchers.string(),
          repository: {
            id: Matchers.string(),
            url: Matchers.string(),
          },
        },
      },
    });

    const result = await lastValueFrom(
      developmentService.getDevelopment(PROJECT_ID, DEVELOPMENT_ID)
    );

    expect(result).not.toBeNull();
  });

  test("should get development with includeDeleted query param", async () => {
    await provider.addInteraction({
      state: "can get development",
      uponReceiving: "a request to get a development with includeDeleted",
      withRequest: {
        method: "GET",
        path: `/scm-management/projects/${PROJECT_ID}/developments/${DEVELOPMENT_ID}`,
        query: {
          includeDeleted: Matchers.term({
            generate: "true",
            matcher: "true|false",
          }),
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          id: Matchers.string(),
          name: Matchers.string(),
          source: Matchers.string(),
          projectId: Matchers.string(),
          createdOn: Matchers.string(),
          parentCommitId: Matchers.string(),
          latestCommitId: Matchers.string(),
          repository: {
            id: Matchers.string(),
            url: Matchers.string(),
          },
        },
      },
    });

    const result = await lastValueFrom(
      developmentService.getDevelopment(PROJECT_ID, DEVELOPMENT_ID, true)
    );

    expect(result).not.toBeNull();
  });

  test("should fail to get development when it cannot be found", async () => {
    await provider.addInteraction({
      state: "cannot get development",
      uponReceiving: "a request to get a development that fails",
      withRequest: {
        method: "GET",
        path: `/scm-management/projects/${PROJECT_ID}/developments/${DEVELOPMENT_ID}`,
      },
      willRespondWith: {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    });

    const result = await lastValueFrom(
      developmentService
        .getDevelopment(PROJECT_ID, DEVELOPMENT_ID)
        .pipe(catchError((error) => of(error.message)))
    );

    expect(result).toBeTruthy();
  });

  test("should fetch filtered merge requests", async () => {
    await provider.addInteraction({
      state: "a request to filter merge requests",
      uponReceiving: "a request to fetch filtered merge requests",
      withRequest: {
        method: "POST",
        path: `/scm-management/projects/${PROJECT_ID}/merge-requests/filter`,
        query: {
          sort: "createdOn,desc",
          page: Matchers.term({
            generate: "0",
            matcher: "[0-9]+",
          }),
          size: Matchers.term({
            generate: "200",
            matcher: "[0-9]+",
          }),
        },
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          developmentId: Matchers.string(),
          contextId: Matchers.string(),
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: Matchers.like({
          content: Matchers.eachLike({
            id: Matchers.string(),
            projectId: Matchers.string(),
            mergeRequestState: Matchers.like("UNDER_VALIDATION"),
            mergeRequestStatus: Matchers.like("IN_PROGRESS"),
            pullRequestUrl: Matchers.string(),
            contextId: Matchers.string(),
            owner: Matchers.string(),
            mergeConfiguration: Matchers.like({
              id: Matchers.string(),
              branchName: Matchers.string(),
            }),
            development: Matchers.like({
              id: Matchers.string(),
              name: Matchers.string(),
            }),
          }),
        }),
      },
    });

    const result = await lastValueFrom(
      mergeRequestService.getFilteredMergeRequests(PROJECT_ID, {
        developmentId: "dev-1",
        contextId: "ctx-1",
      })
    );

    expect(result).not.toBeNull();
    expect(result.length).toBeGreaterThan(0);
  });

  test("should get a merge request by id", async () => {
    await provider.addInteraction({
      state: "a merge request exists",
      uponReceiving: "a request to get a merge request by id",
      withRequest: {
        method: "GET",
        path: `/scm-management/projects/${PROJECT_ID}/merge-requests/${MERGE_REQUEST_ID}`,
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: Matchers.like({
          pullRequestId: Matchers.string(),
          mergeRequestState: Matchers.like("IN_REVIEW"),
          pullRequestUrl: Matchers.string(),
          mergeConfiguration: Matchers.like({
            branchName: Matchers.string(),
          }),
          failureReason: Matchers.like("CQG_FAILURE"),
          mergeRequestPriority: Matchers.like("MEDIUM"),
          queuePosition: Matchers.integer(),
          queuedDate: Matchers.string(),
          endDate: Matchers.string(),
          isLastBuildInBulkMode: Matchers.boolean(),
          builds: Matchers.eachLike({
            id: Matchers.string(),
            bulkMode: Matchers.boolean(),
          }),
          stateTransitions: Matchers.eachLike({
            mergeRequestPreviousState: Matchers.string(),
            mergeRequestCurrentState: Matchers.string(),
            transitionedOn: Matchers.string(),
          }),
          owner: Matchers.string(),
          projectId: Matchers.string(),
        }),
      },
    });

    const result = await lastValueFrom(
      mergeRequestService.getMergeRequestById(PROJECT_ID, MERGE_REQUEST_ID)
    );

    expect(result).not.toBeNull();
    expect(result.pullRequestId).toBeTruthy();
    expect(result.mergeRequestState).toBeTruthy();
  });

  test("should update merge request priority", async () => {
    await provider.addInteraction({
      state: "a request to update merge request priority",
      uponReceiving: "a request to PATCH merge request priority",
      withRequest: {
        method: "PATCH",
        path: `/scm-management/projects/${PROJECT_ID}/merge-requests/${MERGE_REQUEST_ID}/priority`,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          mergeRequestPriority: Matchers.term({
            matcher: `^(${Object.values(MergeRequestPriority).join("|")})$`,
            generate: MergeRequestPriority.HIGH,
          }),
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: Matchers.like({
          id: Matchers.string(),
          projectId: Matchers.string(),
          mergeRequestState: Matchers.like("UNDER_VALIDATION"),
          mergeRequestPriority: Matchers.like("HIGH"),
          pullRequestUrl: Matchers.string(),
          owner: Matchers.string(),
          mergeConfiguration: Matchers.like({
            id: Matchers.string(),
            branchName: Matchers.string(),
          }),
          development: Matchers.like({
            id: Matchers.string(),
            name: Matchers.string(),
          }),
        }),
      },
    });

    const result = await lastValueFrom(
      mergeRequestService.updateMergeRequestPriority(
        PROJECT_ID,
        MERGE_REQUEST_ID,
        MergeRequestPriority.HIGH
      )
    );

    expect(result).not.toBeNull();
  });
});
