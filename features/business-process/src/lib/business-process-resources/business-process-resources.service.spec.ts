import { v4 as uuidv4, v4 as uuid } from "uuid";
import { AppConfig } from "@mxflow/config";
import { HttpClient, HttpParams } from "@angular/common/http";
import { lastValueFrom, of, throwError } from "rxjs";
import { BusinessProcessResourcesService } from "./business-process-resources.service";
import {
  BusinessProcessResource,
  ResourceType,
  ResourceUsageTags,
} from "./business-process-resource";

describe("Business process resources service test", () => {
  let gatewayUrl = uuid();
  const projectId = uuid();
  const processId = uuid();
  const baseUrl = `${gatewayUrl}projects/${projectId}/business-process/executions/resources`;

  let environmentProvider: AppConfig;
  let httpClient: HttpClient;
  let service: BusinessProcessResourcesService;

  beforeEach(() => {
    environmentProvider = {
      gatewayUrl: gatewayUrl,
    } as unknown as AppConfig;

    httpClient = {
      get: jest.fn(() => of(getResources())),
    } as unknown as HttpClient;

    service = new BusinessProcessResourcesService(
      httpClient,
      environmentProvider
    );
  });

  it("given a business process have resources, when user request to view them, then return the list of resources", async () => {
    expect(
      await lastValueFrom(
        service.getBusinessProcessResources(projectId, processId)
      )
    ).toStrictEqual(getResources());
  });

  it("given a business process have resources, when user request to view them and fails to return, then return the error", async () => {
    const expectedErrorMessage = uuidv4();
    jest
      .spyOn(httpClient, "get")
      .mockReturnValueOnce(
        throwError(() => ({ status: 500, error: expectedErrorMessage }))
      );

    await lastValueFrom(
      service.getBusinessProcessResources(projectId, processId)
    ).catch((error) =>
      expect(error.message).toStrictEqual(expectedErrorMessage)
    );
  });

  it.each([true, false])(
    "given a business process have resources, when user specify reference resources, then query param referenceResource should be set accordingly",
    async (referenceResourceFlag) => {
      const params = new HttpParams()
        .set("processId", processId)
        .set("referenceResource", referenceResourceFlag.toString());

      await lastValueFrom(
        service.getBusinessProcessResources(
          projectId,
          processId,
          referenceResourceFlag
        )
      );

      expect(httpClient.get).toHaveBeenCalledWith(baseUrl, { params: params });
    }
  );

  it("given a business process have resources, when user does not specify reference resources, then query param referenceResource should not be set", async () => {
    await lastValueFrom(
      service.getBusinessProcessResources(projectId, processId)
    );
    const mockCalls = (httpClient.get as jest.Mock).mock.calls;
    const callArgs = mockCalls[0];
    const requestOptions = callArgs[1];
    const queryParams = requestOptions.params as HttpParams;

    expect(queryParams.get("referenceResource")).toBeNull();
  });

  function getResources(): BusinessProcessResource[] {
    return [
      {
        projectId: projectId,
        resourceId: "resource-1",
        resourceType: ResourceType.DEVELOPMENT,
        usageTags: [ResourceUsageTags.BACKPORT],
      },
      {
        projectId: projectId,
        resourceId: "resource-2",
        resourceType: ResourceType.ENVIRONMENT,
        usageTags: [],
      },
      {
        projectId: projectId,
        resourceId: "resource-3",
        resourceType: ResourceType.MERGE_JOB,
        usageTags: [ResourceUsageTags.BACKPORT],
      },
      {
        projectId: projectId,
        resourceId: "resource-4",
        resourceType: ResourceType.SCENARIO,
        usageTags: [],
      },
    ];
  }
});
