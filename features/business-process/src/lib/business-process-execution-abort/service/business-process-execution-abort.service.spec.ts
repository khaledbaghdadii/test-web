import { BusinessProcessExecutionAbortService } from "@mxflow/features/business-process";
import { AppConfig } from "@mxflow/config";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { v4 as uuidv4, v4 as uuid } from "uuid";
import { lastValueFrom, of, throwError } from "rxjs";
import { AbortBusinessProcessExecutionRequest } from "./abort-business-process-execution-request";

describe("Business Process Executions Abort Service Test", () => {
  let gatewayUrl = uuid();
  const projectId = uuid();
  const processId = uuid();
  const developmentId = uuid();

  let environmentProvider: AppConfig;
  let httpClient: HttpClient;
  let service: BusinessProcessExecutionAbortService;

  beforeEach(() => {
    environmentProvider = {
      gatewayUrl: gatewayUrl,
    } as unknown as AppConfig;

    httpClient = {
      post: jest.fn(() => of(undefined)),
    } as unknown as HttpClient;

    service = new BusinessProcessExecutionAbortService(
      httpClient,
      environmentProvider
    );
  });

  it("should abort business process execution with correct url", async () => {
    const expectedUrl = `${gatewayUrl}projects/${projectId}/business-process/executions/${processId}/abort`;

    await lastValueFrom(service.abort(getAbortRequest()));

    expect(httpClient.post).toHaveBeenCalledWith(expectedUrl, {
      shouldCleanDevelopment: true,
      developmentId: developmentId,
    });
  });

  it("should handle failures by throwing correct error message", async () => {
    const expectedErrorMessage = uuidv4();
    jest.spyOn(httpClient, "post").mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            error: {
              message: expectedErrorMessage,
            },
          })
      )
    );

    await expect(
      lastValueFrom(service.abort(getAbortRequest()))
    ).rejects.toThrow(expectedErrorMessage);
  });

  function getAbortRequest(): AbortBusinessProcessExecutionRequest {
    return {
      projectId: projectId,
      processId: processId,
      shouldCleanDevelopment: true,
      developmentId: developmentId,
    };
  }
});
