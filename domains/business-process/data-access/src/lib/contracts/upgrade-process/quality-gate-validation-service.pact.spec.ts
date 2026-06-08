import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { catchError, lastValueFrom, of } from "rxjs";
import { AuthenticationService } from "@mxflow/core/auth";
import { APP_CONFIG } from "@mxflow/config";
import { QualityGateValidationService } from "../../upgrade-process/quality-gate-validation.service";

const PROJECT_ID = "projectId";
const PROCESS_ID = "processId";

describe("Quality gate validation service contract tests", () => {
  const provider = new Pact({
    consumer: "web-bp",
    provider: "business-process-execution-service",
  });

  let appConfig: { gatewayUrl: string };

  beforeAll(async () => {
    await provider.setup();
    const port = provider.opts.port;
    appConfig = {
      gatewayUrl: `http://127.0.0.1:${port}/`,
    };
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        QualityGateValidationService,
        { provide: APP_CONFIG, useValue: appConfig },
        {
          provide: AuthenticationService,
          useValue: { getUsername: jest.fn(() => "userName") },
        },
      ],
    });
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  describe("marking quality gate as passed", () => {
    test("should mark quality gate passed with comment", async () => {
      await provider.addInteraction({
        state:
          "an upgrade process waiting to mark the quality gate as passed with a comment",
        uponReceiving:
          "a request to mark quality gate passed with comment from web-bp",
        withRequest: {
          method: "POST",
          path: `/projects/${PROJECT_ID}/business-process/executions/binary-upgrade/${PROCESS_ID}/user-input/mark-quality-gate-passed`,
          body: {
            requester: Matchers.string(),
            comment: Matchers.string(),
          },
          headers: {
            "Content-Type": "application/json",
          },
        },
        willRespondWith: {
          status: 204,
        },
      });

      const service = TestBed.inject(QualityGateValidationService);

      await expect(
        lastValueFrom(
          service.markQualityGatePassed(
            PROJECT_ID,
            PROCESS_ID,
            "quality gate approved"
          )
        )
      ).resolves.not.toThrow();
    });

    test("should mark quality gate passed without comment", async () => {
      await provider.addInteraction({
        state:
          "an upgrade process waiting to mark the quality gate as passed without a comment",
        uponReceiving:
          "a request to mark quality gate passed without comment from web-bp",
        withRequest: {
          method: "POST",
          path: `/projects/${PROJECT_ID}/business-process/executions/binary-upgrade/${PROCESS_ID}/user-input/mark-quality-gate-passed`,
          body: {
            requester: Matchers.string(),
          },
          headers: {
            "Content-Type": "application/json",
          },
        },
        willRespondWith: {
          status: 204,
        },
      });

      const service = TestBed.inject(QualityGateValidationService);

      await expect(
        lastValueFrom(service.markQualityGatePassed(PROJECT_ID, PROCESS_ID))
      ).resolves.not.toThrow();
    });

    test("should return an error when marking quality gate passed is rejected", async () => {
      await provider.addInteraction({
        state: "upgrade process not waiting for mark quality gate passed",
        uponReceiving:
          "a request to mark quality gate passed that is rejected from web-bp",
        withRequest: {
          method: "POST",
          path: `/projects/${PROJECT_ID}/business-process/executions/binary-upgrade/${PROCESS_ID}/user-input/mark-quality-gate-passed`,
          body: {
            requester: Matchers.string(),
            comment: Matchers.string(),
          },
          headers: {
            "Content-Type": "application/json",
          },
        },
        willRespondWith: {
          status: 409,
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            message: Matchers.string(),
          },
        },
      });

      const service = TestBed.inject(QualityGateValidationService);

      const errorMessage = await lastValueFrom(
        service
          .markQualityGatePassed(
            PROJECT_ID,
            PROCESS_ID,
            "quality gate approved"
          )
          .pipe(catchError((error) => of(error.message)))
      );

      expect(errorMessage).toBeTruthy();
    });
  });

  describe("marking quality gate as failed", () => {
    test("should mark quality gate failed with comment", async () => {
      await provider.addInteraction({
        state:
          "an upgrade process waiting to mark the quality gate as failed with a comment",
        uponReceiving:
          "a request to mark quality gate failed with comment from web-bp",
        withRequest: {
          method: "POST",
          path: `/projects/${PROJECT_ID}/business-process/executions/binary-upgrade/${PROCESS_ID}/user-input/mark-quality-gate-failed`,
          body: {
            requester: Matchers.string(),
            shouldCleanDevelopment: Matchers.boolean(),
            developmentId: Matchers.string(),
            comment: Matchers.string(),
            supportsResourceManagement: Matchers.boolean(),
          },
          headers: {
            "Content-Type": "application/json",
          },
        },
        willRespondWith: {
          status: 204,
        },
      });

      const service = TestBed.inject(QualityGateValidationService);

      await expect(
        lastValueFrom(
          service.markQualityGateFailed({
            projectId: PROJECT_ID,
            processId: PROCESS_ID,
            shouldCleanDevelopment: false,
            developmentId: "developmentId",
            supportsResourceManagement: true,
            comment: "quality gate rejected",
          })
        )
      ).resolves.not.toThrow();
    });

    test("should mark quality gate failed without comment", async () => {
      await provider.addInteraction({
        state:
          "an upgrade process waiting to mark the quality gate as failed without a comment",
        uponReceiving:
          "a request to mark quality gate failed without comment from web-bp",
        withRequest: {
          method: "POST",
          path: `/projects/${PROJECT_ID}/business-process/executions/binary-upgrade/${PROCESS_ID}/user-input/mark-quality-gate-failed`,
          body: {
            requester: Matchers.string(),
            shouldCleanDevelopment: Matchers.boolean(),
            developmentId: Matchers.string(),
            supportsResourceManagement: Matchers.boolean(),
          },
          headers: {
            "Content-Type": "application/json",
          },
        },
        willRespondWith: {
          status: 204,
        },
      });

      const service = TestBed.inject(QualityGateValidationService);

      await expect(
        lastValueFrom(
          service.markQualityGateFailed({
            projectId: PROJECT_ID,
            processId: PROCESS_ID,
            shouldCleanDevelopment: false,
            developmentId: "developmentId",
            supportsResourceManagement: true,
          })
        )
      ).resolves.not.toThrow();
    });

    test("should return an error when marking quality gate failed is rejected", async () => {
      await provider.addInteraction({
        state: "upgrade process not waiting for mark quality gate failed",
        uponReceiving:
          "a request to mark quality gate failed that is rejected from web-bp",
        withRequest: {
          method: "POST",
          path: `/projects/${PROJECT_ID}/business-process/executions/binary-upgrade/${PROCESS_ID}/user-input/mark-quality-gate-failed`,
          body: {
            requester: Matchers.string(),
            shouldCleanDevelopment: Matchers.boolean(),
            developmentId: Matchers.string(),
            comment: Matchers.string(),
            supportsResourceManagement: Matchers.boolean(),
          },
          headers: {
            "Content-Type": "application/json",
          },
        },
        willRespondWith: {
          status: 409,
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            message: Matchers.string(),
          },
        },
      });

      const service = TestBed.inject(QualityGateValidationService);

      const errorMessage = await lastValueFrom(
        service
          .markQualityGateFailed({
            projectId: PROJECT_ID,
            processId: PROCESS_ID,
            shouldCleanDevelopment: false,
            developmentId: "developmentId",
            supportsResourceManagement: true,
            comment: "quality gate rejected",
          })
          .pipe(catchError((error) => of(error.message)))
      );

      expect(errorMessage).toBeTruthy();
    });
  });
});
