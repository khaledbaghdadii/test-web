import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {
  BusinessProcessExecution,
  BusinessProcessExecutionService,
  BusinessProcessExecutionStatus,
  BusinessProcessOfficialStatus,
} from "@mxflow/features/business-process";
import { lastValueFrom, of, throwError } from "rxjs";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { TestBed } from "@angular/core/testing";

const EXECUTION_ID = "executionId";
const OWNER = "owner";
const DEFINITION_ID = "definitionId";
const START_DATE = "startDate";
const END_DATE = "endDate";
const DAYS_EXTENDED = 9;
const EXPIRY_DATE = "expiryDate";
const NAME = "executionName";
const STATUS = "NOT_STARTED" as BusinessProcessExecutionStatus;
const PROJECT_ID = "projectId";
const FAMILY_ID = "familyId";
const DEFINITION_NAME = "definitionName";
const OFFICIAL_STATUS = "OFFICIAL" as BusinessProcessOfficialStatus;
const ERROR_MESSAGE = "errorMessage";

describe("Business Process Execution Service Test", () => {
  let businessProcessExecutionService: BusinessProcessExecutionService;
  let environmentProvider: AppConfig;
  let httpClient: HttpClient;

  beforeEach(() => {
    environmentProvider = {
      gatewayUrl: "gateway/",
    } as AppConfig;

    httpClient = {
      get: jest.fn(() => of({})),
      put: jest.fn(() => of({})),
    } as unknown as HttpClient;

    TestBed.configureTestingModule({
      providers: [
        { provide: APP_CONFIG, useValue: environmentProvider },
        { provide: HttpClient, useValue: httpClient },
        BusinessProcessExecutionService,
      ],
    });

    businessProcessExecutionService = TestBed.inject(
      BusinessProcessExecutionService
    );
  });

  it("should be created", () => {
    expect(businessProcessExecutionService).toBeTruthy();
  });

  it("should get business process executions", (done) => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(of([getBusinessProcessExecution()]));

    businessProcessExecutionService
      .getBusinessProcessExecutions(PROJECT_ID)
      .subscribe((data) => {
        expect(data).toStrictEqual([getBusinessProcessExecution()]);
        done();
      });
  });

  it("should handle error correctly when getting business process executions", () => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(throwError(() => new Error("error")));

    businessProcessExecutionService
      .getBusinessProcessExecutions(PROJECT_ID)
      .subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
        },
      });
  });

  it("should  get business process execution by id", (done) => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(of(getBusinessProcessExecution()));

    businessProcessExecutionService
      .getBusinessProcessExecution(PROJECT_ID, EXECUTION_ID)
      .subscribe((data: BusinessProcessExecution) => {
        expect(data).toStrictEqual(getBusinessProcessExecution());
        done();
      });
  });

  it("should handle error correctly when getting a business process by id", async () => {
    jest.spyOn(httpClient, "get").mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            error: {
              message: ERROR_MESSAGE,
            },
          })
      )
    );

    await expect(
      lastValueFrom(
        businessProcessExecutionService.getBusinessProcessExecution("", "")
      )
    ).rejects.toThrow(ERROR_MESSAGE);
  });

  it("should check if business process execution exists", () => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(of(getBusinessProcessExecution()));

    businessProcessExecutionService
      .businessProcessExists(PROJECT_ID, EXECUTION_ID)
      .subscribe((data: boolean) => {
        expect(data).toStrictEqual(true);
      });
  });

  it("should check if business process does not exist with status 404 from backend", () => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(
        throwError(() => ({ status: 404, message: "error message" }))
      );

    businessProcessExecutionService
      .businessProcessExists(PROJECT_ID, EXECUTION_ID)
      .subscribe((data: boolean) => {
        expect(data).toStrictEqual(false);
      });
  });

  it("should update the executions to hidden", () => {
    jest
      .spyOn(httpClient, "put")
      .mockReturnValue(throwError(() => new Error("error")));

    let executionsId = ["execution1", "execution2"];
    businessProcessExecutionService.hideBusinessProcessExecutions(executionsId);
    expect(httpClient.put).toHaveBeenCalledWith(
      environmentProvider.gatewayUrl + "business-process/executions/hide/bulk",
      {
        executionsId: executionsId,
      }
    );
  });
  it("should handle error correctly when hiding executions", () => {
    jest
      .spyOn(httpClient, "put")
      .mockReturnValue(throwError(() => new Error("error")));

    businessProcessExecutionService
      .hideBusinessProcessExecutions([])
      .subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
        },
      });
  });

  it("should delegate to client correctly to unhide executions", () => {
    jest.spyOn(httpClient, "put").mockReturnValue(of({}));

    let executionsId = ["execution1", "execution2"];
    businessProcessExecutionService.unhideBusinessProcessExecutions(
      executionsId
    );
    expect(httpClient.put).toHaveBeenCalledWith(
      environmentProvider.gatewayUrl +
        "business-process/executions/unhide/bulk",
      {
        executionsId: executionsId,
      }
    );
  });

  it("should handle error correctly when unhiding executions", () => {
    jest
      .spyOn(httpClient, "put")
      .mockReturnValue(throwError(() => new Error("error")));

    businessProcessExecutionService
      .unhideBusinessProcessExecutions([])
      .subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
        },
      });
  });
});

function getBusinessProcessExecution(): BusinessProcessExecution {
  return {
    id: EXECUTION_ID,
    name: NAME,
    endDate: END_DATE,
    expiryDate: EXPIRY_DATE,
    daysExtended: DAYS_EXTENDED,
    status: STATUS,
    startDate: START_DATE,
    definitionName: DEFINITION_NAME,
    definitionId: DEFINITION_ID,
    owner: OWNER,
    familyId: FAMILY_ID,
    officiality: OFFICIAL_STATUS,
  };
}
