import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { AuthenticationService } from "@mxflow/core/auth";
import { QualityGateValidationService } from "./quality-gate-validation.service";

const GATEWAY_URL = "https://api.test.com/";
const USERNAME = "hgranger";

describe("QualityGateValidationService", () => {
  let service: QualityGateValidationService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
        {
          provide: AuthenticationService,
          useValue: { getUsername: () => USERNAME },
        },
        QualityGateValidationService,
      ],
    });

    service = TestBed.inject(QualityGateValidationService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe("markQualityGatePassed", () => {
    it("should post to the mark quality gate passed endpoint", () => {
      service
        .markQualityGatePassed("project-1", "execution-1", "looks good")
        .subscribe();

      const request = httpTestingController.expectOne(
        `${GATEWAY_URL}projects/project-1/business-process/executions/binary-upgrade/execution-1/user-input/mark-quality-gate-passed`
      );

      expect(request.request.method).toBe("POST");
      expect(request.request.body).toEqual({
        requester: USERNAME,
        comment: "looks good",
      });
      request.flush(null);
    });

    it("should post without comment when not provided", () => {
      service.markQualityGatePassed("project-1", "execution-1").subscribe();

      const request = httpTestingController.expectOne(
        `${GATEWAY_URL}projects/project-1/business-process/executions/binary-upgrade/execution-1/user-input/mark-quality-gate-passed`
      );

      expect(request.request.body).toEqual({
        requester: USERNAME,
        comment: undefined,
      });
      request.flush(null);
    });

    it("should propagate error on failure", () => {
      let errorMessage: string | undefined;

      service.markQualityGatePassed("project-1", "execution-1").subscribe({
        error: (error) => {
          errorMessage = error.message;
        },
      });

      httpTestingController
        .expectOne(
          `${GATEWAY_URL}projects/project-1/business-process/executions/binary-upgrade/execution-1/user-input/mark-quality-gate-passed`
        )
        .flush(
          { message: "Quality gate validation failed" },
          { status: 409, statusText: "Conflict" }
        );

      expect(errorMessage).toBe("Quality gate validation failed");
    });
  });

  describe("markQualityGateFailed", () => {
    it("should post to the mark quality gate failed endpoint", () => {
      service
        .markQualityGateFailed({
          projectId: "project-1",
          processId: "execution-1",
          shouldCleanDevelopment: true,
          developmentId: "dev-1",
          comment: "failed tests",
          supportsResourceManagement: true,
        })
        .subscribe();

      const request = httpTestingController.expectOne(
        `${GATEWAY_URL}projects/project-1/business-process/executions/binary-upgrade/execution-1/user-input/mark-quality-gate-failed`
      );

      expect(request.request.method).toBe("POST");
      expect(request.request.body).toEqual({
        requester: USERNAME,
        shouldCleanDevelopment: true,
        developmentId: "dev-1",
        comment: "failed tests",
        supportsResourceManagement: true,
      });
      request.flush(null);
    });

    it("should propagate error on failure", () => {
      let errorMessage: string | undefined;

      service
        .markQualityGateFailed({
          projectId: "project-1",
          processId: "execution-1",
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
          `${GATEWAY_URL}projects/project-1/business-process/executions/binary-upgrade/execution-1/user-input/mark-quality-gate-failed`
        )
        .flush(
          { message: "Process already stopped" },
          { status: 409, statusText: "Conflict" }
        );

      expect(errorMessage).toBe("Process already stopped");
    });
  });
});
