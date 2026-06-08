import { TechnicalReseedService } from "./technical-reseed.service";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { lastValueFrom, of, throwError } from "rxjs";
import {
  LaunchTechnicalReseedOperationRequest,
  LaunchTechnicalReseedOperationResponse,
  TechnicalReseedStatusEnum,
} from "../technical-reseed-models";
import {
  ExecutionGroup,
  ExecutionGroupStatus,
} from "../execution-group-models";

const PROJECT_ID = "projectId";
const EXECUTION_GROUP_ID = "executionGroupId";
const TECHNICAL_RESEED_ID = "technicalReseedId";

const appConfig: AppConfig = {
  gatewayUrl: "https://gateway.cd.murex.com/api/v1/",
} as unknown as AppConfig;

describe("Technical Reseed Service", () => {
  let service: TechnicalReseedService;
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = {
      post: jest.fn(),
      get: jest.fn(),
    } as unknown as HttpClient;

    TestBed.configureTestingModule({
      providers: [
        TechnicalReseedService,
        { provide: APP_CONFIG, useValue: appConfig },
        { provide: HttpClient, useValue: httpClient },
      ],
    });
    service = TestBed.inject(TechnicalReseedService);
  });

  describe("Launch Technical Reseed", () => {
    it("launch the technical reseed operation correctly", () => {
      (httpClient.post as jest.Mock).mockReturnValue(of(getResponse()));
      service
        .launchTechnicalReseed(PROJECT_ID, EXECUTION_GROUP_ID, getRequest())
        .subscribe();
      expect(httpClient.post).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `projects/${PROJECT_ID}/technical-reseed-execution-groups/${EXECUTION_GROUP_ID}/launch-reseed`,
        getRequest()
      );
    });

    it("returns an error when the request fails", () => {
      const error = "error message";
      (httpClient.post as jest.Mock).mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 404,
              error: { message: error },
            })
        )
      );

      service
        .launchTechnicalReseed(PROJECT_ID, EXECUTION_GROUP_ID, getRequest())
        .subscribe({
          error: (err) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe(error);
          },
        });
    });

    function getRequest(): LaunchTechnicalReseedOperationRequest {
      return {
        branch: "branch",
        configurationCommitId: "configurationCommitId",
        environmentDefinitionId: "environmentDefinitionId",
        maintenanceConfiguration: {
          full: true,
        },
        targetBranch: "targetBranch",
        validationLevel: "validationLevel",
        infraGroupId: "infraGroupId",
      };
    }

    function getResponse(): LaunchTechnicalReseedOperationResponse {
      return {
        requestId: "requestId",
      };
    }
  });

  describe("Get Technical Reseed Execution Group Details", () => {
    it("get the details correctly", async () => {
      const response = getResponse();
      (httpClient.get as jest.Mock).mockReturnValue(of(response));

      await expect(
        lastValueFrom(
          service.getTechnicalReseedExecutionGroupDetails(
            PROJECT_ID,
            EXECUTION_GROUP_ID
          )
        )
      ).resolves.toEqual(response);
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `projects/${PROJECT_ID}/technical-reseed-execution-groups/${EXECUTION_GROUP_ID}`
      );
    });

    it("returns an error when the request fails", () => {
      const error = "error message";
      (httpClient.get as jest.Mock).mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 404,
              error: { message: error },
            })
        )
      );

      service
        .getTechnicalReseedExecutionGroupDetails(PROJECT_ID, EXECUTION_GROUP_ID)
        .subscribe({
          error: (err) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe(error);
          },
        });
    });

    function getResponse(): ExecutionGroup {
      return {
        executionGroupId: EXECUTION_GROUP_ID,
        launchesAllowed: false,
        reason: "reason",
        status: ExecutionGroupStatus.ENABLED,
        technicalReseedOperations: [
          {
            id: TECHNICAL_RESEED_ID,
            status: TechnicalReseedStatusEnum.RUNNING,
            branch: "branch",
            sourceCommit: "sourceCommit",
            validationLevel: "validationLevel",
            maintenanceLevel: "FULL",
            environmentDefinitionId: "definitionId",
            dumpIds: ["dump1", "dump2"],
            environmentId: "environmentId",
            createdOn: "createdOn",
          },
        ],
      };
    }
  });
});
