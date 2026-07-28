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
        correlationId: "corr-1",
        resultStatus: "FAILURE",
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

  it("maps correlationId from the api model", () => {
    const apiModels: ManagementRequestApiModel[] = [
      {
        id: "req-4",
        correlationId: "corr-4",
        createdOn: "2025-01-08T12:00:00Z",
        environmentId: "env-1",
        status: "PENDING",
        type: "deployment",
      },
    ];

    expect(toManagementRequests(apiModels)[0].correlationId).toBe("corr-4");
  });

  it("maps statusMessage from the api model", () => {
    const apiModels: ManagementRequestApiModel[] = [
      {
        id: "req-5",
        correlationId: "corr-5",
        createdOn: "2025-01-08T12:00:00Z",
        environmentId: "env-1",
        status: "EXECUTING",
        statusMessage: "Step 3 of 5",
        type: "deployment",
      },
    ];

    expect(toManagementRequests(apiModels)[0].statusMessage).toBe(
      "Step 3 of 5"
    );
  });

  it("maps resultStatus from the result status", () => {
    const apiModels: ManagementRequestApiModel[] = [
      {
        id: "req-6",
        correlationId: "corr-6",
        createdOn: "2025-01-08T12:00:00Z",
        environmentId: "env-1",
        status: "ENDED",
        type: "deployment",
        result: { status: "SUCCESS" },
      },
    ];

    expect(toManagementRequests(apiModels)[0].resultStatus).toBe("SUCCESS");
  });

  it("maps undefined resultStatus when result is absent", () => {
    const apiModels: ManagementRequestApiModel[] = [
      {
        id: "req-7",
        correlationId: "corr-7",
        createdOn: "2025-01-08T12:00:00Z",
        environmentId: "env-1",
        status: "PENDING",
        type: "deployment",
      },
    ];

    expect(toManagementRequests(apiModels)[0].resultStatus).toBeUndefined();
  });

  it("maps abortedBy from the api model", () => {
    const apiModels: ManagementRequestApiModel[] = [
      {
        id: "req-8",
        correlationId: "corr-8",
        createdOn: "2025-01-08T12:00:00Z",
        environmentId: "env-1",
        status: "ENDED",
        type: "deployment",
        abortedBy: "john.doe",
      },
    ];

    expect(toManagementRequests(apiModels)[0].abortedBy).toBe("john.doe");
  });

  it("maps hasMetrics from the api model", () => {
    const apiModels: ManagementRequestApiModel[] = [
      {
        id: "req-9",
        correlationId: "corr-9",
        createdOn: "2025-01-08T12:00:00Z",
        environmentId: "env-1",
        status: "ENDED",
        type: "deployment",
        hasMetrics: true,
      },
    ];

    expect(toManagementRequests(apiModels)[0].hasMetrics).toBe(true);
  });

  it("maps artifacts from the api model", () => {
    const apiModels: ManagementRequestApiModel[] = [
      {
        id: "req-10",
        correlationId: "corr-10",
        createdOn: "2025-01-08T12:00:00Z",
        environmentId: "env-1",
        status: "ENDED",
        type: "deployment",
        artifacts: ["artifact-1", "artifact-2"],
      },
    ];

    expect(toManagementRequests(apiModels)[0].artifacts).toEqual([
      "artifact-1",
      "artifact-2",
    ]);
  });

  it("maps undefined for optional fields when absent", () => {
    const apiModels: ManagementRequestApiModel[] = [
      {
        id: "req-11",
        correlationId: "corr-11",
        createdOn: "2025-01-08T12:00:00Z",
        environmentId: "env-1",
        status: "PENDING",
        type: "deployment",
      },
    ];

    const result = toManagementRequests(apiModels)[0];

    expect(result.statusMessage).toBeUndefined();
    expect(result.abortedBy).toBeUndefined();
    expect(result.hasMetrics).toBeUndefined();
    expect(result.artifacts).toBeUndefined();
  });
});
