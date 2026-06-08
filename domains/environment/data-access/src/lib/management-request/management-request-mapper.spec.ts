import { ManagementRequestApiModel } from "./management-request-api-model";
import { toManagementRequests } from "./management-request-mapper";

describe("toManagementRequests", () => {
  it("maps all fields from api models", () => {
    const apiModels: ManagementRequestApiModel[] = [
      {
        id: "req-1",
        correlationId: "corr-1",
        createdOn: "2025-01-08T12:00:00Z",
        startedOn: "2025-01-08T12:01:00Z",
        endedOn: "2025-01-08T13:00:00Z",
        environmentId: "env-1",
        status: "ENDED",
        type: "deployment",
        result: {
          status: "FAILURE",
          message: "Deployment failed due to missing configuration",
        },
      },
    ];

    const result = toManagementRequests(apiModels);

    expect(result).toEqual([
      {
        id: "req-1",
        type: "deployment",
        status: "ENDED",
        createdOn: "2025-01-08T12:00:00Z",
        startedOn: "2025-01-08T12:01:00Z",
        endedOn: "2025-01-08T13:00:00Z",
        resultMessage: "Deployment failed due to missing configuration",
      },
    ]);
  });

  it("maps undefined result message when result is absent", () => {
    const apiModels: ManagementRequestApiModel[] = [
      {
        id: "req-2",
        correlationId: "corr-2",
        createdOn: "2025-01-08T12:00:00Z",
        environmentId: "env-1",
        status: "PENDING",
        type: "deployment",
      },
    ];

    const result = toManagementRequests(apiModels);

    expect(result[0].resultMessage).toBeUndefined();
  });

  it("maps undefined optional date fields", () => {
    const apiModels: ManagementRequestApiModel[] = [
      {
        id: "req-3",
        correlationId: "corr-3",
        createdOn: "2025-01-08T12:00:00Z",
        environmentId: "env-1",
        status: "PENDING",
        type: "clean",
      },
    ];

    const result = toManagementRequests(apiModels);

    expect(result[0].startedOn).toBeUndefined();
    expect(result[0].endedOn).toBeUndefined();
  });
});
