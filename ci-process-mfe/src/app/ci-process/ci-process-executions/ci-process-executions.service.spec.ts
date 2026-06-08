/* tslint:disable:no-unused-variable */

import { of, throwError } from "rxjs";
import { CiProcessExecutionsService } from "./ci-process-executions.service";
import { CiProcessExecutionsQuery } from "./models/ci-process-execution-query";
import { BusinessProcessExecutionStatus } from "@mxflow/features/business-process";
import { CiProcessExecutionsQueryResultApiModel } from "./models/ci-process-execution-query-result-api-model";
import { CiProcessExecutionsQueryResult } from "./models/ci-process-execution-query-result";
import { HttpErrorResponse, HttpParams } from "@angular/common/http";

describe("Service: CiProcessExecutions", () => {
  let service: CiProcessExecutionsService;
  let httpClientSpy: any;
  let environmentProviderSpy: any;

  const GATEWAY_URL = "GATEWAY_URL/";
  const PROJECT_ID = "PROJECT_ID";

  beforeEach(() => {
    let environment = { gatewayUrl: GATEWAY_URL };
    httpClientSpy = {
      get: jest.fn(),
    };
    environmentProviderSpy = {
      getEnvironment: jest.fn(() => environment),
    };
    service = new CiProcessExecutionsService(
      httpClientSpy,
      environmentProviderSpy
    );
  });

  it("should query executions correctly", (done) => {
    const query: CiProcessExecutionsQuery = {
      page: 10,
      pageSize: 50,
    };
    const queryParams = new HttpParams({ fromObject: { ...query } });

    jest
      .spyOn(httpClientSpy, "get")
      .mockReturnValue(of(TestHelper.getExecutionQueryResultApiModel()));

    service.getCiProcessExecutions(PROJECT_ID, query).subscribe({
      next: (data) => {
        expect(data).toEqual(TestHelper.getExecutionQueryResult());
        done();
      },
    });

    const url = `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/executions/ci-process`;
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(url, {
      params: queryParams,
    });
  });

  it("should handle error while getting executions", (done) => {
    const query: CiProcessExecutionsQuery = {
      page: 10,
      pageSize: 50,
    };
    const queryParams = new HttpParams({ fromObject: { ...query } });
    const errorResponse = new HttpErrorResponse({
      status: 500,
      error: "failed",
    });

    jest
      .spyOn(httpClientSpy, "get")
      .mockReturnValue(throwError(() => errorResponse));

    service.getCiProcessExecutions(PROJECT_ID, query).subscribe({
      error: (error) => {
        expect(error.message).toEqual("failed");
        done();
      },
    });

    const url = `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/executions/ci-process`;
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(url, {
      params: queryParams,
    });
  });
});

class TestHelper {
  static getExecutionQueryResultApiModel(): CiProcessExecutionsQueryResultApiModel {
    return {
      content: [
        {
          id: "id",
          name: "name",
          owner: "owner",
          status: BusinessProcessExecutionStatus.ABORTED,
          endDate: "endDate",
          expiryDate: "expiryDate",
          daysExtended: 9,
          definitionName: "definitionName",
          processName: "processName",
          startDate: "startDate",
          input: {
            configurationBranchName: "configurationBranchName",
            userStoryIds: ["id"],
          },
        },
      ],
      totalElements: 50,
    };
  }

  static getExecutionQueryResult(): CiProcessExecutionsQueryResult {
    return {
      content: [
        {
          id: "id",
          name: "name",
          owner: "owner",
          status: BusinessProcessExecutionStatus.ABORTED,
          endDate: "endDate",
          expiryDate: "expiryDate",
          daysExtended: 9,
          businessProcessDefinitionName: "definitionName",
          processName: "processName",
          startDate: "startDate",
          configurationBranchName: "configurationBranchName",
          userStoryIds: ["id"],
        },
      ],
      totalElements: 50,
    };
  }
}
