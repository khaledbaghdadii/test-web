import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { lastValueFrom, of, throwError } from "rxjs";
import {
  GroupMetrics,
  GroupMetricsPage,
  InfraGroupsService,
  SimpleGroup,
} from "@mxflow/features/infra-management";
import {
  AddGroupRequest,
  EditGroupRequest,
  GroupFilterRequest,
} from "./request/group";
import {
  DefaultGroup,
  ProjectInfraRegistryApiResponse,
} from "./response/project-infra-registry-api-reponse";
import { CredentialsType } from "./request/credentials";
import { AppConfig, APP_CONFIG } from "@mxflow/config";
import { TestBed } from "@angular/core/testing";

describe("Service: Groups", () => {
  let service: InfraGroupsService;
  let httpClient: HttpClient;
  const GATEWAY_URL = "GATEWAY_URL/";
  const appConfig: AppConfig = {
    gatewayUrl: GATEWAY_URL,
  } as unknown as AppConfig;
  const FAILURE_MESSAGE = "FAILURE_MESSAGE";

  const HTTP_ERROR_RESPONSE = new HttpErrorResponse({
    status: 500,
    error: {
      message: FAILURE_MESSAGE,
    },
  });
  it("should get group metrics with correct url when group ids are passed", async () => {
    const groupMetricsPage = getGroupMetrics();
    httpClient = {
      get: jest.fn(() => {
        return of(groupMetricsPage);
      }),
    } as unknown as HttpClient;
    TestBed.configureTestingModule({
      providers: [
        InfraGroupsService,
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });
    service = TestBed.inject(InfraGroupsService);
    const groupId1 = "group-id-1";
    const groupId2 = "group-id-2";
    await expect(
      lastValueFrom(
        service.getGroupMetrics("projectId", 1, 0, [groupId1, groupId2])
      )
    ).resolves.toEqual(groupMetricsPage);
    expect(httpClient.get).toHaveBeenCalledWith(
      GATEWAY_URL +
        `projects/projectId/infra/management/groups/metrics?page=0&size=1&groupIds=group-id-1&groupIds=group-id-2`
    );
  });

  it("should get group metrics with correct url when no group ids are passed", async () => {
    const groupMetricsPage = getGroupMetrics();
    httpClient = {
      get: jest.fn(() => {
        return of(groupMetricsPage);
      }),
    } as unknown as HttpClient;
    TestBed.configureTestingModule({
      providers: [
        InfraGroupsService,
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });
    service = TestBed.inject(InfraGroupsService);
    await expect(
      lastValueFrom(service.getGroupMetrics("projectId", 1, 0))
    ).resolves.toEqual(groupMetricsPage);
    expect(httpClient.get).toHaveBeenCalledWith(
      GATEWAY_URL +
        `projects/projectId/infra/management/groups/metrics?page=0&size=1`
    );
  });

  it("should throw an error with correct message when fetching group metrics fails with a message", async () => {
    httpClient = {
      get: jest.fn().mockReturnValue(throwError(() => HTTP_ERROR_RESPONSE)),
    } as unknown as HttpClient;
    TestBed.configureTestingModule({
      providers: [
        InfraGroupsService,
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });
    service = TestBed.inject(InfraGroupsService);

    await expect(
      lastValueFrom(service.getGroupMetrics("projectId", 1, 0))
    ).rejects.toThrow(new Error(FAILURE_MESSAGE));
  });
  it.each([null, ""])(
    "should throw an error with correct message when fetching group metrics fails without a message",
    async (failureMessage) => {
      HTTP_ERROR_RESPONSE.error.message = failureMessage;
      httpClient = {
        get: jest.fn().mockReturnValue(throwError(() => HTTP_ERROR_RESPONSE)),
      } as unknown as HttpClient;
      TestBed.configureTestingModule({
        providers: [
          InfraGroupsService,
          { provide: HttpClient, useValue: httpClient },
          { provide: APP_CONFIG, useValue: appConfig },
        ],
      });
      service = TestBed.inject(InfraGroupsService);

      await expect(
        lastValueFrom(service.getGroupMetrics("projectId", 1, 0))
      ).rejects.toThrow(new Error("Could not fetch groups details"));
    }
  );

  it("should return all groups", async () => {
    httpClient = {
      get: jest.fn(() => {
        return of(getActualGroups());
      }),
    } as unknown as HttpClient;
    TestBed.configureTestingModule({
      providers: [
        InfraGroupsService,
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });
    service = TestBed.inject(InfraGroupsService);

    await expect(
      lastValueFrom(service.getGroups("projectId", 1, 0))
    ).resolves.toEqual(getExpectedGroups());
    expect(httpClient.get).toHaveBeenCalledWith(
      GATEWAY_URL + `projects/projectId/infra/registry/groups?page=0&size=1`
    );
  });

  it("should return correct group", async () => {
    httpClient = {
      get: jest.fn(() => {
        return of(getActualGroup());
      }),
    } as unknown as HttpClient;
    TestBed.configureTestingModule({
      providers: [
        InfraGroupsService,
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });
    service = TestBed.inject(InfraGroupsService);

    await expect(
      lastValueFrom(service.getGroup("projectId", "groupId"))
    ).resolves.toEqual(getExpectedGroup());

    expect(httpClient.get).toHaveBeenCalledWith(
      GATEWAY_URL + `projects/projectId/infra/registry/groups/groupId`
    );
  });

  it("should return filtered groups", async () => {
    httpClient = {
      post: jest.fn(() => {
        return of(getActualGroups());
      }),
    } as unknown as HttpClient;
    TestBed.configureTestingModule({
      providers: [
        InfraGroupsService,
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });
    service = TestBed.inject(InfraGroupsService);
    const body: GroupFilterRequest = { searchKey: "key", groupIds: ["grp1"] };

    await expect(
      lastValueFrom(service.searchGroups("projectId", 1, 0, body))
    ).resolves.toEqual(getExpectedGroups());

    expect(httpClient.post).toHaveBeenCalledWith(
      GATEWAY_URL +
        `projects/projectId/infra/registry/groups/filter?page=0&size=1&sort=name`,
      { searchKey: "key", groupIds: ["grp1"] }
    );
  });

  it("should delete a group", async () => {
    httpClient = {
      delete: jest.fn(() => {
        return of({ success: true });
      }),
    } as unknown as HttpClient;
    TestBed.configureTestingModule({
      providers: [
        InfraGroupsService,
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });
    service = TestBed.inject(InfraGroupsService);

    await expect(
      lastValueFrom(service.deleteGroup("projectId", "groupId"))
    ).resolves.toEqual({ success: true });

    expect(httpClient.delete).toHaveBeenCalledWith(
      GATEWAY_URL + `projects/projectId/infra/registry/groups/groupId`
    );
  });

  it("should add a group", async () => {
    httpClient = {
      post: jest.fn(() => {
        return of(addActualGroup());
      }),
    } as unknown as HttpClient;
    TestBed.configureTestingModule({
      providers: [
        InfraGroupsService,
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });
    service = TestBed.inject(InfraGroupsService);
    const group = addExpectedGroup();

    await expect(
      lastValueFrom(service.createGroup("projectId", group))
    ).resolves.toEqual(addActualGroup());

    expect(httpClient.post).toHaveBeenCalledWith(
      GATEWAY_URL + `projects/projectId/infra/registry/groups`,
      group
    );
  });

  it("should get the project config given a project id", async () => {
    httpClient = {
      get: jest.fn(() => {
        return of(getProjectInfraRegistryConfig());
      }),
    } as unknown as HttpClient;
    TestBed.configureTestingModule({
      providers: [
        InfraGroupsService,
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });
    service = TestBed.inject(InfraGroupsService);

    const actualValue = service.getProjectInfraRegistryConfig("projectId");
    await expect(lastValueFrom(actualValue)).resolves.toEqual(
      getExpectedProjectDefaultGroupConfig()
    );

    expect(httpClient.get).toHaveBeenCalledWith(
      GATEWAY_URL + `projects/projectId/infra/registry/config`
    );
  });

  it("should update a group", async () => {
    const group_id = "groupId";
    const group_name = "groupName";
    const machineIds = ["machine1", "machine2"];
    httpClient = {
      put: jest.fn(() => {
        return of(editActualGroup(group_id, group_name, machineIds));
      }),
    } as unknown as HttpClient;
    TestBed.configureTestingModule({
      providers: [
        InfraGroupsService,
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });
    service = TestBed.inject(InfraGroupsService);
    const group = editExpectedGroup(group_name, machineIds);

    await expect(
      lastValueFrom(service.editGroup("projectId", group_id, group))
    ).resolves.toEqual(editActualGroup(group_id, group_name, machineIds));

    expect(httpClient.put).toHaveBeenCalledWith(
      GATEWAY_URL + `projects/projectId/infra/registry/groups/` + group_id,
      group
    );
  });

  describe("update credentials", () => {
    const mockRequest = getMockUpdateGroupCredentialsRequest();
    const mockResponse = getMockUpdateGroupCredentialsResponse();
    const mockProjectId = "projectId";
    const mockGroupId = "groupId";
    let httpClient: HttpClient;
    let service: InfraGroupsService;

    beforeEach(() => {
      httpClient = {
        put: jest.fn(() => {
          return of(mockResponse);
        }),
      } as unknown as HttpClient;
      TestBed.configureTestingModule({
        providers: [
          InfraGroupsService,
          { provide: HttpClient, useValue: httpClient },
          { provide: APP_CONFIG, useValue: appConfig },
        ],
      });
      service = TestBed.inject(InfraGroupsService);
    });

    it("should update default ssh credentials", async () => {
      service
        .updateGroupDefaultSshCredentials(
          mockProjectId,
          mockGroupId,
          mockRequest
        )
        .subscribe((data) => {
          expect(data).toEqual(mockResponse);
        });
      expect(httpClient.put).toHaveBeenCalledWith(
        GATEWAY_URL +
          `projects/${mockProjectId}/infra/registry/groups/${mockGroupId}/default-ssh-credentials`,
        mockRequest
      );
    });

    it("should update default MSSQL credentials", async () => {
      service
        .updateGroupDefaultMssqlCredentials(
          mockProjectId,
          mockGroupId,
          mockRequest
        )
        .subscribe((data) => {
          expect(data).toEqual(mockResponse);
        });

      expect(httpClient.put).toHaveBeenCalledWith(
        GATEWAY_URL +
          `projects/${mockProjectId}/infra/registry/groups/${mockGroupId}/default-mssql-admin-credentials`,
        mockRequest
      );
    });

    it("should update default Oracle credentials", async () => {
      service
        .updateGroupDefaultOracleCredentials(
          mockProjectId,
          mockGroupId,
          mockRequest
        )
        .subscribe((data) => {
          expect(data).toEqual(mockResponse);
        });

      expect(httpClient.put).toHaveBeenCalledWith(
        GATEWAY_URL +
          `projects/${mockProjectId}/infra/registry/groups/${mockGroupId}/default-oracle-admin-credentials`,
        mockRequest
      );
    });

    it("should update default Postgres credentials", async () => {
      service
        .updateGroupDefaultPostgresCredentials(
          mockProjectId,
          mockGroupId,
          mockRequest
        )
        .subscribe((data) => {
          expect(data).toEqual(mockResponse);
        });

      expect(httpClient.put).toHaveBeenCalledWith(
        GATEWAY_URL +
          `projects/${mockProjectId}/infra/registry/groups/${mockGroupId}/default-postgres-admin-credentials`,
        mockRequest
      );
    });

    it("should update default Sybase credentials", async () => {
      service
        .updateGroupDefaultSybaseCredentials(
          mockProjectId,
          mockGroupId,
          mockRequest
        )
        .subscribe((data) => {
          expect(data).toEqual(mockResponse);
        });

      expect(httpClient.put).toHaveBeenCalledWith(
        GATEWAY_URL +
          `projects/${mockProjectId}/infra/registry/groups/${mockGroupId}/default-sybase-admin-credentials`,
        mockRequest
      );
    });
  });

  describe("remove credentials", () => {
    const mockProjectId = "projectId";
    const mockGroupId = "groupId";
    let httpClient: HttpClient;
    let service: InfraGroupsService;

    beforeEach(() => {
      httpClient = {
        get: jest.fn(() => {
          return of(getProjectInfraRegistryConfig());
        }),
        delete: jest.fn(() => {
          return of({});
        }),
      } as unknown as HttpClient;
      TestBed.configureTestingModule({
        providers: [
          InfraGroupsService,
          { provide: HttpClient, useValue: httpClient },
          { provide: APP_CONFIG, useValue: appConfig },
        ],
      });
      service = TestBed.inject(InfraGroupsService);
    });

    it("should remove default ssh credentials", async () => {
      service
        .removeGroupDefaultSshCredentials(mockProjectId, mockGroupId)
        .subscribe((data) => {
          expect(data).toEqual({});
        });
      expect(httpClient.delete).toHaveBeenCalledWith(
        GATEWAY_URL +
          `projects/${mockProjectId}/infra/registry/groups/${mockGroupId}/default-ssh-credentials`
      );
    });

    it("should remove default MSSQL credentials", async () => {
      service
        .removeGroupDefaultMssqlCredentials(mockProjectId, mockGroupId)
        .subscribe((data) => {
          expect(data).toEqual({});
        });
      expect(httpClient.delete).toHaveBeenCalledWith(
        GATEWAY_URL +
          `projects/${mockProjectId}/infra/registry/groups/${mockGroupId}/default-mssql-admin-credentials`
      );
    });

    it("should remove default Oracle credentials", async () => {
      service
        .removeGroupDefaultOracleCredentials(mockProjectId, mockGroupId)
        .subscribe((data) => {
          expect(data).toEqual({});
        });
      expect(httpClient.delete).toHaveBeenCalledWith(
        GATEWAY_URL +
          `projects/${mockProjectId}/infra/registry/groups/${mockGroupId}/default-oracle-admin-credentials`
      );
    });

    it("should remove default Postgres credentials", async () => {
      service
        .removeGroupDefaultPostgresCredentials(mockProjectId, mockGroupId)
        .subscribe((data) => {
          expect(data).toEqual({});
        });
      expect(httpClient.delete).toHaveBeenCalledWith(
        GATEWAY_URL +
          `projects/${mockProjectId}/infra/registry/groups/${mockGroupId}/default-postgres-admin-credentials`
      );
    });

    it("should remove default Sybase credentials", async () => {
      service
        .removeGroupDefaultSybaseCredentials(mockProjectId, mockGroupId)
        .subscribe((data) => {
          expect(data).toEqual({});
        });
      expect(httpClient.delete).toHaveBeenCalledWith(
        GATEWAY_URL +
          `projects/${mockProjectId}/infra/registry/groups/${mockGroupId}/default-sybase-admin-credentials`
      );
    });
  });

  function getActualGroups() {
    return {
      content: [
        {
          id: "04d9eae8-e7ae-405d-b09b-81e803f54b18",
          projectId: "1",
          name: "string19",
          defaultSshCredentials: {
            isInherited: false,
          },
        },
        {
          id: "f78c4be8-fb79-428b-abb0-2c1e60956b66",
          projectId: "1",
          name: "string2",
          defaultSshCredentials: {
            isInherited: false,
          },
        },
        {
          id: "31f1f725-d44e-46bc-be21-effb03781d09",
          projectId: "1",
          name: "string20",
          defaultSshCredentials: {
            isInherited: false,
          },
        },
        {
          id: "1959b93d-454b-4c74-bf73-3c201dfca70c",
          projectId: "1",
          name: "string21",
          defaultSshCredentials: {
            isInherited: false,
          },
        },
        {
          id: "3a0d41c6-9325-4b74-8653-eb2c738146db",
          projectId: "1",
          name: "string22",
          defaultSshCredentials: {
            isInherited: false,
          },
          machines: [
            {
              id: "5e01e258-2c3f-4fe0-ba93-d81acddb4e4b",
              name: "string",
              projectId: "1",
              type: "physical",
            },
          ],
        },
      ],
      totalElements: 23,
      totalPages: 5,
      last: false,
      size: 5,
      number: 2,
      first: false,
      numberOfElements: 5,
    };
  }

  function getGroupMetrics(): GroupMetricsPage {
    const SIMPLE_GROUP_1: SimpleGroup = {
      id: "group-id-1",
      name: "Group 1",
      projectId: "PROJECT_ID",
    };
    const SIMPLE_GROUP_2: SimpleGroup = {
      id: "group-id-2",
      name: "Group 2",
      projectId: "PROJECT_ID",
    };
    const groupMetrics1: GroupMetrics = {
      id: "GROUP_METRICS_ID_1",
      group: SIMPLE_GROUP_1,
      lastSyncedOn: new Date(),
      allocationRequest: { infraFamily: { id: "f1", name: "Family 1" } },
    };

    const groupMetrics2: GroupMetrics = {
      id: "GROUP_METRICS_ID_2",
      group: SIMPLE_GROUP_2,
      lastSyncedOn: new Date(),
      allocationRequest: { infraFamily: { id: "f1", name: "Family 1" } },
    };

    return {
      content: [groupMetrics1, groupMetrics2],
      size: 2,
      number: 0,
      totalPages: 1,
      totalElements: 2,
      last: true,
    };
  }

  function getExpectedGroups() {
    return {
      content: [
        {
          id: "04d9eae8-e7ae-405d-b09b-81e803f54b18",
          projectId: "1",
          name: "string19",
          defaultSshCredentials: {
            isInherited: false,
          },
        },
        {
          id: "f78c4be8-fb79-428b-abb0-2c1e60956b66",
          projectId: "1",
          name: "string2",
          defaultSshCredentials: {
            isInherited: false,
          },
        },
        {
          id: "31f1f725-d44e-46bc-be21-effb03781d09",
          projectId: "1",
          name: "string20",
          defaultSshCredentials: {
            isInherited: false,
          },
        },
        {
          id: "1959b93d-454b-4c74-bf73-3c201dfca70c",
          projectId: "1",
          name: "string21",
          defaultSshCredentials: {
            isInherited: false,
          },
        },
        {
          id: "3a0d41c6-9325-4b74-8653-eb2c738146db",
          projectId: "1",
          name: "string22",
          defaultSshCredentials: {
            isInherited: false,
          },
          machines: [
            {
              id: "5e01e258-2c3f-4fe0-ba93-d81acddb4e4b",
              name: "string",
              projectId: "1",
              type: "physical",
            },
          ],
        },
      ],
      totalElements: 23,
      totalPages: 5,
      last: false,
      size: 5,
      number: 2,
      first: false,
      numberOfElements: 5,
    };
  }

  function getActualGroup() {
    return {
      id: "3a0d41c6-9325-4b74-8653-eb2c738146db",
      projectId: "1",
      name: "string22",
      defaultSshCredentials: {
        isInherited: false,
      },
      machines: [
        {
          id: "5e01e258-2c3f-4fe0-ba93-d81acddb4e4b",
          name: "string",
          projectId: "1",
          type: "physical",
        },
      ],
    };
  }

  function editExpectedGroup(
    groupName: string,
    machines: string[]
  ): EditGroupRequest {
    return {
      name: groupName,
      machineIds: machines,
    };
  }

  function editActualGroup(
    groupId: string,
    groupName: string,
    machines: string[]
  ) {
    return {
      id: groupId,
      name: groupName,
      machineIds: machines,
    };
  }

  function getExpectedGroup() {
    return {
      id: "3a0d41c6-9325-4b74-8653-eb2c738146db",
      projectId: "1",
      name: "string22",
      defaultSshCredentials: {
        isInherited: false,
      },
      machines: [
        {
          id: "5e01e258-2c3f-4fe0-ba93-d81acddb4e4b",
          name: "string",
          projectId: "1",
          type: "physical",
        },
      ],
    };
  }

  function addExpectedGroup(): AddGroupRequest {
    return {
      name: "Test Group",
      machineIds: ["machine1", "machine2"],
    };
  }

  function addActualGroup() {
    return {
      id: "groupId",
      name: "Test Group",
      machineIds: ["machine1", "machine2"],
    };
  }

  function getExpectedProjectDefaultGroupConfig(): DefaultGroup {
    return {
      id: "c975e1c2-133d-4746-b6d7-32dea7d66bf1",
      name: "oraclesybasegroup",
      projectId: "projectId",
    };
  }

  function getProjectInfraRegistryConfig(): ProjectInfraRegistryApiResponse {
    return {
      createdOn: "2023-10-16T09:51:30.250606Z",
      lastModifiedOn: "2023-10-17T15:06:43.013324Z",
      createdBy: "mxflow-dev-admin",
      lastModifiedBy: "mxflow-dev-admin",
      projectId: "projectId",
      defaultInfraPlugin: "murex",
      defaultAllocationRetryDelay: 60,
      defaultGroup: {
        id: "c975e1c2-133d-4746-b6d7-32dea7d66bf1",
        name: "oraclesybasegroup",
        projectId: "projectId",
      },
    };
  }

  function getMockUpdateGroupCredentialsRequest() {
    return {
      credentials: {
        username: "autoengine",
        password: "",
        type: CredentialsType.USERNAME_PASSWORD_CREDENTIALS,
      },
    };
  }

  function getMockUpdateGroupCredentialsResponse() {
    return {
      uri: "credentials_uri",
    };
  }
});
