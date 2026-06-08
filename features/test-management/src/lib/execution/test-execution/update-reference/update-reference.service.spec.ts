import { UpdateReferenceService } from "./update-reference.service";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { of, throwError } from "rxjs";
import { UpdateReferenceStatus } from "./update-reference";
import {
  binaryImpactIds,
  commitMessage,
  configurationImpactIds,
  referenceToUpdate,
  scenarioExecutionId,
  testCaseExecutionId,
  triggerUpdateReferenceRequest,
  triggerUpdateReferenceRequestNoTestCaseExecutionId,
  triggerUpdateReferenceResponse,
} from "./update-reference-utils";
import { TestBed } from "@angular/core/testing";

const gatewayUrl = "http://gateway.com/";
const projectId = "projectId";
const testExecutionId = "testExecutionId";
const updateReference = {
  id: "updateReferenceId",
  projectId: projectId,
  testExecutionId: testExecutionId,
  path: "some/path/to/file",
  commitMessage: "commit message",
  status: UpdateReferenceStatus.PASSED,
  commitId: "commitId",
  linkedConfigurationImpactsIds: new Set<string>([
    "configImpact1",
    "configImpact2",
  ]),
  linkedBinaryImpactsIds: new Set<string>(["binaryImpact1", "binaryImpact2"]),
};
const testCaseExecutionQueryParams = new HttpParams().set(
  "testCaseExecutionId",
  testCaseExecutionId
);

describe("UpdateReferenceService", () => {
  let httpClient: HttpClient;
  let appConfig: AppConfig;
  let service: UpdateReferenceService;

  beforeEach(() => {
    httpClient = {
      get: jest.fn(() => of([updateReference])),
      post: jest.fn(() => of(triggerUpdateReferenceResponse)),
    } as unknown as HttpClient;
    appConfig = { gatewayUrl: gatewayUrl } as unknown as AppConfig;
    TestBed.configureTestingModule({
      providers: [
        UpdateReferenceService,
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });
    service = TestBed.inject(UpdateReferenceService);
  });

  describe("fetch update references", () => {
    it("should delegate fetching to the http client", (done) => {
      service
        .fetch(projectId, testExecutionId)
        .subscribe((updateReferences) => {
          expect(httpClient.get).toHaveBeenCalledWith(
            `${gatewayUrl}projects/${projectId}/test-execution-manager/test-executions/${testExecutionId}/update-reference`
          );
          expect(updateReferences).toEqual([updateReference]);
          done();
        });
    });

    it("should handle error on fetching", (done) => {
      const errorMessage = "errorMessage";
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(
          throwError(() => new HttpErrorResponse({ error: errorMessage }))
        );
      service.fetch(projectId, testExecutionId).subscribe({
        error: (err) => {
          expect(err.message).toEqual(errorMessage);
          done();
        },
      });
    });
  });

  describe("trigger", () => {
    it("should trigger the update reference correctly", (done) => {
      service.trigger(triggerUpdateReferenceRequest).subscribe((response) => {
        expect(httpClient.post).toHaveBeenCalledWith(
          `${appConfig.gatewayUrl}projects/${projectId}/test-execution-manager/scenario-executions/${scenarioExecutionId}/test-executions/${testExecutionId}/update-reference`,
          {
            commitMessage: commitMessage,
            binaryImpactIds: binaryImpactIds,
            configurationImpactIds: configurationImpactIds,
            referenceToUpdate: referenceToUpdate,
          },
          {
            params: testCaseExecutionQueryParams,
          }
        );
        expect(response).toEqual(triggerUpdateReferenceResponse);
        done();
      });
    });

    it("should trigger the update reference correctly when test case execution id is not specified", (done) => {
      service
        .trigger(triggerUpdateReferenceRequestNoTestCaseExecutionId)
        .subscribe((response) => {
          expect(httpClient.post).toHaveBeenCalledWith(
            `${appConfig.gatewayUrl}projects/${projectId}/test-execution-manager/scenario-executions/${scenarioExecutionId}/test-executions/${testExecutionId}/update-reference`,
            {
              commitMessage: commitMessage,
              binaryImpactIds: binaryImpactIds,
              configurationImpactIds: configurationImpactIds,
              referenceToUpdate: referenceToUpdate,
            },
            {
              params: new HttpParams(),
            }
          );
          expect(response).toEqual(triggerUpdateReferenceResponse);
          done();
        });
    });

    it("should return an error if failed to trigger update reference", (done) => {
      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(throwError(() => "errorMessage"));
      service.trigger(triggerUpdateReferenceRequest).subscribe({
        error: (err) => {
          expect(err).toEqual("errorMessage");
          done();
        },
      });
    });
  });
});
