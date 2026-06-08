import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { FixIssuesService } from "./fix-issues.service";

describe("binary upgrade execution service", () => {
  const PROJECT_ID = "projectId";
  const GATEWAY_URL = "https://api.test.com/";

  let service: FixIssuesService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
        FixIssuesService,
      ],
    });

    service = TestBed.inject(FixIssuesService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("should call pause and fix endpoint correctly", () => {
    service.fixIssues(PROJECT_ID, "id").subscribe();
    httpTestingController.expectOne({
      method: "POST",
      url: `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/executions/binary-upgrade/id/user-input/fix-issues`,
    });
  });

  it("should return an error message when a failure occur when attempting to pause and fix integrate changes", async () => {
    let errorMessage: string | undefined;

    service.fixIssues(PROJECT_ID, "id").subscribe({
      error: (error) => {
        errorMessage = error.message;
      },
    });

    httpTestingController
      .expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/executions/binary-upgrade/id/user-input/fix-issues`
      )
      .flush(
        { message: "Failed to go back to quality gate" },
        { status: 409, statusText: "Conflict" }
      );

    expect(errorMessage).toBe("Failed to go back to quality gate");
  });
});
