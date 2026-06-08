import { TestBed } from "@angular/core/testing";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { catchError, lastValueFrom, of } from "rxjs";
import { Matchers, Pact } from "@pact-foundation/pact";
import { eachLike } from "@pact-foundation/pact/src/dsl/matchers";
import { TestSequenceService } from "./test-sequence.service";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { expect } from "@jest/globals";

let port: number;
const projectId = "projectId";
const testSequenceName = "sequenceName";
const repositoryId = "repositoryId";
const source = "main";

function getTestSequenceService() {
  return TestBed.inject(TestSequenceService);
}

describe("test sequence service", () => {
  const provider = new Pact({
    consumer: "web",
    provider: "test-definition-service",
  });
  let appConfig: AppConfig;
  let testSequenceService: TestSequenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        { provide: APP_CONFIG, useValue: appConfig },
        TestSequenceService,
      ],
    });
  });

  beforeAll(async () => {
    await provider.setup();
    port = provider.opts.port;
    appConfig = { gatewayUrl: `http://127.0.0.1:${port}/` } as AppConfig;
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("should fetch test selections for an existing test sequence", async () => {
    await provider.addInteraction({
      state: "a test sequence with test selections exists",
      uponReceiving: "a request to GET test selections for a test sequence",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/test-sequences/${testSequenceName}/test-selections`,
        query: {
          repositoryId: Matchers.string(repositoryId),
          source: Matchers.string(source),
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          id: Matchers.string("nodeId"),
          name: Matchers.string("Root"),
          parentId: Matchers.string("Root"),
          type: Matchers.string("SUITE"),
          children: eachLike({
            id: Matchers.string("childId"),
            name: Matchers.string("Child"),
            parentId: Matchers.string("nodeId"),
            type: Matchers.string("SUITE"),
            children: [],
          }),
        },
      },
    });

    testSequenceService = getTestSequenceService();
    const result = await lastValueFrom(
      testSequenceService.fetchTestSelections({
        projectId,
        testSequenceName,
        repositoryId,
        source,
      })
    );
    expect(result).not.toBeNull();
  });

  test("should fail when fetching test selections for a non existing test sequence", async () => {
    await provider.addInteraction({
      state: "a test sequence does not exist",
      uponReceiving:
        "a request to GET test selections for a non existing test sequence",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/test-sequences/${testSequenceName}/test-selections`,
        query: {
          repositoryId: Matchers.string(repositoryId),
          source: Matchers.string(source),
        },
      },
      willRespondWith: {
        status: 404,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    testSequenceService = getTestSequenceService();
    const error = await lastValueFrom(
      testSequenceService
        .fetchTestSelections({
          projectId,
          testSequenceName,
          repositoryId,
          source,
        })
        .pipe(catchError((err) => of(err.message)))
    );
    expect(error).toBeTruthy();
  });

  test("should fetch mxtest test sequences for a given project and repository", async () => {
    const repositoryId = "repo-abc-123";
    const source = "main";
    await provider.addInteraction({
      state: "test sequences exist for the given project and repository",
      uponReceiving: "a request to GET test sequences",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/test-sequences`,
        query: {
          repositoryId: Matchers.string(repositoryId),
          source: Matchers.string(source),
        },
      },
      willRespondWith: {
        status: 200,
        body: eachLike({
          id: Matchers.string(),
          name: Matchers.string(),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    });

    testSequenceService = getTestSequenceService();
    const result = await lastValueFrom(
      testSequenceService.fetchTestSequences(projectId, repositoryId, source)
    );
    expect(result).not.toBeNull();
  });
});
