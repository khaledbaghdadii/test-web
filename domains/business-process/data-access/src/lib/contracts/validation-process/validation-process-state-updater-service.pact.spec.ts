import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { Matchers, Pact } from "@pact-foundation/pact";
import { lastValueFrom } from "rxjs";
import {
  MarkQualityGateFailedRequest,
  MarkQualityGatePassedRequest,
  SendChangesForReviewRequest,
  SkipIntegrateChangesRequest,
  ValidationProcessStateUpdaterService,
} from "../../validation-process/validation-process-state-updater.service";
import { Router } from "@angular/router";

const PROJECT_ID = "projectId";
const EXECUTION_ID = "executionId";

describe("Validation process state updater service contract tests", () => {
  const provider = new Pact({
    consumer: "web-bp",
    provider: "business-process-execution-service",
  });

  let appConfig: { gatewayUrl: string };

  beforeAll(async () => {
    await provider.setup();
    const port = provider.opts.port;
    appConfig = { gatewayUrl: `http://127.0.0.1:${port}/` };
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        ValidationProcessStateUpdaterService,
        { provide: APP_CONFIG, useValue: appConfig },
        {
          provide: Router,
          useValue: { navigateByUrl: jest.fn().mockResolvedValue(true) },
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

  test("should mark quality gate as passed", async () => {
    await provider.addInteraction({
      state:
        "a master validation execution is in PENDING_INPUT state at execute-quality-gates stage",
      uponReceiving:
        "a request to mark the quality gate as passed for a master validation execution",
      withRequest: {
        method: "PUT",
        path: `/projects/${PROJECT_ID}/business-process/executions/master-validation/${EXECUTION_ID}/user-input/mark-quality-gate-passed`,
        body: {
          comment: Matchers.string(),
        },
      },
      willRespondWith: {
        status: 200,
      },
    });

    const service = TestBed.inject(ValidationProcessStateUpdaterService);
    const request: MarkQualityGatePassedRequest = {
      projectId: PROJECT_ID,
      executionId: EXECUTION_ID,
      comment: "Quality gate passed",
    };

    await expect(
      lastValueFrom(service.markQualityGatePassed(request))
    ).resolves.not.toThrow();
  });

  test("should mark quality gate as failed", async () => {
    await provider.addInteraction({
      state:
        "a master validation execution is in PENDING_INPUT state at execute-quality-gates stage ready to fail",
      uponReceiving:
        "a request to mark the quality gate as failed for a master validation execution",
      withRequest: {
        method: "PUT",
        path: `/projects/${PROJECT_ID}/business-process/executions/master-validation/${EXECUTION_ID}/user-input/mark-quality-gate-failed`,
        body: {
          comment: Matchers.string(),
          developmentId: Matchers.string(),
          shouldCleanDevelopment: Matchers.boolean(),
        },
      },
      willRespondWith: {
        status: 200,
      },
    });

    const service = TestBed.inject(ValidationProcessStateUpdaterService);
    const request: MarkQualityGateFailedRequest = {
      projectId: PROJECT_ID,
      executionId: EXECUTION_ID,
      comment: "Quality gate failed",
      developmentId: "dev-123",
      shouldCleanDevelopment: true,
    };

    await expect(
      lastValueFrom(service.markQualityGateFailed(request))
    ).resolves.not.toThrow();
  });

  test("should send changes for review", async () => {
    await provider.addInteraction({
      state:
        "a master validation execution is in PENDING_INPUT state at integrate-fixes stage",
      uponReceiving:
        "a request to send changes for review for a master validation execution",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/business-process/executions/master-validation/${EXECUTION_ID}/user-input/send-changes-for-review`,
        body: {
          mergeJobTitle: Matchers.string(),
          mergeConfigurationId: Matchers.string(),
          mergeJobReviewers: Matchers.eachLike(Matchers.string()),
          shouldCleanDevelopment: Matchers.boolean(),
          developmentId: Matchers.string(),
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    const service = TestBed.inject(ValidationProcessStateUpdaterService);
    const request: SendChangesForReviewRequest = {
      projectId: PROJECT_ID,
      processId: EXECUTION_ID,
      mergeJobTitle: "Review Title",
      mergeConfigurationId: "merge-cfg-1",
      mergeJobReviewers: ["reviewer1"],
      shouldCleanDevelopment: false,
      developmentId: "dev-456",
    };

    await expect(
      lastValueFrom(service.sendChangesForReview(request))
    ).resolves.not.toThrow();
  });

  test("should reopen merge request", async () => {
    await provider.addInteraction({
      state: "a master validation execution has a failed merge request",
      uponReceiving:
        "a request to reopen the merge request for a master validation execution",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/business-process/executions/master-validation/${EXECUTION_ID}/user-input/reopen-merge-request`,
      },
      willRespondWith: {
        status: 200,
      },
    });

    const service = TestBed.inject(ValidationProcessStateUpdaterService);

    await expect(
      lastValueFrom(service.reopenMergeRequest(PROJECT_ID, EXECUTION_ID))
    ).resolves.not.toThrow();
  });

  test("should skip integrate fixes", async () => {
    await provider.addInteraction({
      state:
        "a master validation execution is in PENDING_INPUT state at integrate-fixes stage ready to skip",
      uponReceiving:
        "a request to skip integrate fixes for a master validation execution",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/business-process/executions/master-validation/${EXECUTION_ID}/user-input/skip-integrate-fixes`,
        body: {
          destinationBranch: Matchers.string(),
          shouldCleanDevelopment: Matchers.boolean(),
          developmentId: Matchers.string(),
        },
      },
      willRespondWith: {
        status: 200,
      },
    });

    const service = TestBed.inject(ValidationProcessStateUpdaterService);
    const request: SkipIntegrateChangesRequest = {
      destinationBranch: "main",
      shouldCleanDevelopment: true,
      developmentId: "dev-789",
    };

    await expect(
      lastValueFrom(
        service.skipIntegrateChanges(PROJECT_ID, EXECUTION_ID, request)
      )
    ).resolves.not.toThrow();
  });
});
