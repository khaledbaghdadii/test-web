import { TestBed } from "@angular/core/testing";
import { lastValueFrom, of, throwError } from "rxjs";
import { BusinessProcessNamePipe } from "./business-process-name.pipe";
import { BusinessProcessExecutionService } from "../business-process-execution-service/business-process-execution.service";
import { BusinessProcessExecution } from "../business-process-execution-service/model/business-process-execution";

describe("BusinessProcessNamePipe", () => {
  let pipe: BusinessProcessNamePipe;
  let businessProcessExecutionService: Partial<BusinessProcessExecutionService>;

  beforeEach(() => {
    businessProcessExecutionService = {
      getBusinessProcessExecution: jest.fn(() => of(getBusinessProcess())),
    };

    TestBed.configureTestingModule({
      providers: [
        BusinessProcessNamePipe,
        {
          provide: BusinessProcessExecutionService,
          useValue: businessProcessExecutionService,
        },
      ],
    });

    pipe = TestBed.inject(BusinessProcessNamePipe);
  });

  it("should return the business process name when execution is fetched successfully", async () => {
    expect(
      await lastValueFrom(pipe.transform("businessProcessId", "projectId"))
    ).toEqual("businessProcessName");
  });

  it("should return empty string when service throws an error", async () => {
    jest
      .spyOn(businessProcessExecutionService, "getBusinessProcessExecution")
      .mockReturnValue(throwError(() => new Error("errorMessage")));

    expect(
      await lastValueFrom(pipe.transform("businessProcessId", "projectId"))
    ).toEqual("");
  });

  function getBusinessProcess(): BusinessProcessExecution {
    return {
      id: "businessProcessId",
      name: "businessProcessName",
    } as BusinessProcessExecution;
  }
});
