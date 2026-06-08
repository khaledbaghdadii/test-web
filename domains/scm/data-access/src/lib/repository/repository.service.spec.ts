import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { firstValueFrom } from "rxjs";
import { RepositoryDetails, RepositoryService } from "./repository.service";

const GATEWAY_URL = "https://api.test.com/";

const MOCK_REPOSITORY: RepositoryDetails = {
  id: "repo-1",
  name: "my-repository",
  url: "https://bitbucket.org/scm/PRJ/my-repository.git",
};

describe("RepositoryService", () => {
  let service: RepositoryService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RepositoryService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(RepositoryService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should fetch repository details", async () => {
    const result = firstValueFrom(service.getRepository("project-1", "repo-1"));

    const req = httpController.expectOne(
      `${GATEWAY_URL}projects/project-1/repositories/repo-1`
    );
    expect(req.request.method).toBe("GET");
    req.flush(MOCK_REPOSITORY);

    expect(await result).toEqual(MOCK_REPOSITORY);
  });

  it("should map server error message", async () => {
    const result = firstValueFrom(
      service.getRepository("project-1", "repo-1")
    ).catch((e) => e);

    httpController
      .expectOne(`${GATEWAY_URL}projects/project-1/repositories/repo-1`)
      .flush(
        { message: "Not found" },
        { status: 404, statusText: "Not Found" }
      );

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Not found");
  });

  it("should use http error message as fallback when server provides no body", async () => {
    const result = firstValueFrom(
      service.getRepository("project-1", "repo-1")
    ).catch((e) => e);

    httpController
      .expectOne(`${GATEWAY_URL}projects/project-1/repositories/repo-1`)
      .flush(null, { status: 500, statusText: "Internal Server Error" });

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Internal Server Error");
  });
});
