import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, lastValueFrom, of } from "rxjs";
import { RepositoryService } from "./repository/repository.service";

const PROJECT_ID = "projectId";
const REPOSITORY_ID = "repositoryId";

describe("RepositoryService contract tests", () => {
  const provider = new Pact({
    consumer: "web-scm",
    provider: "project-definition-service",
  });

  let appConfig: AppConfig;
  let service: RepositoryService;

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
        RepositoryService,
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    service = TestBed.inject(RepositoryService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("should fetch a repository by id", async () => {
    await provider.addInteraction({
      state: "a repository with ID exists",
      uponReceiving: "a request to get a repository by id",
      withRequest: {
        method: "GET",
        path: `/projects/${PROJECT_ID}/repositories/${REPOSITORY_ID}`,
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          id: Matchers.string(REPOSITORY_ID),
          name: Matchers.string("repository-name"),
          url: Matchers.string("https://example.com/repo.git"),
        },
      },
    });

    const repository = await lastValueFrom(
      service.getRepository(PROJECT_ID, REPOSITORY_ID)
    );

    expect(repository).not.toBeNull();
    expect(repository.id).toBeTruthy();
    expect(repository.name).toBeTruthy();
    expect(repository.url).toBeTruthy();
  });

  test("should fail when the repository does not exist", async () => {
    await provider.addInteraction({
      state: "a repository with ID does not exist",
      uponReceiving: "a request to get a non-existing repository",
      withRequest: {
        method: "GET",
        path: `/projects/${PROJECT_ID}/repositories/${REPOSITORY_ID}`,
      },
      willRespondWith: {
        status: 404,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    const result = await lastValueFrom(
      service
        .getRepository(PROJECT_ID, REPOSITORY_ID)
        .pipe(catchError((error) => of(error.message)))
    );

    expect(result).toBeTruthy();
  });
});
