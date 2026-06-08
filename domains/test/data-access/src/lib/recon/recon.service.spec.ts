import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { ReconService } from "./recon.service";
import { TransferToReconRequest } from "./transfer-to-recon-request";
import { FetchReconReportsTransferProgressRequest } from "./fetch-recon-reports-transfer-progress-request";
import {
  ReconReportTransferProgress,
  TransferToReconProgressStatus,
} from "@mxevolve/domains/test/model";
import { lastValueFrom } from "rxjs";

const GATEWAY_URL = "https://api.test.com/";

describe("ReconService", () => {
  let service: ReconService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ReconService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });
    service = TestBed.inject(ReconService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe("fetch recon transfer progress", () => {
    const request: FetchReconReportsTransferProgressRequest = {
      projectId: "project-1",
      scenarioExecutionId: "scenario-exec-1",
      testExecutionId: "test-exec-1",
    };

    const expectedUrl = `${GATEWAY_URL}projects/project-1/test-execution-manager/scenario-executions/scenario-exec-1/test-executions/test-exec-1/recon-report-transfer-progress`;

    const mockProgress: ReconReportTransferProgress[] = [
      {
        reportPath: "/report/path1.xml",
        status: TransferToReconProgressStatus.PASSED,
        triggerTime: new Date("2024-01-01T10:00:00Z"),
        endTime: new Date("2024-01-01T10:05:00Z"),
        errorMessage: undefined,
      },
    ];

    it("should return the recon report transfer progress", async () => {
      const resultPromise = lastValueFrom(service.fetch(request));

      const req = httpController.expectOne(expectedUrl);
      req.flush(mockProgress);
      expect(req.request.method).toBe("GET");

      await expect(resultPromise).resolves.toEqual(mockProgress);
    });

    it("should propagate the error message from the server on failure", async () => {
      const resultPromise = lastValueFrom(service.fetch(request));

      const req = httpController.expectOne(expectedUrl);
      const failedToFetch = "Failed to trigger";
      req.flush(failedToFetch, {
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(resultPromise).rejects.toThrow(failedToFetch);
    });
  });

  describe("transferToRecon", () => {
    const request: TransferToReconRequest = {
      projectId: "project-1",
      scenarioExecutionId: "scenario-exec-1",
      testExecutionId: "test-exec-1",
      cycleId: "cycle-42",
      folderPaths: ["/report/path1.xml", "/report/path2.xml"],
    };

    const expectedUrl = `${GATEWAY_URL}projects/project-1/test-execution-manager/scenario-executions/scenario-exec-1/test-executions/test-exec-1/transfer-to-recon`;

    it("should POST to the correct URL", () => {
      service.transferToRecon(request).subscribe();

      const req = httpController.expectOne(expectedUrl);
      expect(req.request.method).toBe("POST");
      req.flush(null);
    });

    it("should send the request body", () => {
      service.transferToRecon(request).subscribe();

      const req = httpController.expectOne(expectedUrl);
      expect(req.request.body).toEqual({
        cycleId: "cycle-42",
        folderPaths: ["/report/path1.xml", "/report/path2.xml"],
      });
      req.flush(null);
    });

    it("should propagate the error message from the server on failure", async () => {
      const resultPromise = lastValueFrom(service.transferToRecon(request));

      const req = httpController.expectOne(expectedUrl);
      const failedToTrigger = "Failed to trigger";
      req.flush(failedToTrigger, { status: 400, statusText: "Bad Request" });

      await expect(resultPromise).rejects.toThrow(failedToTrigger);
    });
  });
});
