import { toEnvironments } from "./environment-mapper";
import { EnvironmentApiModel } from "./environment-api-model";

describe("toEnvironments", () => {
  it("should map api models to environments", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-001",
        status: "READY",
        projectId: "proj-001",
        createdOn: "2026-03-01T10:00:00Z",
        bundles: [
          { id: "CORE", branch: "9.24", version: "9.24.1.12345" },
          { id: "OTHER", branch: "1.0", version: "1.0.0" },
        ],
        isTools: [{ name: "mxtestweb" }],
        configurationIdentifier: {
          branch: "main",
          revision: "abc123def456",
        },
        databases: [
          {
            name: "db-001",
            allocation: {
              name: "dbserver",
              port: "3306",
              machine: { name: "host1" },
            },
            mxDbTypes: ["financial", "reporting"],
          },
        ],
      },
      {
        id: "env-002",
        status: "PREPARING",
        projectId: "proj-002",
        createdOn: "2026-03-02T11:00:00Z",
        bundles: [{ id: "CORE", branch: "9.25", version: "9.25.0.67890" }],
        isTools: [],
        configurationIdentifier: {
          branch: "develop",
          revision: "789xyz000111",
        },
      },
    ];

    const result = toEnvironments(apiModels);

    expect(result).toEqual([
      {
        id: "env-001",
        status: "READY",
        projectId: "proj-001",
        startDate: "2026-03-01T10:00:00Z",
        mxVersion: "9.24",
        mxBuildId: "9.24.1.12345",
        commitId: "abc123def456",
        configurationIdentifier: {
          branch: "main",
          revision: "abc123def456",
        },
        bundles: [
          { id: "CORE", branch: "9.24", version: "9.24.1.12345" },
          { id: "OTHER", branch: "1.0", version: "1.0.0" },
        ],
        isTools: [{ name: "mxtestweb" }],
        outputsDirectoryUri: undefined,
        databases: [
          {
            name: "db-001",
            mxDbTypes: ["financial", "reporting"],
            allocation: {
              name: "dbserver",
              port: "3306",
              machine: { name: "host1" },
            },
          },
        ],
        primaryApplicative: undefined,
        secondaryApplicatives: undefined,
        excludeFromShutdown: undefined,
        environmentActions: undefined,
        webClientUrl: undefined,
        secureClientArtifactUri: undefined,
      },
      {
        id: "env-002",
        status: "PREPARING",
        projectId: "proj-002",
        startDate: "2026-03-02T11:00:00Z",
        mxVersion: "9.25",
        mxBuildId: "9.25.0.67890",
        commitId: "789xyz000111",
        configurationIdentifier: {
          branch: "develop",
          revision: "789xyz000111",
        },
        bundles: [{ id: "CORE", branch: "9.25", version: "9.25.0.67890" }],
        isTools: [],
        outputsDirectoryUri: undefined,
        databases: [],
        primaryApplicative: undefined,
        secondaryApplicatives: undefined,
        excludeFromShutdown: undefined,
        environmentActions: undefined,
        webClientUrl: undefined,
        secureClientArtifactUri: undefined,
      },
    ]);
  });

  it("should return dash when bundles are missing", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-003",
        status: "CREATED",
        projectId: "proj-003",
        createdOn: "2026-03-03T12:00:00Z",
      },
    ];

    const result = toEnvironments(apiModels);

    expect(result).toEqual([
      {
        id: "env-003",
        status: "CREATED",
        projectId: "proj-003",
        startDate: "2026-03-03T12:00:00Z",
        mxVersion: "-",
        mxBuildId: "-",
        commitId: "-",
        bundles: undefined,
        isTools: undefined,
        outputsDirectoryUri: undefined,
        databases: [],
        primaryApplicative: undefined,
        secondaryApplicatives: undefined,
        excludeFromShutdown: undefined,
        environmentActions: undefined,
        webClientUrl: undefined,
        secureClientArtifactUri: undefined,
      },
    ]);
  });

  it("should map applicative fields when present", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-010",
        status: "READY",
        projectId: "proj-010",
        createdOn: "2026-04-01T10:00:00Z",
        primaryApplicative: {
          allocation: {
            machine: { id: "machine-001", name: "primary-host" },
            ports: { start: 8000, end: 8100 },
          },
          directory: "/opt/primary",
        },
        secondaryApplicatives: [
          {
            allocation: {
              machine: { id: "machine-002", name: "secondary-host" },
              ports: { start: 9000, end: 9100 },
            },
            directory: "/opt/secondary",
          },
        ],
        excludeFromShutdown: true,
        environmentActions: ["RESTART", "STOP"],
        webClientUrl: "https://web.example.com",
        secureClientArtifactUri: "https://secure.example.com/artifact",
      },
    ];

    const result = toEnvironments(apiModels);

    expect(result[0].primaryApplicative).toEqual({
      allocation: {
        machine: { id: "machine-001", name: "primary-host" },
        ports: { start: 8000, end: 8100 },
      },
      directory: "/opt/primary",
    });
    expect(result[0].secondaryApplicatives).toEqual([
      {
        allocation: {
          machine: { id: "machine-002", name: "secondary-host" },
          ports: { start: 9000, end: 9100 },
        },
        directory: "/opt/secondary",
      },
    ]);
    expect(result[0].excludeFromShutdown).toBe(true);
    expect(result[0].environmentActions).toEqual(["RESTART", "STOP"]);
    expect(result[0].webClientUrl).toBe("https://web.example.com");
    expect(result[0].secureClientArtifactUri).toBe(
      "https://secure.example.com/artifact"
    );
  });

  it("should infer the mxtestweb bundle type from the bundle id", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-013",
        status: "READY",
        projectId: "proj-013",
        createdOn: "2026-04-04T10:00:00Z",
        bundles: [{ id: "mxtestweb", branch: "main", version: "1.0.0" }],
      },
    ];

    const result = toEnvironments(apiModels);

    expect(result[0].bundles).toEqual([
      {
        id: "mxtestweb",
        branch: "main",
        version: "1.0.0",
        type: "mxtestweb",
      },
    ]);
  });

  it("should map the bundle changelist when present", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-014",
        status: "READY",
        projectId: "proj-014",
        createdOn: "2026-04-05T10:00:00Z",
        bundles: [
          {
            id: "CORE",
            branch: "9.24",
            version: "9.24.1",
            changelist: "67890",
          },
        ],
      },
    ];

    const result = toEnvironments(apiModels);

    expect(result[0].bundles).toEqual([
      { id: "CORE", branch: "9.24", version: "9.24.1", changelist: "67890" },
    ]);
  });

  it("should return undefined for applicative fields when not present", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-011",
        status: "CREATED",
        projectId: "proj-011",
        createdOn: "2026-04-02T10:00:00Z",
      },
    ];

    const result = toEnvironments(apiModels);

    expect(result[0].primaryApplicative).toBeUndefined();
    expect(result[0].secondaryApplicatives).toBeUndefined();
    expect(result[0].excludeFromShutdown).toBeUndefined();
    expect(result[0].environmentActions).toBeUndefined();
    expect(result[0].webClientUrl).toBeUndefined();
    expect(result[0].secureClientArtifactUri).toBeUndefined();
  });

  it("should map applicative with missing optional machine and ports", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-012",
        status: "READY",
        projectId: "proj-012",
        createdOn: "2026-04-03T10:00:00Z",
        primaryApplicative: {
          allocation: {},
          directory: "/opt/minimal",
        },
      },
    ];

    const result = toEnvironments(apiModels);

    expect(result[0].primaryApplicative).toEqual({
      allocation: {
        machine: undefined,
        ports: undefined,
      },
      directory: "/opt/minimal",
    });
  });

  it("should return dash when core bundle is absent", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-004",
        status: "READY",
        projectId: "proj-001",
        createdOn: "2026-03-04T08:00:00Z",
        bundles: [{ id: "OTHER", branch: "1.0", version: "1.0.0" }],
        configurationIdentifier: { branch: "main", revision: "rev123" },
      },
    ];

    const result = toEnvironments(apiModels);

    expect(result[0].mxVersion).toBe("-");
    expect(result[0].mxBuildId).toBe("-");
    expect(result[0].commitId).toBe("rev123");
  });

  it("should infer the mxtestweb bundle type case-insensitively", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-005",
        status: "READY",
        projectId: "proj-001",
        createdOn: "2026-03-05T08:00:00Z",
        bundles: [{ id: "MXTESTWEB", branch: "main", version: "1.0.0" }],
      },
    ];

    const result = toEnvironments(apiModels);

    expect(result[0].bundles).toEqual([
      {
        id: "MXTESTWEB",
        branch: "main",
        version: "1.0.0",
        type: "mxtestweb",
      },
    ]);
  });

  it("should map panel-2 detail fields when present", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-020",
        status: "READY",
        projectId: "proj-020",
        createdOn: "2026-05-01T10:00:00Z",
        environmentDeploymentMode: "ENVIRONMENT_SNAPSHOT",
      },
    ];

    const result = toEnvironments(apiModels);

    expect(result[0].environmentDeploymentMode).toBe("ENVIRONMENT_SNAPSHOT");
  });

  it("should map environmentSource when present", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-021",
        status: "READY",
        projectId: "proj-021",
        createdOn: "2026-05-02T10:00:00Z",
        environmentSource: "POOL",
      },
    ];

    expect(toEnvironments(apiModels)[0].environmentSource).toBe("POOL");
  });

  it("should map environmentDefinition when present", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-022",
        status: "READY",
        projectId: "proj-022",
        createdOn: "2026-05-03T10:00:00Z",
        environmentDefinition: { id: "def-1", name: "My Definition" },
      },
    ];

    expect(toEnvironments(apiModels)[0].environmentDefinition).toEqual({
      id: "def-1",
      name: "My Definition",
    });
  });

  it("should map configurationIdentifier when present", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-023",
        status: "READY",
        projectId: "proj-023",
        createdOn: "2026-05-04T10:00:00Z",
        configurationIdentifier: { branch: "feature/x", revision: "rev-999" },
      },
    ];

    expect(toEnvironments(apiModels)[0].configurationIdentifier).toEqual({
      branch: "feature/x",
      revision: "rev-999",
    });
  });

  it("should map maintenance when present", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-024",
        status: "READY",
        projectId: "proj-024",
        createdOn: "2026-05-05T10:00:00Z",
        maintenance: { full: true },
      },
    ];

    expect(toEnvironments(apiModels)[0].maintenance).toEqual({ full: true });
  });

  it("should map allocationId when present", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-025",
        status: "READY",
        projectId: "proj-025",
        createdOn: "2026-05-06T10:00:00Z",
        allocationId: "alloc-123",
      },
    ];

    expect(toEnvironments(apiModels)[0].allocationId).toBe("alloc-123");
  });

  it("should map clients when present", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-026",
        status: "READY",
        projectId: "proj-026",
        createdOn: "2026-05-07T10:00:00Z",
        clients: [
          {
            directory: "/opt/client",
            allocation: { machine: { name: "client-host" } },
          },
        ],
      },
    ];

    expect(toEnvironments(apiModels)[0].clients).toEqual([
      {
        directory: "/opt/client",
        allocation: { machine: { name: "client-host" } },
      },
    ]);
  });

  it("should map tests when present", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-027",
        status: "READY",
        projectId: "proj-027",
        createdOn: "2026-05-08T10:00:00Z",
        tests: [
          {
            directory: "/opt/tests",
            allocation: { machine: { name: "tests-host" } },
          },
        ],
      },
    ];

    expect(toEnvironments(apiModels)[0].tests).toEqual([
      {
        directory: "/opt/tests",
        allocation: { machine: { name: "tests-host" } },
      },
    ]);
  });

  it("should map clonedRepositoryPath when present", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-028",
        status: "READY",
        projectId: "proj-028",
        createdOn: "2026-05-09T10:00:00Z",
        clonedRepositoryPath: "/repos/cloned",
      },
    ];

    expect(toEnvironments(apiModels)[0].clonedRepositoryPath).toBe(
      "/repos/cloned"
    );
  });

  it("should return undefined for panel-2 detail fields when absent", () => {
    const apiModels: EnvironmentApiModel[] = [
      {
        id: "env-029",
        status: "CREATED",
        projectId: "proj-029",
        createdOn: "2026-05-10T10:00:00Z",
      },
    ];

    const environment = toEnvironments(apiModels)[0];

    expect(environment.environmentDeploymentMode).toBeUndefined();
    expect(environment.environmentSource).toBeUndefined();
    expect(environment.environmentDefinition).toBeUndefined();
    expect(environment.configurationIdentifier).toBeUndefined();
    expect(environment.maintenance).toBeUndefined();
    expect(environment.allocationId).toBeUndefined();
    expect(environment.clients).toBeUndefined();
    expect(environment.tests).toBeUndefined();
    expect(environment.clonedRepositoryPath).toBeUndefined();
  });

  it("should return empty array for empty input", () => {
    expect(toEnvironments([])).toEqual([]);
  });
});
