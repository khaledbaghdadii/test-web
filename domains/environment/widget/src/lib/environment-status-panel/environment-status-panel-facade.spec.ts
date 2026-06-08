import { TestBed } from "@angular/core/testing";
import { of, firstValueFrom } from "rxjs";
import { EnvironmentStatusPanelFacade } from "./environment-status-panel-facade";
import {
  EnvironmentService,
  Environment,
  ManagementRequestService,
  ManagementRequest,
} from "@mxevolve/domains/environment/data-access";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";

describe("EnvironmentStatusPanelFacade", () => {
  let facade: EnvironmentStatusPanelFacade;
  let environmentService: jest.Mocked<EnvironmentService>;
  let managementRequestService: jest.Mocked<ManagementRequestService>;

  const mockEnvironment: Environment = {
    id: "env-001",
    projectId: "proj-001",
    status: EnvironmentStatus.BROKEN,
    outputsDirectoryUri: "https://storage.example.com/outputs/env-001",
    bundles: [
      { id: "mxtestweb", branch: "main", version: "1.0.0", type: "mxtestweb" },
    ],
    isTools: [{ name: "mxtestweb" }],
    databases: [
      { name: "db-fin", mxDbTypes: ["financial", "reporting"] },
      { name: "db-tech", mxDbTypes: ["technical"] },
    ],
    primaryApplicative: {
      allocation: { machine: { id: "machine-1", name: "app-host-1" } },
      directory: "/opt/murex/app",
    },
    secondaryApplicatives: [
      {
        allocation: { machine: { id: "machine-2", name: "app-host-2" } },
        directory: "/opt/murex/app2",
      },
    ],
    excludeFromShutdown: false,
    environmentActions: ["MONITOR_SERVICES", "START_STOP"],
  };

  const mockManagementRequests: ManagementRequest[] = [
    {
      id: "req-1",
      type: "deployment",
      status: "ENDED",
      createdOn: "2025-01-08T12:00:00Z",
      startedOn: "2025-01-08T12:01:00Z",
      endedOn: "2025-01-08T13:00:00Z",
      resultMessage: "Deployment failed due to missing configuration",
    },
    {
      id: "req-2",
      type: "clean",
      status: "ENDED",
      createdOn: "2025-01-09T12:00:00Z",
      startedOn: "2025-01-09T12:01:00Z",
      endedOn: "2025-01-09T12:30:00Z",
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EnvironmentStatusPanelFacade,
        {
          provide: EnvironmentService,
          useValue: { fetchByProjectAndEnvironmentId: jest.fn() },
        },
        {
          provide: ManagementRequestService,
          useValue: { fetchByProjectAndEnvironmentId: jest.fn() },
        },
      ],
    });

    facade = TestBed.inject(EnvironmentStatusPanelFacade);
    environmentService = TestBed.inject(
      EnvironmentService
    ) as jest.Mocked<EnvironmentService>;
    managementRequestService = TestBed.inject(
      ManagementRequestService
    ) as jest.Mocked<ManagementRequestService>;
  });

  it("combines environment and deployment request into panel data", async () => {
    environmentService.fetchByProjectAndEnvironmentId.mockReturnValue(
      of(mockEnvironment)
    );
    managementRequestService.fetchByProjectAndEnvironmentId.mockReturnValue(
      of(mockManagementRequests)
    );

    const result = await firstValueFrom(
      facade.fetchPanelData("proj-001", "env-001")
    );

    expect(result).toEqual({
      environmentId: "env-001",
      projectId: "proj-001",
      status: EnvironmentStatus.BROKEN,
      outputsDirectoryUri: "https://storage.example.com/outputs/env-001",
      bundles: [
        {
          id: "mxtestweb",
          branch: "main",
          version: "1.0.0",
          type: "mxtestweb",
        },
      ],
      isTools: [{ name: "mxtestweb" }],
      deploymentStartDate: "2025-01-08T12:01:00Z",
      deploymentEndDate: "2025-01-08T13:00:00Z",
      terminationMessage: "Deployment failed due to missing configuration",
      databases: [
        { name: "db-fin", mxDbTypes: ["financial", "reporting"] },
        { name: "db-tech", mxDbTypes: ["technical"] },
      ],
      primaryApplicative: {
        allocation: { machine: { id: "machine-1", name: "app-host-1" } },
        directory: "/opt/murex/app",
      },
      secondaryApplicatives: [
        {
          allocation: { machine: { id: "machine-2", name: "app-host-2" } },
          directory: "/opt/murex/app2",
        },
      ],
      excludeFromShutdown: false,
      environmentActions: ["MONITOR_SERVICES", "START_STOP"],
    });
  });

  it("returns undefined deployment fields when no deployment request exists", async () => {
    environmentService.fetchByProjectAndEnvironmentId.mockReturnValue(
      of(mockEnvironment)
    );
    managementRequestService.fetchByProjectAndEnvironmentId.mockReturnValue(
      of([
        {
          id: "req-2",
          type: "clean",
          status: "ENDED",
          createdOn: "2025-01-09T12:00:00Z",
        },
      ])
    );

    const result = await firstValueFrom(
      facade.fetchPanelData("proj-001", "env-001")
    );

    expect(result.deploymentStartDate).toBeUndefined();
    expect(result.deploymentEndDate).toBeUndefined();
    expect(result.terminationMessage).toBeUndefined();
  });

  it("returns undefined deployment fields when requests are empty", async () => {
    environmentService.fetchByProjectAndEnvironmentId.mockReturnValue(
      of(mockEnvironment)
    );
    managementRequestService.fetchByProjectAndEnvironmentId.mockReturnValue(
      of([])
    );

    const result = await firstValueFrom(
      facade.fetchPanelData("proj-001", "env-001")
    );

    expect(result.deploymentStartDate).toBeUndefined();
    expect(result.terminationMessage).toBeUndefined();
  });

  it("passes through new applicative fields from environment", async () => {
    environmentService.fetchByProjectAndEnvironmentId.mockReturnValue(
      of(mockEnvironment)
    );
    managementRequestService.fetchByProjectAndEnvironmentId.mockReturnValue(
      of(mockManagementRequests)
    );

    const result = await firstValueFrom(
      facade.fetchPanelData("proj-001", "env-001")
    );

    expect(result.primaryApplicative).toEqual({
      allocation: { machine: { id: "machine-1", name: "app-host-1" } },
      directory: "/opt/murex/app",
    });
    expect(result.secondaryApplicatives).toEqual([
      {
        allocation: { machine: { id: "machine-2", name: "app-host-2" } },
        directory: "/opt/murex/app2",
      },
    ]);
    expect(result.excludeFromShutdown).toBe(false);
    expect(result.environmentActions).toEqual([
      "MONITOR_SERVICES",
      "START_STOP",
    ]);
  });

  it("calls both services with the correct parameters", async () => {
    environmentService.fetchByProjectAndEnvironmentId.mockReturnValue(
      of(mockEnvironment)
    );
    managementRequestService.fetchByProjectAndEnvironmentId.mockReturnValue(
      of([])
    );

    await firstValueFrom(facade.fetchPanelData("proj-001", "env-001"));

    expect(
      environmentService.fetchByProjectAndEnvironmentId
    ).toHaveBeenCalledWith("proj-001", "env-001");
    expect(
      managementRequestService.fetchByProjectAndEnvironmentId
    ).toHaveBeenCalledWith("proj-001", "env-001");
  });
});
