import {
  EnvironmentService,
  ManagementRequestsService,
} from "@mxflow/features/environment";
import { EnvironmentActionsService } from "./environment-actions-service";
import { of, throwError } from "rxjs";
import { TestBed } from "@angular/core/testing";

const ENVIRONMENT_ID = "environmentId";
const PROJECT_ID = "projectId";
const START_REQUEST_ID = "startRequestId";

describe("Environment Actions", () => {
  let service: EnvironmentActionsService;
  let managementRequestsService: ManagementRequestsService;
  let environmentService: EnvironmentService;

  beforeEach(() => {
    managementRequestsService = {
      startEnvironmentRequest: jest.fn(() => of({})),
      stopEnvironmentRequest: jest.fn(() => of({})),
    } as unknown as ManagementRequestsService;
    environmentService = {
      excludeFromShutdown: jest.fn(() => of({})),
    } as unknown as EnvironmentService;

    TestBed.configureTestingModule({
      providers: [
        EnvironmentActionsService,
        {
          provide: ManagementRequestsService,
          useValue: managementRequestsService,
        },
        { provide: EnvironmentService, useValue: environmentService },
      ],
    });
    service = TestBed.inject(EnvironmentActionsService);
  });

  describe("Start Environment", () => {
    it("calls start environment request with correct IDs and returns void on success", () => {
      const response = { startRequestId: START_REQUEST_ID };
      jest
        .spyOn(managementRequestsService, "startEnvironmentRequest")
        .mockReturnValue(of(response));

      service.startEnvironment(PROJECT_ID, ENVIRONMENT_ID).subscribe({
        next: (result) => {
          expect(result).toEqual(response);
          expect(
            managementRequestsService.startEnvironmentRequest
          ).toHaveBeenCalledWith(PROJECT_ID, ENVIRONMENT_ID);
        },
      });
    });

    it("returns an error when the request fails", () => {
      const upstreamError = "network failure";
      jest
        .spyOn(managementRequestsService, "startEnvironmentRequest")
        .mockReturnValue(throwError(() => upstreamError));

      service.startEnvironment(PROJECT_ID, ENVIRONMENT_ID).subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toBe(upstreamError);
          expect(
            managementRequestsService.startEnvironmentRequest
          ).toHaveBeenCalledWith(PROJECT_ID, ENVIRONMENT_ID);
        },
      });
    });
  });

  describe("Stop Environment", () => {
    it("calls stop environment request with correct IDs and returns request on success", () => {
      const response = { stopRequestId: START_REQUEST_ID };
      jest
        .spyOn(managementRequestsService, "stopEnvironmentRequest")
        .mockReturnValue(of(response));

      service.stopEnvironment(PROJECT_ID, ENVIRONMENT_ID).subscribe({
        next: (result) => {
          expect(result).toEqual(response);
          expect(
            managementRequestsService.stopEnvironmentRequest
          ).toHaveBeenCalledWith(PROJECT_ID, ENVIRONMENT_ID);
        },
      });
    });

    it("returns an error when the request fails", () => {
      const upstreamError = "network failure";
      jest
        .spyOn(managementRequestsService, "stopEnvironmentRequest")
        .mockReturnValue(throwError(() => upstreamError));

      service.stopEnvironment(PROJECT_ID, ENVIRONMENT_ID).subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toBe(upstreamError);
          expect(
            managementRequestsService.stopEnvironmentRequest
          ).toHaveBeenCalledWith(PROJECT_ID, ENVIRONMENT_ID);
        },
      });
    });
  });

  describe("Exclude Environment From Daily Shutdown", () => {
    const EXCLUDE = true;
    it("calls exclude from daily shutdown with correct IDs and returns void on success", () => {
      jest
        .spyOn(environmentService, "excludeFromShutdown")
        .mockReturnValue(of(void 0));

      service
        .excludeEnvironmentFromDailyShutdown(
          PROJECT_ID,
          ENVIRONMENT_ID,
          EXCLUDE
        )
        .subscribe({
          next: (result) => {
            expect(result).toBeUndefined();
            expect(environmentService.excludeFromShutdown).toHaveBeenCalledWith(
              PROJECT_ID,
              ENVIRONMENT_ID
            );
          },
        });
    });

    it("returns an error when the request fails", () => {
      const error =
        "An error occurred while excluding the environment from daily shutdown, please try again";
      jest
        .spyOn(environmentService, "excludeFromShutdown")
        .mockReturnValue(throwError(() => error));

      service
        .excludeEnvironmentFromDailyShutdown(
          PROJECT_ID,
          ENVIRONMENT_ID,
          EXCLUDE
        )
        .subscribe({
          error: (err) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe(error);
            expect(environmentService.excludeFromShutdown).toHaveBeenCalledWith(
              PROJECT_ID,
              ENVIRONMENT_ID
            );
          },
        });
    });
  });
});
