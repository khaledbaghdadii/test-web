import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { lastValueFrom } from "rxjs";
import { EnvironmentCleanService } from "./environment-clean.service";

describe("EnvironmentCleanService", () => {
  const appConfig: Partial<AppConfig> = {
    gatewayUrl: "https://gateway.test.com/api/v1/",
  };

  let service: EnvironmentCleanService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EnvironmentCleanService,
        { provide: APP_CONFIG, useValue: appConfig },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(EnvironmentCleanService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("should call the single environment clean endpoint with the correct URL", () => {
    service.cleanEnvironment("projectId", "environmentId").subscribe();

    const req = httpTesting.expectOne(
      "https://gateway.test.com/api/v1/projects/projectId/environments/environmentId/clean"
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toBeNull();
  });

  it("should propagate an error with the error message from the response", async () => {
    const result = lastValueFrom(
      service.cleanEnvironment("projectId", "environmentId")
    );

    const req = httpTesting.expectOne(
      "https://gateway.test.com/api/v1/projects/projectId/environments/environmentId/clean"
    );
    req.flush("Environment not found", {
      status: 404,
      statusText: "Not Found",
    });

    await expect(result).rejects.toThrow("Environment not found");
  });
});
