import { Matchers, Pact } from "@pact-foundation/pact";
import { eachLike } from "@pact-foundation/pact/src/dsl/matchers";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, lastValueFrom, of } from "rxjs";
import { ReconService } from "./recon.service";
import { TransferToReconRequest } from "./transfer-to-recon-request";
import { FetchReconReportsTransferProgressRequest } from "./fetch-recon-reports-transfer-progress-request";

const PROJECT_ID = "project-1";
const SCENARIO_EXECUTION_ID = "scenario-exec-1";
const TEST_EXECUTION_ID = "test-exec-1";
const CYCLE_ID = "cycle-42";
const FOLDER_PATHS = ["/report/path1.xml", "/report/path2.xml"];

const request: TransferToReconRequest = {
  projectId: PROJECT_ID,
  scenarioExecutionId: SCENARIO_EXECUTION_ID,
  testExecutionId: TEST_EXECUTION_ID,
  cycleId: CYCLE_ID,
  folderPaths: FOLDER_PATHS,
};

const EXPECTED_PATH = `/projects/${PROJECT_ID}/test-execution-manager/scenario-executions/${SCENARIO_EXECUTION_ID}/test-executions/${TEST_EXECUTION_ID}/transfer-to-recon`;

const FETCH_PROGRESS_PATH = `/projects/${PROJECT_ID}/test-execution-manager/scenario-executions/${SCENARIO_EXECUTION_ID}/test-executions/${TEST_EXECUTION_ID}/recon-report-transfer-progress`;

const fetchProgressRequest: FetchReconReportsTransferProgressRequest = {
  projectId: PROJECT_ID,
  scenarioExecutionId: SCENARIO_EXECUTION_ID,
  testExecutionId: TEST_EXECUTION_ID,
};

describe("ReconService contract tests", () => {
  const provider = new Pact({
    consumer: "web-test",
    provider: "test-execution-manager",
  });

  let appConfig: AppConfig;
  let reconService: ReconService;

  beforeAll(async () => {
    await provider.setup();
    const port = provider.opts.port;
    appConfig = { gatewayUrl: `http://127.0.0.1:${port}/` } as AppConfig;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        ReconService,
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });
    reconService = TestBed.inject(ReconService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  describe("Recon contract tests", () => {
    test("should successfully transfer reports to recon", async () => {
      await provider.addInteraction({
        state: "a test execution with transferable reports exists",
        uponReceiving: "a request to transfer reports to recon",
        withRequest: {
          method: "POST",
          path: EXPECTED_PATH,
          body: {
            cycleId: Matchers.string(CYCLE_ID),
            folderPaths: eachLike(Matchers.string(FOLDER_PATHS[0])),
          },
        },
        willRespondWith: {
          status: 204,
        },
      });

      await expect(
        lastValueFrom(reconService.transferToRecon(request))
      ).resolves.not.toThrow();
    });

    test("should return 409 when the transfer fails", async () => {
      await provider.addInteraction({
        state: "the transfer to recon fails",
        uponReceiving: "a request to transfer reports to recon that fails",
        withRequest: {
          method: "POST",
          path: EXPECTED_PATH,
          body: {
            cycleId: Matchers.string(CYCLE_ID),
            folderPaths: eachLike(Matchers.string(FOLDER_PATHS[0])),
          },
        },
        willRespondWith: {
          status: 409,
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
        },
      });

      const error = await lastValueFrom(
        reconService
          .transferToRecon(request)
          .pipe(catchError((err) => of(err.message)))
      );
      expect(error).toBeTruthy();
    });

    test("should successfully fetch recon report transfer progress", async () => {
      await provider.addInteraction({
        state: "recon report transfer progress exists for a test execution",
        uponReceiving: "a request to fetch recon report transfer progress",
        withRequest: {
          method: "GET",
          path: FETCH_PROGRESS_PATH,
        },
        willRespondWith: {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: eachLike({
            reportPath: Matchers.string("/report/path1.xml"),
            status: Matchers.string("COMPLETED"),
            triggerTime: Matchers.iso8601DateTime(),
            endTime: Matchers.iso8601DateTime(),
            errorMessage: Matchers.string(""),
          }),
        },
      });

      const result = await lastValueFrom(
        reconService.fetch(fetchProgressRequest)
      );
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
