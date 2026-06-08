import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { SendChangesForReviewService } from "./send-changes-for-review.service";

const GATEWAY_URL = "https://api.test.com/";

describe("SendChangesForReviewService", () => {
  let service: SendChangesForReviewService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
        SendChangesForReviewService,
      ],
    });

    service = TestBed.inject(SendChangesForReviewService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("should post to the send changes for review endpoint", () => {
    service
      .sendChangesForReview({
        projectId: "project-1",
        processId: "execution-1",
        mergeJobTitle: "My MR",
        mergeConfigurationId: "mc-1",
        mergeJobReviewers: ["reviewer1"],
        shouldCleanDevelopment: false,
        developmentId: "dev-1",
        supportsResourceManagement: true,
      })
      .subscribe();

    const request = httpTestingController.expectOne(
      `${GATEWAY_URL}projects/project-1/business-process/executions/binary-upgrade/execution-1/user-input/send-changes-for-review`
    );

    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual({
      mergeConfigurationId: "mc-1",
      mergeJobTitle: "My MR",
      mergeJobReviewers: ["reviewer1"],
      shouldCleanDevelopment: false,
      developmentId: "dev-1",
      supportsResourceManagement: true,
    });
    request.flush(null);
  });

  it("should propagate error on failure", () => {
    let errorMessage: string | undefined;

    service
      .sendChangesForReview({
        projectId: "project-1",
        processId: "execution-1",
        mergeJobTitle: "My MR",
        mergeConfigurationId: "mc-1",
        mergeJobReviewers: [],
        shouldCleanDevelopment: false,
        developmentId: "dev-1",
        supportsResourceManagement: false,
      })
      .subscribe({
        error: (error) => {
          errorMessage = error.message;
        },
      });

    httpTestingController
      .expectOne(
        `${GATEWAY_URL}projects/project-1/business-process/executions/binary-upgrade/execution-1/user-input/send-changes-for-review`
      )
      .flush(
        { message: "Merge request creation failed" },
        { status: 500, statusText: "Internal Server Error" }
      );

    expect(errorMessage).toBe("Merge request creation failed");
  });
});
