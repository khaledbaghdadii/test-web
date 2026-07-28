import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { Observable } from "rxjs";
import {
  MarkQualityGateFailedRequest,
  MarkQualityGatePassedRequest,
  SendChangesForReviewRequest,
  SkipIntegrateChangesRequest,
  ValidationProcessStateUpdaterService,
} from "./validation-process-state-updater.service";

const PROJECT_ID = "projectId";
const EXECUTION_ID = "executionId";
const GATEWAY_URL = "https://api.test.com/";
const BASE_URL = `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/executions/master-validation`;

describe("ValidationProcessStateUpdaterService", () => {
  let service: ValidationProcessStateUpdaterService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ValidationProcessStateUpdaterService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });
    service = TestBed.inject(ValidationProcessStateUpdaterService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe("reloadProcessDetails", () => {
    it("should emit on reloadTrigger$ after the delay", fakeAsync(() => {
      let emitted = false;
      service.reloadTrigger$.subscribe(() => (emitted = true));
      service.reloadProcessDetails(EXECUTION_ID, PROJECT_ID, 500);
      tick(500);
      expect(emitted).toBe(true);
    }));

    it("should not emit before the delay completes", fakeAsync(() => {
      let emitted = false;
      service.reloadTrigger$.subscribe(() => (emitted = true));
      service.reloadProcessDetails(EXECUTION_ID, PROJECT_ID, 500);
      tick(400);
      expect(emitted).toBe(false);
      tick(100);
    }));
  });

  describe("markQualityGatePassed", () => {
    const request: MarkQualityGatePassedRequest = {
      projectId: PROJECT_ID,
      executionId: EXECUTION_ID,
      comment: "Looks good",
    };

    it("should use PUT method", () => {
      service.markQualityGatePassed(request).subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/mark-quality-gate-passed`
      );
      expect(req.request.method).toBe("PUT");
    });

    it("should send the correct URL", () => {
      service.markQualityGatePassed(request).subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/mark-quality-gate-passed`
      );
      expect(req.request.url).toBe(
        `${BASE_URL}/${EXECUTION_ID}/user-input/mark-quality-gate-passed`
      );
    });

    it("should send comment in the request body", () => {
      service.markQualityGatePassed(request).subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/mark-quality-gate-passed`
      );
      expect(req.request.body.comment).toBe("Looks good");
    });
  });

  describe("markQualityGateFailed", () => {
    const request: MarkQualityGateFailedRequest = {
      projectId: PROJECT_ID,
      executionId: EXECUTION_ID,
      comment: "Failed",
      developmentId: "dev-123",
      shouldCleanDevelopment: true,
    };

    it("should use PUT method", () => {
      service.markQualityGateFailed(request).subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/mark-quality-gate-failed`
      );
      expect(req.request.method).toBe("PUT");
    });

    it("should send comment in the request body", () => {
      service.markQualityGateFailed(request).subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/mark-quality-gate-failed`
      );
      expect(req.request.body.comment).toBe("Failed");
    });

    it("should send developmentId in the request body", () => {
      service.markQualityGateFailed(request).subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/mark-quality-gate-failed`
      );
      expect(req.request.body.developmentId).toBe("dev-123");
    });

    it("should send shouldCleanDevelopment in the request body", () => {
      service.markQualityGateFailed(request).subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/mark-quality-gate-failed`
      );
      expect(req.request.body.shouldCleanDevelopment).toBe(true);
    });
  });

  describe("sendChangesForReview", () => {
    const request: SendChangesForReviewRequest = {
      projectId: PROJECT_ID,
      processId: EXECUTION_ID,
      mergeJobTitle: "Review Title",
      mergeConfigurationId: "merge-cfg-1",
      mergeJobReviewers: ["reviewer1"],
      shouldCleanDevelopment: false,
      developmentId: "dev-456",
    };

    it("should use POST method", () => {
      service.sendChangesForReview(request).subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/send-changes-for-review`
      );
      expect(req.request.method).toBe("POST");
    });

    it("should send mergeJobTitle in the request body", () => {
      service.sendChangesForReview(request).subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/send-changes-for-review`
      );
      expect(req.request.body.mergeJobTitle).toBe("Review Title");
    });

    it("should send mergeConfigurationId in the request body", () => {
      service.sendChangesForReview(request).subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/send-changes-for-review`
      );
      expect(req.request.body.mergeConfigurationId).toBe("merge-cfg-1");
    });

    it("should send mergeJobReviewers in the request body", () => {
      service.sendChangesForReview(request).subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/send-changes-for-review`
      );
      expect(req.request.body.mergeJobReviewers).toEqual(["reviewer1"]);
    });

    it("should send shouldCleanDevelopment in the request body", () => {
      service.sendChangesForReview(request).subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/send-changes-for-review`
      );
      expect(req.request.body.shouldCleanDevelopment).toBe(false);
    });

    it("should send developmentId in the request body", () => {
      service.sendChangesForReview(request).subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/send-changes-for-review`
      );
      expect(req.request.body.developmentId).toBe("dev-456");
    });
  });

  describe("reopenMergeRequest", () => {
    it("should use POST method", () => {
      service.reopenMergeRequest(PROJECT_ID, EXECUTION_ID).subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/reopen-merge-request`
      );
      expect(req.request.method).toBe("POST");
    });

    it("should send to the correct URL", () => {
      service.reopenMergeRequest(PROJECT_ID, EXECUTION_ID).subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/reopen-merge-request`
      );
      expect(req.request.url).toBe(
        `${BASE_URL}/${EXECUTION_ID}/user-input/reopen-merge-request`
      );
    });

    it("should send null body", () => {
      service.reopenMergeRequest(PROJECT_ID, EXECUTION_ID).subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/reopen-merge-request`
      );
      expect(req.request.body).toBeNull();
    });
  });

  describe("skipIntegrateChanges", () => {
    const request: SkipIntegrateChangesRequest = {
      destinationBranch: "main",
      shouldCleanDevelopment: true,
      developmentId: "dev-789",
    };

    it("should use POST method", () => {
      service
        .skipIntegrateChanges(PROJECT_ID, EXECUTION_ID, request)
        .subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/skip-integrate-fixes`
      );
      expect(req.request.method).toBe("POST");
    });

    it("should send destinationBranch in the request body", () => {
      service
        .skipIntegrateChanges(PROJECT_ID, EXECUTION_ID, request)
        .subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/skip-integrate-fixes`
      );
      expect(req.request.body.destinationBranch).toBe("main");
    });

    it("should send shouldCleanDevelopment in the request body", () => {
      service
        .skipIntegrateChanges(PROJECT_ID, EXECUTION_ID, request)
        .subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/skip-integrate-fixes`
      );
      expect(req.request.body.shouldCleanDevelopment).toBe(true);
    });

    it("should send developmentId in the request body", () => {
      service
        .skipIntegrateChanges(PROJECT_ID, EXECUTION_ID, request)
        .subscribe();
      const req = httpTestingController.expectOne(
        `${BASE_URL}/${EXECUTION_ID}/user-input/skip-integrate-fixes`
      );
      expect(req.request.body.developmentId).toBe("dev-789");
    });
  });

  describe("error handling", () => {
    const passedRequest: MarkQualityGatePassedRequest = {
      projectId: PROJECT_ID,
      executionId: EXECUTION_ID,
      comment: "comment",
    };
    const failedRequest: MarkQualityGateFailedRequest = {
      projectId: PROJECT_ID,
      executionId: EXECUTION_ID,
      comment: "comment",
      developmentId: "dev-123",
      shouldCleanDevelopment: true,
    };
    const reviewRequest: SendChangesForReviewRequest = {
      projectId: PROJECT_ID,
      processId: EXECUTION_ID,
      mergeJobTitle: "title",
      mergeConfigurationId: "cfg",
      mergeJobReviewers: ["reviewer"],
      shouldCleanDevelopment: false,
      developmentId: "dev-456",
    };
    const skipRequest: SkipIntegrateChangesRequest = {
      destinationBranch: "main",
      shouldCleanDevelopment: true,
      developmentId: "dev-789",
    };

    function captureError(
      action: Observable<void>,
      url: string,
      errorBody: unknown
    ): Error {
      let caught!: Error;
      action.subscribe({ error: (err: Error) => (caught = err) });
      httpTestingController
        .expectOne(url)
        .flush(errorBody, { status: 500, statusText: "Server Error" });
      return caught;
    }

    it("maps the server-provided message for markQualityGatePassed", () => {
      const error = captureError(
        service.markQualityGatePassed(passedRequest),
        `${BASE_URL}/${EXECUTION_ID}/user-input/mark-quality-gate-passed`,
        { message: "quality gate already passed" }
      );

      expect(error.message).toBe("quality gate already passed");
    });

    it("falls back to the http message for markQualityGatePassed", () => {
      const error = captureError(
        service.markQualityGatePassed(passedRequest),
        `${BASE_URL}/${EXECUTION_ID}/user-input/mark-quality-gate-passed`,
        null
      );

      expect(error.message).toContain("500");
    });

    it("maps the server-provided message for markQualityGateFailed", () => {
      const error = captureError(
        service.markQualityGateFailed(failedRequest),
        `${BASE_URL}/${EXECUTION_ID}/user-input/mark-quality-gate-failed`,
        { message: "cannot fail quality gate" }
      );

      expect(error.message).toBe("cannot fail quality gate");
    });

    it("falls back to the http message for markQualityGateFailed", () => {
      const error = captureError(
        service.markQualityGateFailed(failedRequest),
        `${BASE_URL}/${EXECUTION_ID}/user-input/mark-quality-gate-failed`,
        null
      );

      expect(error.message).toContain("500");
    });

    it("maps the server-provided message for sendChangesForReview", () => {
      const error = captureError(
        service.sendChangesForReview(reviewRequest),
        `${BASE_URL}/${EXECUTION_ID}/user-input/send-changes-for-review`,
        { message: "review already sent" }
      );

      expect(error.message).toBe("review already sent");
    });

    it("falls back to the http message for sendChangesForReview", () => {
      const error = captureError(
        service.sendChangesForReview(reviewRequest),
        `${BASE_URL}/${EXECUTION_ID}/user-input/send-changes-for-review`,
        null
      );

      expect(error.message).toContain("500");
    });

    it("maps the server-provided message for reopenMergeRequest", () => {
      const error = captureError(
        service.reopenMergeRequest(PROJECT_ID, EXECUTION_ID),
        `${BASE_URL}/${EXECUTION_ID}/user-input/reopen-merge-request`,
        { message: "merge request already open" }
      );

      expect(error.message).toBe("merge request already open");
    });

    it("falls back to the http message for reopenMergeRequest", () => {
      const error = captureError(
        service.reopenMergeRequest(PROJECT_ID, EXECUTION_ID),
        `${BASE_URL}/${EXECUTION_ID}/user-input/reopen-merge-request`,
        null
      );

      expect(error.message).toContain("500");
    });

    it("maps the server-provided message for skipIntegrateChanges", () => {
      const error = captureError(
        service.skipIntegrateChanges(PROJECT_ID, EXECUTION_ID, skipRequest),
        `${BASE_URL}/${EXECUTION_ID}/user-input/skip-integrate-fixes`,
        { message: "cannot skip integrate fixes" }
      );

      expect(error.message).toBe("cannot skip integrate fixes");
    });

    it("falls back to the http message for skipIntegrateChanges", () => {
      const error = captureError(
        service.skipIntegrateChanges(PROJECT_ID, EXECUTION_ID, skipRequest),
        `${BASE_URL}/${EXECUTION_ID}/user-input/skip-integrate-fixes`,
        null
      );

      expect(error.message).toContain("500");
    });
  });
});
