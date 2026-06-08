import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { ReferenceEnvironmentService } from "./reference-environments.service";

const GATEWAY_URL = "https://api.test.com/";

describe("ReferenceEnvironmentService", () => {
  let service: ReferenceEnvironmentService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
        ReferenceEnvironmentService,
      ],
    });

    service = TestBed.inject(ReferenceEnvironmentService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe("deploy", () => {
    it("should post to the deploy reference environment endpoint", () => {
      service
        .deployReferenceEnvironment("project-1", "execution-1")
        .subscribe();

      const request = httpTestingController.expectOne(
        `${GATEWAY_URL}projects/project-1/business-process/executions/binary-upgrade/execution-1/user-input/deploy-reference-environment`
      );

      expect(request.request.method).toBe("POST");
      request.flush(null);
    });

    it("should propagate error on deploy failure", () => {
      let errorMessage: string | undefined;

      service.deployReferenceEnvironment("project-1", "execution-1").subscribe({
        error: (error) => {
          errorMessage = error.message;
        },
      });

      const request = httpTestingController.expectOne(
        `${GATEWAY_URL}projects/project-1/business-process/executions/binary-upgrade/execution-1/user-input/deploy-reference-environment`
      );
      request.flush(
        { message: "Deployment failed" },
        { status: 500, statusText: "Internal Server Error" }
      );

      expect(errorMessage).toBe("Deployment failed");
    });
  });

  describe("cleanAndDeploy", () => {
    it("should post to the clean and deploy endpoint with environment id", () => {
      service
        .cleanAndDeployReferenceEnvironment(
          "project-1",
          "execution-1",
          "env-to-clean"
        )
        .subscribe();

      const request = httpTestingController.expectOne(
        `${GATEWAY_URL}projects/project-1/business-process/executions/binary-upgrade/execution-1/user-input/clean-and-deploy-reference-environment`
      );

      expect(request.request.method).toBe("POST");
      expect(request.request.body).toEqual({
        environmentIdToClean: "env-to-clean",
      });
      request.flush(null);
    });

    it("should propagate error on clean and deploy failure", () => {
      let errorMessage: string | undefined;

      service
        .cleanAndDeployReferenceEnvironment(
          "project-1",
          "execution-1",
          "env-to-clean"
        )
        .subscribe({
          error: (error) => {
            errorMessage = error.message;
          },
        });

      const request = httpTestingController.expectOne(
        `${GATEWAY_URL}projects/project-1/business-process/executions/binary-upgrade/execution-1/user-input/clean-and-deploy-reference-environment`
      );
      request.flush(
        { message: "Clean and deploy failed" },
        { status: 500, statusText: "Internal Server Error" }
      );

      expect(errorMessage).toBe("Clean and deploy failed");
    });
  });
});
