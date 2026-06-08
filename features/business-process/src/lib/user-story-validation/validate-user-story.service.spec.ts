import { lastValueFrom, of, throwError } from "rxjs";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { TestBed } from "@angular/core/testing";
import { ValidateUserStoryService } from "./validate-user-story.service";
import { v4 as uuidv4 } from "uuid";
import { ValidateUserStoryRequest } from "./validate-user-story-request";
import { ValidateUserStoryResponse } from "./validate-user-story-response";

describe("ValidateUserStoryService", () => {
  const gatewayUrl = uuidv4();
  const projectId = uuidv4();
  const userStoryId = uuidv4();
  const errorMessage = uuidv4();

  let httpClient: HttpClient;
  let environmentProvider: AppConfig;
  let service: ValidateUserStoryService;

  beforeEach(() => {
    httpClient = {
      post: jest.fn(() => of(getValidateUserStoryResponse())),
    } as unknown as HttpClient;

    environmentProvider = {
      gatewayUrl: gatewayUrl,
    } as unknown as AppConfig;

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: environmentProvider },
        ValidateUserStoryService,
      ],
    });

    service = TestBed.inject(ValidateUserStoryService);
  });

  it("given a valid user story id, when validating user story, then return validation response", async () => {
    const response = await lastValueFrom(
      service.validateUserStory(projectId, getValidateUserStoryRequest())
    );

    expect(httpClient.post).toHaveBeenCalledWith(
      `${gatewayUrl}projects/${projectId}/business-process/executions/ci-process/validate/user-story`,
      getValidateUserStoryRequest()
    );
    expect(response).toStrictEqual(getValidateUserStoryResponse());
  });

  it("given a server error, when validating user story, then throw error with message", async () => {
    jest.spyOn(httpClient, "post").mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: {
              message: errorMessage,
            },
          })
      )
    );

    await expect(
      lastValueFrom(
        service.validateUserStory(projectId, getValidateUserStoryRequest())
      )
    ).rejects.toThrow(errorMessage);
  });

  function getValidateUserStoryRequest(): ValidateUserStoryRequest {
    return {
      userStoryId: userStoryId,
    };
  }

  function getValidateUserStoryResponse(): ValidateUserStoryResponse {
    return {
      valid: true,
      errorMessage: "",
    };
  }
});
