import { TestBed } from "@angular/core/testing";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { catchError, lastValueFrom, of } from "rxjs";
import { Matchers, Pact } from "@pact-foundation/pact";
import { eachLike } from "@pact-foundation/pact/src/dsl/matchers";
import { TestDefinitionService } from "./test-definition.service";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { expect } from "@jest/globals";
import { PreconfiguredTestSelection } from "@mxevolve/domains/test/model";

let port: number;
const testDefinitionId = "d557af82-ab1b-4587-a5ff-fc18c7acb7ce";
const projectId = "projectId";
const defaultBranch = "branch";
const testSelectionId = "testSelectionId";

function getTestDefinitionService() {
  return TestBed.inject(TestDefinitionService);
}

describe("test definition service", () => {
  const provider = new Pact({
    consumer: "web",
    provider: "test-definition-service",
  });
  let appConfig: AppConfig;
  let testDefinitionService: TestDefinitionService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        { provide: APP_CONFIG, useValue: appConfig },
        TestDefinitionService,
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

  test("should get test definition with specific id", async () => {
    await provider.addInteraction({
      state: `Test definition exists`,
      uponReceiving: "a request to GET a test definition",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/test-definition/${testDefinitionId}`,
      },
      willRespondWith: {
        status: 200,
        body: {
          description: Matchers.string("description"),
          id: Matchers.string(testDefinitionId),
          name: Matchers.string("name"),
          path: Matchers.string("path"),
          projectId: Matchers.string(projectId),
          repoId: Matchers.string("repoId"),
          timeoutDuration: {
            days: Matchers.integer(1),
            hours: Matchers.integer(1),
            minutes: Matchers.integer(1),
          },
          testSelections: [
            {
              id: Matchers.string("testSelectionId"),
              name: Matchers.string("testSelectionName"),
              path: Matchers.string("testSelectionPath"),
              tags: eachLike(Matchers.string("testSelectionTag")),
            },
          ],
        },
        headers: {
          "Content-Type": "application/json",
        },
      },
    });

    testDefinitionService = getTestDefinitionService();
    const testDefinitionApiModelObservable = await lastValueFrom(
      testDefinitionService.fetch(testDefinitionId, projectId)
    );
    expect(testDefinitionApiModelObservable).not.toBeNull();
  });

  test("should get test package definitions", async () => {
    await provider.addInteraction({
      state: `Test definitions exist`,
      uponReceiving: "a request to GET test definitions",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/test-definition`,
        query: {
          testDefinitionIds: Matchers.string(testDefinitionId),
        },
      },
      willRespondWith: {
        status: 200,
        body: eachLike({
          description: Matchers.string("description"),
          id: Matchers.string(testDefinitionId),
          name: Matchers.string("name"),
          path: Matchers.string("path"),
          projectId: Matchers.string(projectId),
          repoId: Matchers.string("repoId"),
          timeoutDuration: {
            days: Matchers.integer(1),
            hours: Matchers.integer(1),
            minutes: Matchers.integer(1),
          },
          testSelections: [
            {
              id: Matchers.string(testSelectionId),
              name: Matchers.string("testSelectionName"),
              path: Matchers.string("testSelectionPath"),
              tags: eachLike(Matchers.string("testSelectionTag")),
            },
          ],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    });

    testDefinitionService = getTestDefinitionService();
    const testDefinitionApiModelObservable = await lastValueFrom(
      testDefinitionService.fetchAll(projectId, [testDefinitionId])
    );
    expect(testDefinitionApiModelObservable).not.toBeNull();
  });

  test("should create test definition", async () => {
    await provider.addInteraction({
      state: `a test definition is to be created`,
      uponReceiving: "a request to create a test definition",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/test-definition`,
        body: {
          name: Matchers.string("name"),
          path: Matchers.string("path"),
          description: Matchers.string("description"),
          repoId: Matchers.string("repoId"),
          timeoutDuration: {
            days: Matchers.integer(1),
            hours: Matchers.integer(1),
            minutes: Matchers.integer(1),
          },
        },
      },
      willRespondWith: {
        status: 201,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    const request = {
      name: "test",
      path: "test/loc",
      description: "description",
      repoId: "repo loc",
      timeoutDuration: {
        days: 1,
        hours: 2,
        minutes: 30,
      },
    };

    testDefinitionService = getTestDefinitionService();
    const testDefinitionId = await lastValueFrom(
      testDefinitionService.create(projectId, request)
    );
    expect(testDefinitionId).not.toBeNull();
  });

  test("creating an existing test definition", async () => {
    await provider.addInteraction({
      state: `an existing test definition is to be created`,
      uponReceiving: "a request to create a test definition",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/test-definition`,
        body: {
          name: Matchers.string("name"),
          path: Matchers.string("path"),
          description: Matchers.string("description"),
          repoId: Matchers.string("repoId"),
          timeoutDuration: {
            days: Matchers.integer(1),
            hours: Matchers.integer(1),
            minutes: Matchers.integer(1),
          },
        },
      },
      willRespondWith: {
        status: 400,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    const request = {
      name: "test",
      path: "test/loc",
      description: "description",
      repoId: "repo loc",
      timeoutDuration: {
        days: 1,
        hours: 2,
        minutes: 30,
      },
    };

    testDefinitionService = getTestDefinitionService();
    const error = await lastValueFrom(
      testDefinitionService
        .create(projectId, request)
        .pipe(catchError((error) => of(error.message)))
    );
    expect(error).toBeTruthy();
  });

  test("editing a test definition happy path", async () => {
    await provider.addInteraction({
      state: "a test definition is to be edited",
      uponReceiving: "a request to edit a test definition",
      withRequest: {
        method: "PUT",
        path: `/projects/${projectId}/test-definition/${testDefinitionId}`,
        body: {
          name: Matchers.string("name"),
          path: Matchers.string("path"),
          description: Matchers.string("description"),
          repoId: Matchers.string("repoId"),
          timeoutDuration: {
            days: Matchers.integer(1),
            hours: Matchers.integer(1),
            minutes: Matchers.integer(1),
          },
        },
      },
      willRespondWith: {
        status: 200,
        body: {
          id: Matchers.string(testDefinitionId),
          name: Matchers.string("name"),
          projectId: Matchers.string(projectId),
          repoId: Matchers.string("repoId"),
          path: Matchers.string("path"),
          timeoutDuration: {
            days: Matchers.integer(1),
            hours: Matchers.integer(1),
            minutes: Matchers.integer(1),
          },
          testSelections: eachLike({
            id: Matchers.string(testSelectionId),
            name: Matchers.string("name"),
            path: Matchers.string("path"),
          }),
          description: Matchers.string("description"),
        },
      },
    });

    const request = {
      name: "test",
      path: "path/test",
      description: "description",
      repoId: "repo id",
      timeoutDuration: {
        days: 1,
        hours: 2,
        minutes: 30,
      },
    };

    testDefinitionService = getTestDefinitionService();
    const result = await lastValueFrom(
      testDefinitionService.edit(projectId, testDefinitionId, request)
    );
    expect(result).not.toBeNull();
  });

  test("editing a test selection with an existing repo id and path", async () => {
    await provider.addInteraction({
      state:
        "a test definition is to be edited with an existing repo id and path",
      uponReceiving: "a request to edit a test definition",
      withRequest: {
        method: "PUT",
        path: `/projects/${projectId}/test-definition/${testDefinitionId}`,
        body: {
          name: Matchers.string("name"),
          path: Matchers.string("path"),
          description: Matchers.string("description"),
          repoId: Matchers.string("repoId"),
          timeoutDuration: {
            days: Matchers.integer(1),
            hours: Matchers.integer(1),
            minutes: Matchers.integer(1),
          },
        },
      },
      willRespondWith: {
        status: 400,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    const request = {
      name: "test",
      path: "path/test",
      description: "description",
      repoId: "repo id",
      timeoutDuration: {
        days: 1,
        hours: 2,
        minutes: 30,
      },
    };

    testDefinitionService = getTestDefinitionService();
    const error = await lastValueFrom(
      testDefinitionService
        .edit(projectId, testDefinitionId, request)
        .pipe(catchError((error) => of(error.message)))
    );
    expect(error).toBeTruthy();
  });

  test("editing a non existing test definition", async () => {
    await provider.addInteraction({
      state: "a non existing test definition is to be edited",
      uponReceiving: "a request to edit a test definition",
      withRequest: {
        method: "PUT",
        path: `/projects/${projectId}/test-definition/${testDefinitionId}`,
        body: {
          name: Matchers.string("name"),
          path: Matchers.string("path"),
          description: Matchers.string("description"),
          repoId: Matchers.string("repoId"),
          timeoutDuration: {
            days: Matchers.integer(1),
            hours: Matchers.integer(1),
            minutes: Matchers.integer(1),
          },
        },
      },
      willRespondWith: {
        status: 404,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    const request = {
      name: "test",
      path: "path/test",
      description: "description",
      repoId: "repo id",
      timeoutDuration: {
        days: 1,
        hours: 2,
        minutes: 30,
      },
    };

    testDefinitionService = getTestDefinitionService();
    const error = await lastValueFrom(
      testDefinitionService
        .edit(projectId, testDefinitionId, request)
        .pipe(catchError((error) => of(error.message)))
    );
    expect(error).toBeTruthy();
  });

  test("bulk adding test selections to test definition", async () => {
    await provider.addInteraction({
      state: `test selections to be bulk added to a test definition`,
      uponReceiving: "a request to bulk add the test selections",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/test-definition/${testDefinitionId}/test-selections`,
        body: {
          testSelections: eachLike({
            name: Matchers.string("name"),
            path: Matchers.string("path"),
            tags: eachLike(Matchers.string("tags")),
          }),
        },
      },
      willRespondWith: {
        status: 201,
        body: {
          testSelections: eachLike({
            id: Matchers.string(testSelectionId),
            name: Matchers.string("name"),
            path: Matchers.string("path"),
            tags: eachLike(Matchers.string("tags")),
          }),
        },
      },
    });

    const request: PreconfiguredTestSelection = {
      name: "test",
      path: "test/loc",
      tags: ["tags"],
    };

    testDefinitionService = getTestDefinitionService();
    const testSelection = await lastValueFrom(
      testDefinitionService.bulkAddTestSelections(projectId, testDefinitionId, [
        request,
      ])
    );
    expect(testSelection).not.toBeNull();
  });

  test("existing test selections to be bulk added to a test definition", async () => {
    await provider.addInteraction({
      state: `existing test selections to be bulk added to a test definition`,
      uponReceiving: "a request to bulk add the test selections",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/test-definition/${testDefinitionId}/test-selections`,
        body: {
          testSelections: eachLike({
            name: Matchers.string("name"),
            path: Matchers.string("path"),
            tags: eachLike(Matchers.string("tags")),
          }),
        },
      },
      willRespondWith: {
        status: 400,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    const request: PreconfiguredTestSelection = {
      name: "test",
      path: "test/loc",
      tags: ["tags"],
    };

    testDefinitionService = getTestDefinitionService();
    const error = await lastValueFrom(
      testDefinitionService
        .bulkAddTestSelections(projectId, testDefinitionId, [request])
        .pipe(catchError((err) => of(err.message)))
    );
    expect(error).toBeTruthy();
  });

  test("duplicate test selections name to be bulk added to a test definition", async () => {
    await provider.addInteraction({
      state: `duplicate test selections name to be bulk added to a test definition`,
      uponReceiving: "a request to bulk add the test selections",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/test-definition/${testDefinitionId}/test-selections`,
        body: {
          testSelections: eachLike({
            name: Matchers.string("name"),
            path: Matchers.string("path"),
            tags: eachLike(Matchers.string("tags")),
          }),
        },
      },
      willRespondWith: {
        status: 400,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    const request: PreconfiguredTestSelection = {
      name: "test",
      path: "test/loc",
      tags: ["tags"],
    };

    testDefinitionService = getTestDefinitionService();
    const error = await lastValueFrom(
      testDefinitionService
        .bulkAddTestSelections(projectId, testDefinitionId, [request])
        .pipe(catchError((err) => of(err.message)))
    );
    expect(error).toBeTruthy();
  });

  test("duplicate test selections path to be bulk added to a test definition", async () => {
    await provider.addInteraction({
      state: `duplicate test selections path to be bulk added to a test definition`,
      uponReceiving: "a request to bulk add the test selections",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/test-definition/${testDefinitionId}/test-selections`,
        body: {
          testSelections: eachLike({
            name: Matchers.string("name"),
            path: Matchers.string("path"),
            tags: eachLike(Matchers.string("tags")),
          }),
        },
      },
      willRespondWith: {
        status: 400,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    const request: PreconfiguredTestSelection = {
      name: "test",
      path: "test/loc",
      tags: ["tags"],
    };

    testDefinitionService = getTestDefinitionService();
    const error = await lastValueFrom(
      testDefinitionService
        .bulkAddTestSelections(projectId, testDefinitionId, [request])
        .pipe(catchError((err) => of(err.message)))
    );
    expect(error).toBeTruthy();
  });

  test("selections to be bulk added to a non existing test definition", async () => {
    await provider.addInteraction({
      state: `test selections to be bulk added to a non existing test definition`,
      uponReceiving: "a request to bulk add the test selections",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/test-definition/${testDefinitionId}/test-selections`,
        body: {
          testSelections: eachLike({
            name: Matchers.string("name"),
            path: Matchers.string("path"),
            tags: eachLike(Matchers.string("tags")),
          }),
        },
      },
      willRespondWith: {
        status: 404,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    const request: PreconfiguredTestSelection = {
      name: "test",
      path: "test/loc",
      tags: ["tags"],
    };

    testDefinitionService = getTestDefinitionService();
    const error = await lastValueFrom(
      testDefinitionService
        .bulkAddTestSelections(projectId, testDefinitionId, [request])
        .pipe(catchError((err) => of(err.message)))
    );
    expect(error).toBeTruthy();
  });

  test("fetch preconfigured test selections on an existing test definition", async () => {
    await provider.addInteraction({
      state: `fetch preconfigured test selections on an existing test definition`,
      uponReceiving: "a request to fetch preconfigured test selections",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/test-definition/${testDefinitionId}/preconfigured-test-selections`,
        query: {
          branch: Matchers.string(defaultBranch),
        },
      },
      willRespondWith: {
        status: 200,
        body: eachLike({
          name: Matchers.string("name"),
          path: Matchers.string("path"),
          tags: eachLike(Matchers.string("tags")),
        }),
      },
    });

    testDefinitionService = getTestDefinitionService();
    const preconfiguredTestSelections = await lastValueFrom(
      testDefinitionService.fetchTestSelectionsFromContextConfig(
        testDefinitionId,
        projectId,
        defaultBranch
      )
    );
    expect(preconfiguredTestSelections).not.toBeNull();
  });

  test("fetch preconfigured test selections on non existing test definition", async () => {
    await provider.addInteraction({
      state: `fetch preconfigured test selections on non existing test definition`,
      uponReceiving: "a request to fetch preconfigured test selections",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/test-definition/${testDefinitionId}/preconfigured-test-selections`,
        query: {
          branch: Matchers.string(defaultBranch),
        },
      },
      willRespondWith: {
        status: 404,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    testDefinitionService = getTestDefinitionService();
    const error = await lastValueFrom(
      testDefinitionService
        .fetchTestSelectionsFromContextConfig(
          testDefinitionId,
          projectId,
          defaultBranch
        )
        .pipe(catchError((err) => of(err.message)))
    );
    expect(error).toBeTruthy();
  });

  test("adding a test selection to test definition", async () => {
    await provider.addInteraction({
      state: `a test selection is to be added to a test definition`,
      uponReceiving: "a request to add the test selection",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/test-definition/${testDefinitionId}/test-selection`,
        body: {
          name: Matchers.string("name"),
          path: Matchers.string("path"),
        },
      },
      willRespondWith: {
        status: 201,
        body: {
          id: Matchers.string("id"),
          name: Matchers.string("name"),
          path: Matchers.string("path"),
        },
      },
    });

    const request = {
      name: "test",
      path: "test/loc",
    };
    testDefinitionService = getTestDefinitionService();
    const testSelection = await lastValueFrom(
      testDefinitionService.addTestSelectionToTestDefinition(
        projectId,
        testDefinitionId,
        request
      )
    );
    expect(testSelection).not.toBeNull();
  });

  test("adding a test selection to non existing test definition", async () => {
    await provider.addInteraction({
      state: `a test selection is to be added to a non existing test definition`,
      uponReceiving: "a request to add the test selection",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/test-definition/${testDefinitionId}/test-selection`,
        body: {
          name: Matchers.string("name"),
          path: Matchers.string("path"),
        },
      },
      willRespondWith: {
        status: 404,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    const request = {
      name: "test",
      path: "test/loc",
    };

    testDefinitionService = getTestDefinitionService();
    const error = await lastValueFrom(
      testDefinitionService
        .addTestSelectionToTestDefinition(projectId, testDefinitionId, request)
        .pipe(catchError((err) => of(err.message)))
    );
    expect(error).toBeTruthy();
  });

  test("adding an existing test selection to test definition", async () => {
    await provider.addInteraction({
      state: `an existing test selection is to be added to a test definition`,
      uponReceiving: "a request to add the test selection",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/test-definition/${testDefinitionId}/test-selection`,
        body: {
          name: Matchers.string("name"),
          path: Matchers.string("path"),
        },
      },
      willRespondWith: {
        status: 400,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    const request = {
      name: "test",
      path: "test/loc",
    };

    testDefinitionService = getTestDefinitionService();
    const error = await lastValueFrom(
      testDefinitionService
        .addTestSelectionToTestDefinition(projectId, testDefinitionId, request)
        .pipe(catchError((err) => of(err.message)))
    );
    expect(error).toBeTruthy();
  });

  test("editing a test selection", async () => {
    await provider.addInteraction({
      state: "a test selection is to be edited",
      uponReceiving: "a request to edit a test selection",
      withRequest: {
        method: "PUT",
        path: `/projects/${projectId}/test-definition/test-selection/${testSelectionId}`,
        body: {
          name: Matchers.string("name"),
          path: Matchers.string("path"),
        },
      },
      willRespondWith: {
        status: 200,
        body: {
          id: Matchers.string("id"),
          name: Matchers.string("name"),
          path: Matchers.string("path"),
        },
      },
    });

    const updateRequest = {
      name: "testSelection",
      path: "path/testSelection",
    };

    testDefinitionService = getTestDefinitionService();
    const result = await lastValueFrom(
      testDefinitionService.editTestSelectionInTestDefinition(
        projectId,
        testSelectionId,
        updateRequest
      )
    );
    expect(result).not.toBe(null);
  });

  test("editing a non existing test selection", async () => {
    await provider.addInteraction({
      state: "a non existing test selection is to be edited",
      uponReceiving: "a request to edit a test selection",
      withRequest: {
        method: "PUT",
        path: `/projects/${projectId}/test-definition/test-selection/${testSelectionId}`,
        body: {
          name: Matchers.string("name"),
          path: Matchers.string("path"),
        },
      },
      willRespondWith: {
        status: 404,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    const updateRequest = {
      name: "testSelection",
      path: "path/testSelection",
    };
    testDefinitionService = getTestDefinitionService();
    const error = await lastValueFrom(
      testDefinitionService
        .editTestSelectionInTestDefinition(
          projectId,
          testSelectionId,
          updateRequest
        )
        .pipe(catchError((err) => of(err.message)))
    );
    expect(error).toBeTruthy();
  });

  test("editing a test selection with an existing name", async () => {
    await provider.addInteraction({
      state: "a test selection to be edited with an existing name",
      uponReceiving: "a request to edit a test selection",
      withRequest: {
        method: "PUT",
        path: `/projects/${projectId}/test-definition/test-selection/${testSelectionId}`,
        body: {
          name: Matchers.string("name"),
          path: Matchers.string("path"),
        },
      },
      willRespondWith: {
        status: 400,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    const updateRequest = {
      name: "testSelection",
      path: "path/testSelection",
    };

    testDefinitionService = getTestDefinitionService();
    const error = await lastValueFrom(
      testDefinitionService
        .editTestSelectionInTestDefinition(
          projectId,
          testSelectionId,
          updateRequest
        )
        .pipe(catchError((err) => of(err.message)))
    );
    expect(error).toBeTruthy();
  });

  test("deleting all test selections in a test definition", async () => {
    await provider.addInteraction({
      state: `all test selections are to be deleted from a test definition`,
      uponReceiving:
        "a request to delete all test selections in a test definition",
      withRequest: {
        method: "DELETE",
        path: `/projects/${projectId}/test-definition/${testDefinitionId}/test-selections`,
      },
      willRespondWith: {
        status: 204,
      },
    });

    testDefinitionService = getTestDefinitionService();
    await expect(
      lastValueFrom(
        testDefinitionService.deleteAllTestSelections(
          projectId,
          testDefinitionId
        )
      )
    ).resolves.toBeDefined();
  });

  test("removing a test selection from test definition", async () => {
    await provider.addInteraction({
      state: `a test selection is to be removed from a test definition`,
      uponReceiving: "a request to remove the test selection",
      withRequest: {
        method: "DELETE",
        path: `/projects/${projectId}/test-definition/test-selection/${testSelectionId}`,
      },
      willRespondWith: {
        status: 204,
      },
    });

    testDefinitionService = getTestDefinitionService();
    await expect(
      lastValueFrom(
        testDefinitionService.removeTestSelectionFromTestDefinition(
          projectId,
          testSelectionId
        )
      )
    ).resolves.toBeDefined();
  });

  test("removing a non existing test selection from test definition", async () => {
    await provider.addInteraction({
      state: `a non existing test selection is to be removed from a test definition`,
      uponReceiving: "a request to remove the test selection",
      withRequest: {
        method: "DELETE",
        path: `/projects/${projectId}/test-definition/test-selection/${testSelectionId}`,
      },
      willRespondWith: {
        status: 404,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    testDefinitionService = getTestDefinitionService();
    expect(
      await lastValueFrom(
        testDefinitionService
          .removeTestSelectionFromTestDefinition(projectId, testSelectionId)
          .pipe(catchError((err) => of(err.message)))
      )
    ).toBeTruthy();
  });
});
