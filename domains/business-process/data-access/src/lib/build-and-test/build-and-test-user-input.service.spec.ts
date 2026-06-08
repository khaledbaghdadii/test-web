import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { BuildAndTestUserInputService } from "./build-and-test-user-input.service";

describe("BuildAndTestUserInputService", () => {
  const GATEWAY_URL = "https://api.test/";
  const PROJECT_ID = "project-1";
  const PROCESS_ID = "process-1";
  const BASE_URL = `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/executions/ci-process/${PROCESS_ID}`;

  let service: BuildAndTestUserInputService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
        BuildAndTestUserInputService,
      ],
    });

    service = TestBed.inject(BuildAndTestUserInputService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("sends changes for review with the CI request body including backport inputs", () => {
    service
      .sendChangesForReview({
        projectId: PROJECT_ID,
        processId: PROCESS_ID,
        mergeConfigurationId: "merge-config-1",
        mergeJobTitle: "VAL-1 Fix issue",
        mergeJobReviewers: ["reviewer"],
        backportChanges: true,
        backportMergeConfigurationIds: ["backport-config-1"],
        backportInputs: [
          {
            definitionId: "definition-1",
            repositoryId: "repository-1",
            mergeConfigurationId: "backport-config-1",
            buildAndTestInfraGroupId: "infra-1",
          },
        ],
        shouldCleanDevelopment: true,
        developmentId: "development-1",
        supportsResourceManagement: true,
      })
      .subscribe();

    const request = httpTestingController.expectOne(
      `${BASE_URL}/user-input/send-changes-for-review`
    );

    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual({
      mergeConfigurationId: "merge-config-1",
      mergeJobTitle: "VAL-1 Fix issue",
      mergeJobReviewers: ["reviewer"],
      backportChanges: true,
      backportMergeConfigurationIds: ["backport-config-1"],
      backportInputs: [
        {
          definitionId: "definition-1",
          repositoryId: "repository-1",
          mergeConfigurationId: "backport-config-1",
          buildAndTestInfraGroupId: "infra-1",
        },
      ],
      shouldCleanDevelopment: true,
      developmentId: "development-1",
      supportsResourceManagement: true,
    });
  });

  it("omits absent backport merge configuration ids and keeps explicit empty backport inputs", () => {
    service
      .sendChangesForReview({
        projectId: PROJECT_ID,
        processId: PROCESS_ID,
        mergeConfigurationId: "merge-config-1",
        mergeJobTitle: "VAL-1 Fix issue",
        mergeJobReviewers: [],
        backportChanges: false,
        backportInputs: [],
        shouldCleanDevelopment: false,
        developmentId: "development-1",
        supportsResourceManagement: false,
      })
      .subscribe();

    const request = httpTestingController.expectOne(
      `${BASE_URL}/user-input/send-changes-for-review`
    );

    expect(request.request.body.backportMergeConfigurationIds).toBeUndefined();
    expect(request.request.body.backportInputs).toEqual([]);
  });

  it("proceeds with predefined inputs using the legacy CI endpoint", () => {
    service
      .proceedWithPredefinedInputs({
        projectId: PROJECT_ID,
        processId: PROCESS_ID,
        shouldCleanDevelopment: true,
        developmentId: "development-1",
        supportsResourceManagement: true,
      })
      .subscribe();

    const request = httpTestingController.expectOne(
      `${BASE_URL}/user-input/proceed-with-predefined-inputs`
    );

    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual({
      shouldCleanDevelopment: true,
      developmentId: "development-1",
      supportsResourceManagement: true,
    });
  });

  it.each([
    [
      "reopenMergeRequest",
      "reopen-merge-request",
      { title: "title", reviewers: undefined },
    ],
    ["fixIntegrationIssues", "fix-integration-issues", {}],
    [
      "commitsCherryPicked",
      "commits-cherry-picked",
      { mergeConfigurationId: "merge-config-1" },
    ],
    [
      "repushBackportMergeRequest",
      "repush-backport-merge-job",
      { mergeConfigurationId: "merge-config-1" },
    ],
  ])("posts to %s", (methodName, path, expectedBody) => {
    if (methodName === "reopenMergeRequest") {
      service
        .reopenMergeRequest({
          projectId: PROJECT_ID,
          processId: PROCESS_ID,
          title: "title",
        })
        .subscribe();
    } else if (methodName === "fixIntegrationIssues") {
      service.fixIntegrationIssues(PROJECT_ID, PROCESS_ID).subscribe();
    } else if (methodName === "commitsCherryPicked") {
      service
        .commitsCherryPicked({
          projectId: PROJECT_ID,
          processId: PROCESS_ID,
          mergeConfigurationId: "merge-config-1",
        })
        .subscribe();
    } else {
      service
        .repushBackportMergeRequest({
          projectId: PROJECT_ID,
          processId: PROCESS_ID,
          mergeConfigurationId: "merge-config-1",
        })
        .subscribe();
    }

    const request = httpTestingController.expectOne(
      `${BASE_URL}/user-input/${path}`
    );

    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual(expectedBody);
  });

  it("surfaces backend error messages", () => {
    let errorMessage: string | undefined;

    service.fixIntegrationIssues(PROJECT_ID, PROCESS_ID).subscribe({
      error: (error) => (errorMessage = error.message),
    });

    httpTestingController
      .expectOne(`${BASE_URL}/user-input/fix-integration-issues`)
      .flush({ message: "Cannot accept decision" }, { status: 409, statusText: "Conflict" });

    expect(errorMessage).toBe("Cannot accept decision");
  });
});
