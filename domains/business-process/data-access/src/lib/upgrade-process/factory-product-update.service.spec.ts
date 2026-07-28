import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { FactoryProductUpdateService } from "./factory-product-update.service";
import { AuthenticationService } from "@mxflow/core/auth";

const GATEWAY_URL = "https://api.test.com/";
const USERNAME = "hgranger";

describe("FactoryProductUpdateService", () => {
  let service: FactoryProductUpdateService;
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
        FactoryProductUpdateService,
      ],
    });

    service = TestBed.inject(FactoryProductUpdateService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe("updateFactoryProduct", () => {
    it("should post to the update factory product endpoint", () => {
      service
        .updateFactoryProduct({
          projectId: "project-1",
          processId: "execution-1",
          factoryProductId: "fp-1",
          commitMessage: "test commit",
          filesToUpdate: ["a.yaml", "b.yaml"],
          skipUpdate: false,
        })
        .subscribe();

      const request = httpTestingController.expectOne(
        `${GATEWAY_URL}projects/project-1/business-process/executions/binary-upgrade/execution-1/user-input/update-factory-product`
      );

      expect(request.request.method).toBe("POST");
      expect(request.request.body).toEqual({
        factoryProductId: "fp-1",
        commitMessage: "test commit",
        filesToUpdate: ["a.yaml", "b.yaml"],
        skipUpdate: false,
      });

      request.flush({
        success: true,
        skipped: false,
        files: [],
      });
    });

    it("should propagate error on failure", () => {
      let errorMessage: string | undefined;

      service
        .updateFactoryProduct({
          projectId: "project-1",
          processId: "execution-1",
          factoryProductId: "fp-1",
          commitMessage: "test commit",
          filesToUpdate: ["a.yaml"],
          skipUpdate: false,
        })
        .subscribe({
          error: (error) => {
            errorMessage = error.message;
          },
        });

      httpTestingController
        .expectOne(
          `${GATEWAY_URL}projects/project-1/business-process/executions/binary-upgrade/execution-1/user-input/update-factory-product`
        )
        .flush(
          { message: "Factory product update failed" },
          { status: 409, statusText: "Conflict" }
        );

      expect(errorMessage).toBe("Factory product update failed");
    });
  });

  describe("getFactoryProductUpdates", () => {
    it("should get factory product user actions", () => {
      service.getFactoryProductUpdates("project-1", "execution-1").subscribe();

      const request = httpTestingController.expectOne(
        `${GATEWAY_URL}projects/project-1/business-process/executions/binary-upgrade/execution-1/user-actions/factory-product-actions`
      );

      expect(request.request.method).toBe("GET");

      request.flush({
        actions: [],
      });
    });

    it("should propagate error on failure", () => {
      let errorMessage: string | undefined;

      service.getFactoryProductUpdates("project-1", "execution-1").subscribe({
        error: (error) => {
          errorMessage = error.message;
        },
      });

      httpTestingController
        .expectOne(
          `${GATEWAY_URL}projects/project-1/business-process/executions/binary-upgrade/execution-1/user-actions/factory-product-actions`
        )
        .flush(
          { message: "Failed to load factory product actions" },
          { status: 500, statusText: "Server Error" }
        );

      expect(errorMessage).toBe("Failed to load factory product actions");
    });
  });
});
