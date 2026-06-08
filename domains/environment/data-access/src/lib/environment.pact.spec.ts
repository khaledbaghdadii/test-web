import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { catchError, lastValueFrom, of } from "rxjs";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { EnvironmentService } from "./environment/environment.service";
import { UserRequestService } from "./user-request/user-request.service";
import { ManagementRequestService } from "./management-request/management-request.service";
import { DatabaseEditorService } from "./database-editor/database-editor.service";
import { ServiceActionsService } from "./service-actions/service-actions.service";
import { ApplicationConnectionService } from "./application-connection/application-connection.service";
import { SystematicConfigAuditService } from "./systematic-config-audit/systematic-config-audit.service";
import { TechnicalReseedService } from "./technical-reseed/technical-reseed.service";

describe("environment contract tests", () => {
  const provider = new Pact({
    consumer: "web-environment",
    provider: "mxenv-management",
  });
  const pactFilePath = resolve(
    provider.opts.dir ?? resolve(__dirname, "../../../../../../pacts"),
    `${provider.opts.consumer}-${provider.opts.provider}.json`
  );

  const projectId = "projectId";
  const environmentId = "environmentId";
  const requestId = "requestId";
  const reseedExecutionGroupId = "reseedExecutionGroupId";

  let environmentService: EnvironmentService;
  let userRequestService: UserRequestService;
  let managementRequestService: ManagementRequestService;
  let databaseEditorService: DatabaseEditorService;
  let serviceActionsService: ServiceActionsService;
  let applicationConnectionService: ApplicationConnectionService;
  let systematicConfigAuditService: SystematicConfigAuditService;
  let technicalReseedService: TechnicalReseedService;

  beforeAll(async () => {
    rmSync(pactFilePath, { force: true });
    await provider.setup();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        {
          provide: GATEWAY_CONFIG,
          useValue: {
            gatewayUrl: `http://127.0.0.1:${provider.opts.port}/`,
          },
        },
        EnvironmentService,
        UserRequestService,
        ManagementRequestService,
        DatabaseEditorService,
        ServiceActionsService,
        ApplicationConnectionService,
        SystematicConfigAuditService,
        TechnicalReseedService,
      ],
    });

    environmentService = TestBed.inject(EnvironmentService);
    userRequestService = TestBed.inject(UserRequestService);
    managementRequestService = TestBed.inject(ManagementRequestService);
    databaseEditorService = TestBed.inject(DatabaseEditorService);
    serviceActionsService = TestBed.inject(ServiceActionsService);
    applicationConnectionService = TestBed.inject(ApplicationConnectionService);
    systematicConfigAuditService = TestBed.inject(SystematicConfigAuditService);
    technicalReseedService = TestBed.inject(TechnicalReseedService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("validates contract for fetching environments by ids", async () => {
    await provider.addInteraction({
      state: "environments exist",
      uponReceiving: "a request to fetch environments by ids",
      withRequest: {
        method: "GET",
        path: "/environments",
        query: {
          environmentId: environmentId,
          size: "1",
          page: "0",
          sort: "createdOn,asc",
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          content: Matchers.eachLike(getEnviromentBodyMatcher()),
          totalElements: Matchers.integer(),
        },
      },
    });

    const environments = await lastValueFrom(
      environmentService.fetchByEnvironmentIds([environmentId])
    );

    expect(environments.length).toBeGreaterThan(0);
    expect(environments[0].id).toBeDefined();
    expect(environments[0].status).toBeDefined();
    expect(environments[0].startDate).toBeDefined();
    expect(environments[0].databases).toBeDefined();
  });

  test("validates contract for fetching user request status", async () => {
    await provider.addInteraction({
      state: "environment requests exists",
      uponReceiving: "a request to fetch user request status",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/environments/user-requests`,
        query: {
          requestIds: requestId,
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: Matchers.eachLike({
          id: Matchers.string(),
          environmentId: Matchers.string(),
          completedAt: Matchers.iso8601DateTimeWithMillis(),
        }),
      },
    });

    const status = await lastValueFrom(
      userRequestService.fetchUserRequestStatus(projectId, [requestId])
    );

    expect(status.environmentIds.length).toBeGreaterThan(0);
    expect(status.latestRequestInProgress).toBe(false);
    expect(status.latestRequestFailed).toBe(false);
  });

  test("validates contract for fetching environment by project and environment id", async () => {
    await provider.addInteraction({
      state: "Environment exists",
      uponReceiving:
        "a request to fetch environment by project and environment id",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/environments/${environmentId}`,
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: getEnviromentBodyMatcher(),
      },
    });

    const environment = await lastValueFrom(
      environmentService.fetchByProjectAndEnvironmentId(
        projectId,
        environmentId
      )
    );

    expect(environment).not.toBeNull();
    expect(environment.id).toBeDefined();
    expect(environment.status).toBeDefined();
    expect(environment.projectId).toBeDefined();
    expect(environment.databases).toBeDefined();
    expect(environment.webClientUrl).toBeDefined();
    expect(environment.secureClientArtifactUri).toBeDefined();
    expect(environment.environmentActions).toBeDefined();
  });

  test("validates contract for fetching environment by project and environment id returns error", async () => {
    await provider.addInteraction({
      state: "environment does not exist",
      uponReceiving: "a request to fetch environment that does not exist",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/environments/${environmentId}`,
      },
      willRespondWith: {
        status: 404,
      },
    });

    const result = await lastValueFrom(
      environmentService
        .fetchByProjectAndEnvironmentId(projectId, environmentId)
        .pipe(catchError((error) => of({ error: error.message })))
    );

    expect(result).toHaveProperty("error");
  });

  test("validates contract for fetching management requests by project and environment id", async () => {
    await provider.addInteraction({
      state: "environment requests can be fetched",
      uponReceiving:
        "a request to fetch management requests by project and environment id",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/environments/${environmentId}/requests`,
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: Matchers.eachLike({
          id: Matchers.string(),
          correlationId: Matchers.string(),
          createdOn: Matchers.iso8601DateTimeWithMillis(),
          startedOn: Matchers.iso8601DateTimeWithMillis(),
          endedOn: Matchers.iso8601DateTimeWithMillis(),
          environmentId: Matchers.string(),
          status: Matchers.string(),
          statusMessage: Matchers.string(),
          type: Matchers.string(),
          result: {
            status: Matchers.string(),
            message: Matchers.string(),
          },
        }),
      },
    });

    const requests = await lastValueFrom(
      managementRequestService.fetchByProjectAndEnvironmentId(
        projectId,
        environmentId
      )
    );

    expect(requests).not.toBeNull();
    expect(requests.length).toBeGreaterThan(0);
    expect(requests[0].id).toBeDefined();
    expect(requests[0].type).toBeDefined();
    expect(requests[0].status).toBeDefined();
  });

  test("validates contract for fetching management requests returns error", async () => {
    await provider.addInteraction({
      state: "environment requests can not be fetched",
      uponReceiving: "a request to fetch management requests fails",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/environments/${environmentId}/requests`,
      },
      willRespondWith: {
        status: 500,
      },
    });

    const result = await lastValueFrom(
      managementRequestService
        .fetchByProjectAndEnvironmentId(projectId, environmentId)
        .pipe(catchError((error) => of({ error: error.message })))
    );

    expect(result).toHaveProperty("error");
  });

  test("validates contract for fetching database editor url", async () => {
    const databaseName = "DATABASE_NAME";

    await provider.addInteraction({
      state: "environment database editor can be fetched",
      uponReceiving: "a request to GET environment database editor",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/environments/${environmentId}/databases/${databaseName}/editor`,
      },
      willRespondWith: {
        status: 200,
        headers: {
          Location: Matchers.string(),
        },
      },
    });

    const url = await lastValueFrom(
      databaseEditorService.fetchEditorUrl(
        projectId,
        environmentId,
        databaseName
      )
    );

    expect(url).toBeDefined();
  });

  test("validates contract for fetching database editor url returns error", async () => {
    const databaseName = "DATABASE_NAME";

    await provider.addInteraction({
      state: "environment database editor can not be fetched",
      uponReceiving: "a request to GET environment database editor fails",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/environments/${environmentId}/databases/${databaseName}/editor`,
      },
      willRespondWith: {
        status: 500,
      },
    });

    const result = await lastValueFrom(
      databaseEditorService
        .fetchEditorUrl(projectId, environmentId, databaseName)
        .pipe(catchError((error) => of({ error: error.message })))
    );

    expect(result).toHaveProperty("error");
  });

  test("validates contract for fetching SSH connection URL", async () => {
    await provider.addInteraction({
      state: "can get application ssh connection url",
      uponReceiving: "a request to fetch SSH connection URL",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/environments/${environmentId}/application/ssh-connection`,
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: { connectionUrl: Matchers.string() },
      },
    });

    const result = await lastValueFrom(
      applicationConnectionService.fetchSshConnectionUrl(
        projectId,
        environmentId
      )
    );

    expect(result).toBeDefined();
    expect(result.connectionUrl).toBeDefined();
  });

  test("validates contract for fetching SSH connection URL with machine id", async () => {
    const machineId = "machineId";

    await provider.addInteraction({
      state: "can get application ssh connection url",
      uponReceiving: "a request to fetch SSH connection URL with machine id",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/environments/${environmentId}/application/ssh-connection/${machineId}`,
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: { connectionUrl: Matchers.string() },
      },
    });

    const result = await lastValueFrom(
      applicationConnectionService.fetchSshConnectionUrl(
        projectId,
        environmentId,
        machineId
      )
    );

    expect(result).toBeDefined();
    expect(result.connectionUrl).toBeDefined();
  });

  test("validates contract for fetching SCP connection URL", async () => {
    await provider.addInteraction({
      state: "can get application scp connection url",
      uponReceiving: "a request to fetch SCP connection URL",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/environments/${environmentId}/application/scp-connection`,
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: { connectionUrl: Matchers.string() },
      },
    });

    const result = await lastValueFrom(
      applicationConnectionService.fetchScpConnectionUrl(
        projectId,
        environmentId
      )
    );

    expect(result).toBeDefined();
    expect(result.connectionUrl).toBeDefined();
  });

  test("validates contract for fetching SCP connection URL with machine id", async () => {
    const machineId = "machineId";

    await provider.addInteraction({
      state: "can get application scp connection url",
      uponReceiving: "a request to fetch SCP connection URL with machine id",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/environments/${environmentId}/application/scp-connection/${machineId}`,
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: { connectionUrl: Matchers.string() },
      },
    });

    const result = await lastValueFrom(
      applicationConnectionService.fetchScpConnectionUrl(
        projectId,
        environmentId,
        machineId
      )
    );

    expect(result).toBeDefined();
    expect(result.connectionUrl).toBeDefined();
  });

  test("validates contract for fetching SSH connection URL returns error", async () => {
    await provider.addInteraction({
      state: "environment SSH connection is not available",
      uponReceiving: "a request to fetch SSH connection URL that fails",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/environments/${environmentId}/application/ssh-connection`,
      },
      willRespondWith: {
        status: 500,
      },
    });

    const result = await lastValueFrom(
      applicationConnectionService
        .fetchSshConnectionUrl(projectId, environmentId)
        .pipe(catchError((error) => of({ error: error.message })))
    );

    expect(result).toHaveProperty("error");
  });

  test("validates contract for starting an environment", async () => {
    await provider.addInteraction({
      state: "Environment exists and services ready to be started",
      uponReceiving: "a request to start an environment",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/environments/${environmentId}/start`,
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: { startRequestId: Matchers.string() },
      },
    });

    const result = await lastValueFrom(
      serviceActionsService.startEnvironment(projectId, environmentId)
    );

    expect(result).toBeDefined();
    expect(result.startRequestId).toBeDefined();
  });

  test("validates contract for stopping an environment", async () => {
    await provider.addInteraction({
      state: "Environment exists and services ready to be stopped",
      uponReceiving: "a request to stop an environment",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/environments/${environmentId}/stop`,
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: { stopRequestId: Matchers.string() },
      },
    });

    const result = await lastValueFrom(
      serviceActionsService.stopEnvironment(projectId, environmentId)
    );

    expect(result).toBeDefined();
    expect(result.stopRequestId).toBeDefined();
  });

  test("validates contract for fetching environment services status", async () => {
    await provider.addInteraction({
      state: "Environment exists and services ready to be fetched",
      uponReceiving: "a request to fetch environment services status",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/environments/${environmentId}/services/status`,
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          services: Matchers.eachLike({
            name: Matchers.string(),
            nickname: Matchers.string(),
            installationCode: Matchers.string(),
            description: Matchers.string(),
            status: Matchers.string(),
          }),
          environmentId: Matchers.string(),
        },
      },
    });

    const result = await lastValueFrom(
      serviceActionsService.fetchEnvironmentServices(projectId, environmentId)
    );

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBeDefined();
  });

  test("validates contract for excluding environment from daily shutdown", async () => {
    await provider.addInteraction({
      state: "Environment exists and can be excluded from daily shutdown",
      uponReceiving: "a request to exclude environment from daily shutdown",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/environments/${environmentId}/services/exclude-from-shutdown/true`,
      },
      willRespondWith: {
        status: 200,
      },
    });

    await expect(
      lastValueFrom(
        serviceActionsService.excludeFromDailyShutdown(
          projectId,
          environmentId,
          true
        )
      )
    ).resolves.toBeNull();
  });

  test("validates contract for fetching MX client details", async () => {
    await provider.addInteraction({
      state: "MX client details exist",
      uponReceiving: "a request to GET MX client details",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/environments/${environmentId}/mxclient-details`,
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          environmentId: Matchers.string(),
          host: Matchers.string(),
          port: Matchers.integer(),
          clientJar: {
            type: Matchers.string("ARTIFACT"),
            name: Matchers.string(),
            uri: Matchers.string(),
          },
          clientPackage: {
            type: Matchers.string("PACKAGE"),
            name: Matchers.string(),
            uri: Matchers.string(),
          },
        },
      },
    });

    const details = await lastValueFrom(
      environmentService.getMXClientDetails(projectId, environmentId)
    );

    expect(details).toBeDefined();
    expect(details.environmentId).toBeDefined();
    expect(details.host).toBeDefined();
    expect(details.port).toBeDefined();
    expect(details.clientJar).toBeDefined();
    expect(details.clientPackage).toBeDefined();
  });

  test("validates contract for fetching systematic config audit", async () => {
    await provider.addInteraction({
      state: "systematic config audit exists",
      uponReceiving: "a request to fetch systematic config audit",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/environments/${environmentId}/systematic-config-audit`,
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          operationId: Matchers.string(),
          environmentId: Matchers.string(),
          targetCommitId: Matchers.string(),
          baselineCommitId: Matchers.string(),
          requestStatus: Matchers.string("ENDED"),
          requestResultStatus: Matchers.string("SUCCESS"),
          configurationLintingResult: {
            resultStatus: Matchers.string("PASS"),
            artifacts: Matchers.eachLike(Matchers.string()),
            mode: Matchers.string("DELTA"),
          },
        },
      },
    });

    const audit = await lastValueFrom(
      systematicConfigAuditService.retrieveSystematicConfigAudit(
        projectId,
        environmentId
      )
    );

    expect(audit).toBeDefined();
    expect(audit.operationId).toBeDefined();
    expect(audit.environmentId).toBeDefined();
    expect(audit.configurationLintingResult?.artifacts.length).toBeGreaterThan(
      0
    );
  });

  test("validates contract for fetching technical reseed execution group details", async () => {
    await provider.addInteraction({
      state: "technical reseed execution group exists",
      uponReceiving:
        "a request to fetch technical reseed execution group details",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/technical-reseed-execution-groups/${reseedExecutionGroupId}`,
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          executionGroupId: Matchers.string(reseedExecutionGroupId),
          status: Matchers.string("ENABLED"),
          launchesAllowed: Matchers.boolean(true),
          technicalReseedOperations: Matchers.eachLike({
            id: Matchers.string(),
            status: Matchers.string("PASSED"),
            branch: Matchers.string(),
            sourceCommit: Matchers.string(),
            validationLevel: Matchers.string("MQG"),
            maintenanceLevel: Matchers.string("Full"),
            environmentDefinitionId: Matchers.string(),
            dumpIds: Matchers.eachLike(Matchers.string()),
            environmentId: Matchers.string(),
            createdOn: Matchers.iso8601DateTimeWithMillis(),
          }),
        },
      },
    });

    const executionGroup = await lastValueFrom(
      technicalReseedService.getExecutionGroupDetails(
        projectId,
        reseedExecutionGroupId
      )
    );

    expect(executionGroup.executionGroupId).toBeDefined();
    expect(executionGroup.technicalReseedOperations?.length).toBeGreaterThan(0);
  });

  test("validates contract for launching technical reseed", async () => {
    await provider.addInteraction({
      state: "technical reseed execution group can launch reseed",
      uponReceiving: "a request to launch technical reseed",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/technical-reseed-execution-groups/${reseedExecutionGroupId}/launch-reseed`,
        body: {
          infraGroupId: Matchers.string(),
          branch: Matchers.string(),
          configurationCommitId: Matchers.string(),
          environmentDefinitionId: Matchers.string(),
          maintenanceConfiguration: {
            full: Matchers.boolean(),
          },
          validationLevel: Matchers.string("MQG"),
          targetBranch: Matchers.string(),
        },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          requestId: Matchers.string(),
        },
      },
    });

    const response = await lastValueFrom(
      technicalReseedService.launchTechnicalReseed(
        projectId,
        reseedExecutionGroupId,
        {
          infraGroupId: "infra-group-id",
          branch: "source-branch",
          configurationCommitId: "commit-id",
          environmentDefinitionId: "env-definition-id",
          maintenanceConfiguration: { full: true },
          validationLevel: "MQG",
          targetBranch: "target-branch",
        }
      )
    );

    expect(response.requestId).toBeDefined();
  });

  function getEnviromentBodyMatcher() {
    return {
      id: Matchers.string(),
      status: Matchers.string(),
      projectId: Matchers.string(),
      createdOn: Matchers.iso8601DateTimeWithMillis(),
      outputsDirectoryUri: Matchers.string(),
      bundles: Matchers.eachLike({
        id: Matchers.string(),
        branch: Matchers.string(),
        version: Matchers.string(),
      }),
      isTools: Matchers.eachLike({
        name: Matchers.string(),
      }),
      configurationIdentifier: {
        branch: Matchers.string(),
        revision: Matchers.string(),
      },
      databases: Matchers.eachLike({
        name: Matchers.string(),
        mxDbTypes: Matchers.eachLike(Matchers.string()),
      }),
      webClientUrl: Matchers.string(),
      secureClientArtifactUri: Matchers.string(),
      environmentActions: Matchers.eachLike(Matchers.string()),
    };
  }
});
