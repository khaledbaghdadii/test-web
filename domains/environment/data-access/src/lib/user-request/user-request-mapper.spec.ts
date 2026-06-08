import {
  toDeploymentRequest,
  toDeploymentRequests,
} from "./user-request-mapper";

describe("toDeploymentRequest", () => {
  it("should map all fields from api model", () => {
    const result = toDeploymentRequest({
      id: "req-1",
      environmentId: "env-1",
      completedAt: "2026-01-01T00:00:00Z",
    });

    expect(result).toEqual({
      id: "req-1",
      environmentId: "env-1",
      completedAt: "2026-01-01T00:00:00Z",
    });
  });

  it("should handle missing optional fields", () => {
    const result = toDeploymentRequest({
      id: "req-1",
    });

    expect(result).toEqual({
      id: "req-1",
      environmentId: undefined,
      completedAt: undefined,
    });
  });
});

describe("toDeploymentRequests", () => {
  it("should map an array of api models", () => {
    const result = toDeploymentRequests([
      { id: "req-1", environmentId: "env-1" },
      { id: "req-2", environmentId: "env-2" },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("req-1");
    expect(result[1].id).toBe("req-2");
  });
});
