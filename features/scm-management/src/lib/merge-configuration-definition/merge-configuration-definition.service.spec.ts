import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { firstValueFrom, of, throwError } from "rxjs";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { MergeConfigurationDefinitionService } from "./merge-configuration-definition.service";
import { MergeConfigurationDefinitionCreateRequest } from "./model/request/merge-configuration-definition-create-request";
import { MergeConfigurationDefinitionUpdateRequest } from "./model/request/merge-configuration-definition-update-request";
import { MergeConfigurationDefinitionFilterRequest } from "./model/request/merge-configuration-definition-filter-request";
import { MergeConfigurationDefinitionApiPage } from "./model/response/merge-configuration-definition-api-page";
import { MergeConfigurationDefinitionApiResponse } from "./model/response/merge-configuration-definition-api-response";
import { InfraResourceSettingsApiResponse } from "./model/response/infra-resource-settings-api-response";

describe("Service: MergeConfigurationDefinitionService", () => {
  const GATEWAY_URL = "https://gateway.cd.murex.com/api/v1/";
  const PROJECT_ID = "projectId";
  const BRANCH_PATTERN = "release/*";
  const REPOSITORY_ID = "repoId";
  const AUTOMERGE_TIMEOUT = 1;
  const DEFINITION_ID = "definitionId";
  const SCENARIO_DEFINITION_ID = "scenarioDefinitionId";
  const INFRA_GROUP_ID = "infraGroupId";
  const DEFAULT_PAGE_INDEX = 0;
  const DEFAULT_PAGE_SIZE = 20;

  let service: MergeConfigurationDefinitionService;
  let httpClient: HttpClient;
  let appConfig: AppConfig;

  const mockDefinition: MergeConfigurationDefinitionApiResponse = {
    id: DEFINITION_ID,
    projectId: PROJECT_ID,
    repository: {
      id: REPOSITORY_ID,
    },
    branchPattern: BRANCH_PATTERN,
    scenarioDefinitionId: SCENARIO_DEFINITION_ID,
    automergeEnabled: true,
    automergeTimeout: AUTOMERGE_TIMEOUT,
    automergeBulkEnabled: true,
    automergeBulkSize: 3,
    runFullMaintenance: true,
    deltaConfigImportEnabled: true,
    infraResourceSettings: {
      infraGroupId: INFRA_GROUP_ID,
      maxNumberOfFailedEnvironmentsToKeep: 5,
    },
  };

  beforeEach(() => {
    appConfig = { gatewayUrl: GATEWAY_URL } as AppConfig;
    httpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    } as unknown as HttpClient;

    TestBed.configureTestingModule({
      providers: [
        MergeConfigurationDefinitionService,
        { provide: APP_CONFIG, useValue: appConfig },
        { provide: HttpClient, useValue: httpClient },
      ],
    });

    service = TestBed.inject(MergeConfigurationDefinitionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllMergeConfigurationDefinitions", () => {
    const expectedUrl = `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/settings/merge-configuration-definitions`;

    it("should get all merge configuration definitions with default pagination", async () => {
      const mockPage: MergeConfigurationDefinitionApiPage = {
        content: [mockDefinition],
        totalPages: 1,
        totalElements: 1,
        size: DEFAULT_PAGE_SIZE,
        number: DEFAULT_PAGE_INDEX,
        last: true,
      };

      jest.spyOn(httpClient, "get").mockReturnValue(of(mockPage));

      const data = await firstValueFrom(
        service.getAllMergeConfigurationDefinitions(PROJECT_ID)
      );

      expect(data).toEqual(mockPage);
      expect(httpClient.get).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          params: expect.any(HttpParams),
        })
      );
    });

    it("should get all merge configuration definitions with custom pagination", async () => {
      const pageSize = 10;
      const pageIndex = 2;
      const mockPage: MergeConfigurationDefinitionApiPage = {
        content: [mockDefinition],
        totalPages: 5,
        totalElements: 50,
        size: pageSize,
        number: pageIndex,
        last: false,
      };

      jest.spyOn(httpClient, "get").mockReturnValue(of(mockPage));

      const data = await firstValueFrom(
        service.getAllMergeConfigurationDefinitions(
          PROJECT_ID,
          pageSize,
          pageIndex
        )
      );

      expect(data).toEqual(mockPage);
      expect(httpClient.get).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          params: expect.any(HttpParams),
        })
      );
    });

    it("should handle errors when fetching all definitions", async () => {
      const errorResponse = new HttpErrorResponse({
        error: { message: "Server error" },
        status: 500,
        statusText: "Internal Server Error",
      });

      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        firstValueFrom(service.getAllMergeConfigurationDefinitions(PROJECT_ID))
      ).rejects.toThrow();

      await expect(
        firstValueFrom(service.getAllMergeConfigurationDefinitions(PROJECT_ID))
      ).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining("Server error"),
        })
      );
    });
  });

  describe("addMergeConfigurationDefinition", () => {
    const expectedUrl = `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/settings/merge-configuration-definitions`;

    const createRequest: MergeConfigurationDefinitionCreateRequest = {
      repositoryId: REPOSITORY_ID,
      branchPattern: BRANCH_PATTERN,
      scenarioDefinitionId: SCENARIO_DEFINITION_ID,
      automergeEnabled: true,
      automergeTimeout: AUTOMERGE_TIMEOUT,
      automergeBulkEnabled: true,
      automergeBulkSize: 3,
      runFullMaintenance: true,
      deltaConfigImportEnabled: true,
      infraResourceSettings: {
        infraGroupId: INFRA_GROUP_ID,
        maxNumberOfFailedEnvironmentsToKeep: 5,
      },
    };

    it("should create a merge configuration definition", async () => {
      jest.spyOn(httpClient, "post").mockReturnValue(of(mockDefinition));

      const data = await firstValueFrom(
        service.addMergeConfigurationDefinition(PROJECT_ID, createRequest)
      );

      expect(data).toEqual(mockDefinition);
      expect(httpClient.post).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          repositoryId: REPOSITORY_ID,
          branchPattern: BRANCH_PATTERN,
          infraResourceSettings: expect.objectContaining({
            projectId: PROJECT_ID,
            infraGroupId: INFRA_GROUP_ID,
          }),
        })
      );
    });

    it("should handle validation errors with field-specific messages", async () => {
      const errorResponse = new HttpErrorResponse({
        error: {
          errors: {
            branchPattern: "Branch pattern is invalid",
            repositoryId: "Repository not found",
          },
          message: "Validation failed",
        },
        status: 400,
      });

      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(throwError(() => errorResponse));

      const errorPromise = firstValueFrom(
        service.addMergeConfigurationDefinition(PROJECT_ID, createRequest)
      );

      await expect(errorPromise).rejects.toThrow(Error);
      await expect(errorPromise).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringMatching(
            /branchPattern.*Branch pattern is invalid/s
          ),
        })
      );
      await expect(errorPromise).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringMatching(/repositoryId.*Repository not found/s),
        })
      );
    });

    it("should handle server error with message", async () => {
      const errorResponse = new HttpErrorResponse({
        error: { message: "Internal server error occurred" },
        status: 500,
      });

      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        firstValueFrom(
          service.addMergeConfigurationDefinition(PROJECT_ID, createRequest)
        )
      ).rejects.toThrow("Internal server error occurred");
    });

    it("should handle network errors", async () => {
      const errorResponse = new HttpErrorResponse({
        error: new ErrorEvent("Network error", {
          message: "Connection failed",
        }),
        status: 0,
      });

      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(throwError(() => errorResponse));

      const errorPromise = firstValueFrom(
        service.addMergeConfigurationDefinition(PROJECT_ID, createRequest)
      );

      await expect(errorPromise).rejects.toThrow(Error);
      await expect(errorPromise).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining("Network error"),
        })
      );
      await expect(errorPromise).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining("Connection failed"),
        })
      );
    });

    it("should handle errors without message or errors object", async () => {
      const errorResponse = new HttpErrorResponse({
        error: {},
        status: 500,
        statusText: "Internal Server Error",
      });

      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        firstValueFrom(
          service.addMergeConfigurationDefinition(PROJECT_ID, createRequest)
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining("Request failed"),
        })
      );
    });
  });

  describe("updateMergeConfigurationDefinition", () => {
    const updateRequest: MergeConfigurationDefinitionUpdateRequest = {
      id: DEFINITION_ID,
      scenarioDefinitionId: "newScenarioId",
      automergeEnabled: false,
      automergeTimeout: 2,
      automergeBulkEnabled: false,
      automergeBulkSize: 5,
      runFullMaintenance: false,
      deltaConfigImportEnabled: false,
      infraResourceSettings: {
        infraGroupId: "newInfraGroupId",
        maxNumberOfFailedEnvironmentsToKeep: 10,
      },
    };

    const expectedUrl = `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/settings/merge-configuration-definitions/${DEFINITION_ID}`;

    it("should update a merge configuration definition", async () => {
      const updatedDefinition = { ...mockDefinition, ...updateRequest };
      jest.spyOn(httpClient, "put").mockReturnValue(of(updatedDefinition));

      const data = await firstValueFrom(
        service.updateMergeConfigurationDefinition(PROJECT_ID, updateRequest)
      );

      expect(data).toEqual(updatedDefinition);
      expect(httpClient.put).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          scenarioDefinitionId: "newScenarioId",
          automergeEnabled: false,
          infraResourceSettings: expect.objectContaining({
            projectId: PROJECT_ID,
            infraGroupId: "newInfraGroupId",
          }),
        })
      );
    });

    it("should handle update errors", async () => {
      const errorResponse = new HttpErrorResponse({
        error: {
          errors: { scenarioDefinitionId: "Scenario not found" },
        },
        status: 404,
      });

      jest
        .spyOn(httpClient, "put")
        .mockReturnValue(throwError(() => errorResponse));

      const errorPromise = firstValueFrom(
        service.updateMergeConfigurationDefinition(PROJECT_ID, updateRequest)
      );

      await expect(errorPromise).rejects.toThrow(Error);
      await expect(errorPromise).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining("scenarioDefinitionId"),
        })
      );
      await expect(errorPromise).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining("Scenario not found"),
        })
      );
    });
  });

  describe("deleteMergeConfigurationDefinition", () => {
    const expectedUrl = `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/settings/merge-configuration-definitions/${DEFINITION_ID}`;

    it("should delete a merge configuration definition", async () => {
      jest.spyOn(httpClient, "delete").mockReturnValue(of(void 0));

      const data = await firstValueFrom(
        service.deleteMergeConfigurationDefinition(PROJECT_ID, DEFINITION_ID)
      );

      expect(data).toBeUndefined();
      expect(httpClient.delete).toHaveBeenCalledWith(expectedUrl);
    });

    it("should handle delete errors", async () => {
      const errorResponse = new HttpErrorResponse({
        error: { message: "Definition not found" },
        status: 404,
      });

      jest
        .spyOn(httpClient, "delete")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        firstValueFrom(
          service.deleteMergeConfigurationDefinition(PROJECT_ID, DEFINITION_ID)
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining("Definition not found"),
        })
      );
    });
  });

  describe("getFilteredMergeConfigurationDefinitions", () => {
    const filterRequest: MergeConfigurationDefinitionFilterRequest = {
      searchKey: "test",
      repositoryId: REPOSITORY_ID,
    };

    const expectedUrl = `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/settings/merge-configuration-definitions/filter`;

    it("should get filtered merge configuration definitions", async () => {
      const mockPage: MergeConfigurationDefinitionApiPage = {
        content: [mockDefinition],
        totalPages: 1,
        totalElements: 1,
        size: DEFAULT_PAGE_SIZE,
        number: DEFAULT_PAGE_INDEX,
        last: true,
      };

      jest.spyOn(httpClient, "post").mockReturnValue(of(mockPage));

      const data = await firstValueFrom(
        service.getFilteredMergeConfigurationDefinitions(
          PROJECT_ID,
          filterRequest
        )
      );

      expect(data).toEqual(mockPage);
      expect(httpClient.post).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          searchKey: "test",
          repositoryId: REPOSITORY_ID,
        }),
        expect.objectContaining({
          params: expect.any(HttpParams),
        })
      );
    });

    it("should get filtered definitions with custom pagination", async () => {
      const pageSize = 5;
      const pageIndex = 1;
      const mockPage: MergeConfigurationDefinitionApiPage = {
        content: [mockDefinition],
        totalPages: 2,
        totalElements: 10,
        size: pageSize,
        number: pageIndex,
        last: false,
      };

      jest.spyOn(httpClient, "post").mockReturnValue(of(mockPage));

      const data = await firstValueFrom(
        service.getFilteredMergeConfigurationDefinitions(
          PROJECT_ID,
          filterRequest,
          pageSize,
          pageIndex
        )
      );

      expect(data).toEqual(mockPage);
      expect(httpClient.post).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          searchKey: "test",
          repositoryId: REPOSITORY_ID,
        }),
        expect.objectContaining({
          params: expect.any(HttpParams),
        })
      );
    });

    it("should handle filter errors", async () => {
      const errorResponse = new HttpErrorResponse({
        error: { message: "Invalid filter criteria" },
        status: 400,
      });

      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        firstValueFrom(
          service.getFilteredMergeConfigurationDefinitions(
            PROJECT_ID,
            filterRequest
          )
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining("Invalid filter criteria"),
        })
      );
    });
  });

  describe("getInfraResourceSettingsByInfraGroupIds", () => {
    const groupIds = ["group1", "group2"];
    const expectedUrl = `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/settings/merge-configuration-definitions/infra-resource-settings`;

    const apiResponse: InfraResourceSettingsApiResponse[] = [
      {
        infraGroupId: "group1",
        maxNumberOfFailedEnvironmentsToKeep: 5,
      },
      {
        infraGroupId: "group2",
        maxNumberOfFailedEnvironmentsToKeep: 10,
      },
    ];

    it("should fetch and map infra resource settings", async () => {
      jest.spyOn(httpClient, "get").mockReturnValue(of(apiResponse));

      const data = await firstValueFrom(
        service.getInfraResourceSettingsByInfraGroupIds(PROJECT_ID, groupIds)
      );

      expect(data).toEqual([
        {
          infraGroupId: "group1",
          maxNumberOfFailedEnvironmentsToKeep: 5,
        },
        {
          infraGroupId: "group2",
          maxNumberOfFailedEnvironmentsToKeep: 10,
        },
      ]);
      expect(httpClient.get).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          params: expect.any(HttpParams),
        })
      );
    });

    it("should handle errors when fetching infra resource settings", async () => {
      const errorResponse = new HttpErrorResponse({
        error: { message: "Groups not found" },
        status: 404,
      });

      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        firstValueFrom(
          service.getInfraResourceSettingsByInfraGroupIds(PROJECT_ID, groupIds)
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining("Groups not found"),
        })
      );
    });

    it("should handle network errors for infra resource settings", async () => {
      const errorResponse = new HttpErrorResponse({
        error: new ErrorEvent("Network error", {
          message: "Network unavailable",
        }),
        status: 0,
      });

      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        firstValueFrom(
          service.getInfraResourceSettingsByInfraGroupIds(PROJECT_ID, groupIds)
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining("Network error"),
        })
      );
    });
  });
});
