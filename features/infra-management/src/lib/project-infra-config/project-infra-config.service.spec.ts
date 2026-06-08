import { EditProjectInfraConfigRequest } from "./request/project-infra-config";
import { TestBed } from "@angular/core/testing";
import { CredentialsUri } from "./model/credentials-uri";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";

import {
  CredentialsType,
  UpdateCredentialsRequest,
} from "./request/credentials";
import { APP_CONFIG } from "@mxflow/config";
import { ProjectInfraConfigService } from "./project-infra-config.service";
import { ProjectInfraConfig } from "./model/project-infra-config";
import { provideHttpClient } from "@angular/common/http";

describe("Service: Settings", () => {
  const projectId = "projectId";
  const GATEWAY_URL = "https://example.com/api/";
  let service: ProjectInfraConfigService;
  let httpTestingController: HttpTestingController;

  const updateCredentialsRequest: UpdateCredentialsRequest = {
    credentials: {
      username: "username",
      password: "password",
      type: CredentialsType.USERNAME_PASSWORD_CREDENTIALS,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProjectInfraConfigService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ProjectInfraConfigService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe("getProjectInfraConfig", () => {
    it("should return correct project", () => {
      const expectedProjectInfraConfig = getProjectConfig();

      service
        .getProjectInfraConfig(projectId)
        .subscribe((actualProjectInfraConfigConfig) => {
          expect(actualProjectInfraConfigConfig).toEqual(
            expectedProjectInfraConfig
          );
        });
      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL + `projects/` + projectId + `/infra/registry/config`
      );
      expect(testRequest.request.method).toBe("GET");
      testRequest.flush(getProjectConfig());
    });

    it("should handle error response from server", () => {
      const errorResponse = { status: 404, message: "Not Found" };
      const emsg = "deliberate 404 error";

      service.getProjectInfraConfig(projectId).subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
        },
      });

      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL + `projects/` + projectId + `/infra/registry/config`
      );
      expect(testRequest.request.method).toBe("GET");
      testRequest.flush(emsg, { status: 404, statusText: "Not Found" });
    });
  });

  describe("editProjectInfraConfig", () => {
    const editProjectInfraConfigRequest: EditProjectInfraConfigRequest = {
      defaultGroupId: "group1",
      defaultInfraPlugin: "murex",
      defaultAllocationRetryDelay: 90,
      groupAllocationNearCapacityThreshold: 80,
    };
    it("should edit project infra config", () => {
      const expectedProjectInfraConfig = getEditedProjectInfraConfig();

      service
        .editProjectInfraConfig(projectId, editProjectInfraConfigRequest)
        .subscribe((data) => {
          expect(data).toEqual(expectedProjectInfraConfig);
        });

      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL + `projects/` + projectId + `/infra/registry/config`
      );
      expect(testRequest.request.method).toBe("PUT");
      testRequest.flush(getEditedProjectInfraConfig());
    });

    it("should handle error response from server", () => {
      const errorResponse = {
        status: 500,
        message: "",
        error: { message: "" },
      };
      const emsg = "deliberate 500 internal server error";

      service
        .editProjectInfraConfig(projectId, editProjectInfraConfigRequest)
        .subscribe({
          error: (error) => {
            expect(error).toEqual(errorResponse);
          },
        });
      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL + "projects/" + projectId + "/infra/registry/config"
      );
      expect(testRequest.request.method).toBe("PUT");
      testRequest.flush(emsg, { status: 500, statusText: "" });
    });
  });

  describe("updateProjectDefaultSshCredentials", () => {
    it("should update project ssh credentials", () => {
      const expectedCredentials = getExpectedCredentials();
      service
        .updateProjectDefaultSshCredentials(projectId, updateCredentialsRequest)
        .subscribe((data) => {
          expect(data).toEqual(expectedCredentials);
        });

      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-ssh-credentials`
      );
      expect(testRequest.request.method).toBe("PUT");
      testRequest.flush(expectedCredentials);
    });

    it("should handle error response from server", () => {
      const errorResponse = {
        status: 500,
        message: "",
        error: { message: "" },
      };
      const emsg = "deliberate 500 internal server error";

      service
        .updateProjectDefaultSshCredentials(projectId, updateCredentialsRequest)
        .subscribe({
          error: (error) => {
            expect(error).toEqual(errorResponse);
          },
        });

      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-ssh-credentials`
      );

      expect(testRequest.request.method).toBe("PUT");
      testRequest.flush(emsg, { status: 500, statusText: "" });
    });
  });

  describe("updateProjectDefaultMssqlCredentials", () => {
    it("should update project MSSQL credentials", () => {
      const expectedCredentials = getExpectedCredentials();
      service
        .updateProjectDefaultMssqlCredentials(
          projectId,
          updateCredentialsRequest
        )
        .subscribe((data) => {
          expect(data).toEqual(expectedCredentials);
        });

      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-mssql-admin-credentials`
      );
      expect(testRequest.request.method).toBe("PUT");
      testRequest.flush(expectedCredentials);
    });

    it("should handle error response from server", () => {
      const errorResponse = {
        status: 500,
        message: "",
        error: { message: "" },
      };
      const emsg = "deliberate 500 internal server error";

      service
        .updateProjectDefaultMssqlCredentials(
          projectId,
          updateCredentialsRequest
        )
        .subscribe({
          error: (error) => {
            expect(error).toEqual(errorResponse);
          },
        });

      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-mssql-admin-credentials`
      );

      expect(testRequest.request.method).toBe("PUT");
      testRequest.flush(emsg, { status: 500, statusText: "" });
    });
  });

  describe("updateProjectDefaultOracleCredentials", () => {
    it("should update project Oracle credentials", () => {
      const expectedCredentials = getExpectedCredentials();
      service
        .updateProjectDefaultOracleCredentials(
          projectId,
          updateCredentialsRequest
        )
        .subscribe((data) => {
          expect(data).toEqual(expectedCredentials);
        });

      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-oracle-admin-credentials`
      );
      expect(testRequest.request.method).toBe("PUT");
      testRequest.flush(expectedCredentials);
    });

    it("should handle error response from server", () => {
      const errorResponse = {
        status: 500,
        message: "",
        error: { message: "" },
      };
      const emsg = "deliberate 500 internal server error";

      service
        .updateProjectDefaultOracleCredentials(
          projectId,
          updateCredentialsRequest
        )
        .subscribe({
          error: (error) => {
            expect(error).toEqual(errorResponse);
          },
        });

      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-oracle-admin-credentials`
      );

      expect(testRequest.request.method).toBe("PUT");
      testRequest.flush(emsg, { status: 500, statusText: "" });
    });
  });

  describe("updateProjectDefaultPostgresCredentials", () => {
    it("should update project Postgres credentials", () => {
      const expectedCredentials = getExpectedCredentials();
      service
        .updateProjectDefaultPostgresCredentials(
          projectId,
          updateCredentialsRequest
        )
        .subscribe((data) => {
          expect(data).toEqual(expectedCredentials);
        });

      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-postgres-admin-credentials`
      );
      expect(testRequest.request.method).toBe("PUT");
      testRequest.flush(expectedCredentials);
    });

    it("should handle error response from server", () => {
      const errorResponse = {
        status: 500,
        message: "",
        error: { message: "" },
      };
      const emsg = "deliberate 500 internal server error";

      service
        .updateProjectDefaultPostgresCredentials(
          projectId,
          updateCredentialsRequest
        )
        .subscribe({
          error: (error) => {
            expect(error).toEqual(errorResponse);
          },
        });

      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-postgres-admin-credentials`
      );

      expect(testRequest.request.method).toBe("PUT");
      testRequest.flush(emsg, { status: 500, statusText: "" });
    });
  });

  describe("updateProjectDefaultSybaseCredentials", () => {
    it("should update project Sybase credentials", () => {
      const expectedCredentials = getExpectedCredentials();
      service
        .updateProjectDefaultSybaseCredentials(
          projectId,
          updateCredentialsRequest
        )
        .subscribe((data) => {
          expect(data).toEqual(expectedCredentials);
        });

      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-sybase-admin-credentials`
      );
      expect(testRequest.request.method).toBe("PUT");
      testRequest.flush(expectedCredentials);
    });

    it("should handle error response from server", () => {
      const errorResponse = {
        status: 500,
        message: "",
        error: { message: "" },
      };
      const emsg = "deliberate 500 internal server error";

      service
        .updateProjectDefaultSybaseCredentials(
          projectId,
          updateCredentialsRequest
        )
        .subscribe({
          error: (error) => {
            expect(error).toEqual(errorResponse);
          },
        });

      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-sybase-admin-credentials`
      );

      expect(testRequest.request.method).toBe("PUT");
      testRequest.flush(emsg, { status: 500, statusText: "" });
    });
  });

  describe("removeProjectDefaultSshCredentials", () => {
    it("should remove project SSH credentials", () => {
      const expectedResponse = {};
      service
        .removeProjectDefaultSshCredentials(projectId)
        .subscribe((data) => {
          expect(data).toEqual(expectedResponse);
        });
      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-ssh-credentials`
      );
      expect(testRequest.request.method).toBe("DELETE");
      testRequest.flush(expectedResponse);
    });

    it("should handle error response from server", () => {
      const errorResponse = { status: 500, message: "Internal Server Error" };
      const emsg = "deliberate 500 internal server error";

      service.removeProjectDefaultSshCredentials(projectId).subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
        },
      });
      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-ssh-credentials`
      );
      expect(testRequest.request.method).toBe("DELETE");
      testRequest.flush(emsg, { status: 500, statusText: "" });
    });
  });

  describe("removeProjectDefaultMssqlCredentials", () => {
    it("should remove project MSSQL credentials", () => {
      const expectedResponse = {};
      service
        .removeProjectDefaultMssqlCredentials(projectId)
        .subscribe((data) => {
          expect(data).toEqual(expectedResponse);
        });
      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-mssql-admin-credentials`
      );
      expect(testRequest.request.method).toBe("DELETE");
      testRequest.flush(expectedResponse);
    });

    it("should handle error response from server", () => {
      const errorResponse = { status: 500, message: "Internal Server Error" };
      const emsg = "deliberate 500 internal server error";

      service.removeProjectDefaultMssqlCredentials(projectId).subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
        },
      });
      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-mssql-admin-credentials`
      );
      expect(testRequest.request.method).toBe("DELETE");
      testRequest.flush(emsg, { status: 500, statusText: "" });
    });
  });

  describe("removeProjectDefaultOracleCredentials", () => {
    it("should remove project Oracle credentials", () => {
      const expectedResponse = {};
      service
        .removeProjectDefaultOracleCredentials(projectId)
        .subscribe((data) => {
          expect(data).toEqual(expectedResponse);
        });
      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-oracle-admin-credentials`
      );
      expect(testRequest.request.method).toBe("DELETE");
      testRequest.flush(expectedResponse);
    });

    it("should handle error response from server", () => {
      const errorResponse = { status: 500, message: "Internal Server Error" };
      const emsg = "deliberate 500 internal server error";

      service.removeProjectDefaultOracleCredentials(projectId).subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
        },
      });
      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-oracle-admin-credentials`
      );
      expect(testRequest.request.method).toBe("DELETE");
      testRequest.flush(emsg, { status: 500, statusText: "" });
    });
  });

  describe("removeProjectDefaultPostgresCredentials", () => {
    it("should remove project Postgres credentials", () => {
      const expectedResponse = {};
      service
        .removeProjectDefaultPostgresCredentials(projectId)
        .subscribe((data) => {
          expect(data).toEqual(expectedResponse);
        });
      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-postgres-admin-credentials`
      );
      expect(testRequest.request.method).toBe("DELETE");
      testRequest.flush(expectedResponse);
    });

    it("should handle error response from server", () => {
      const errorResponse = { status: 500, message: "Internal Server Error" };
      const emsg = "deliberate 500 internal server error";

      service.removeProjectDefaultPostgresCredentials(projectId).subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
        },
      });
      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-postgres-admin-credentials`
      );
      expect(testRequest.request.method).toBe("DELETE");
      testRequest.flush(emsg, { status: 500, statusText: "" });
    });
  });

  describe("removeProjectDefaultSybaseCredentials", () => {
    it("should remove project Sybase credentials", () => {
      const expectedResponse = {};
      service
        .removeProjectDefaultSybaseCredentials(projectId)
        .subscribe((data) => {
          expect(data).toEqual(expectedResponse);
        });
      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-sybase-admin-credentials`
      );
      expect(testRequest.request.method).toBe("DELETE");
      testRequest.flush(expectedResponse);
    });

    it("should handle error response from server", () => {
      const errorResponse = { status: 500, message: "Internal Server Error" };
      const emsg = "deliberate 500 internal server error";

      service.removeProjectDefaultSybaseCredentials(projectId).subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
        },
      });
      const testRequest = httpTestingController.expectOne(
        GATEWAY_URL +
          `projects/` +
          projectId +
          `/infra/registry/config/default-sybase-admin-credentials`
      );
      expect(testRequest.request.method).toBe("DELETE");
      testRequest.flush(emsg, { status: 500, statusText: "" });
    });
  });

  function getProjectConfig(): ProjectInfraConfig {
    return {
      projectId: projectId,
      defaultInfraPlugin: "plugin",
      defaultSshCredentialsUri: "credentialsUri",
      defaultMssqlDbCredentialsUri: "credentialsUri",
      defaultOracleDbCredentialsUri: "credentialsUri",
      defaultPostgresDbCredentialsUri: "credentialsUri",
      defaultSybaseDbCredentialsUri: "credentialsUri",
      defaultGroup: {
        id: "groupId",
        name: "group1",
        projectId: projectId,
      },
      defaultAllocationRetryDelay: 60,
      groupAllocationNearCapacityThreshold: 80,
    };
  }

  function getEditedProjectInfraConfig(): ProjectInfraConfig {
    return {
      projectId: projectId,
      defaultInfraPlugin: "murex",
      defaultSshCredentialsUri: "credentialsUri",
      defaultMssqlDbCredentialsUri: "credentialsUri",
      defaultOracleDbCredentialsUri: "credentialsUri",
      defaultPostgresDbCredentialsUri: "credentialsUri",
      defaultSybaseDbCredentialsUri: "credentialsUri",
      defaultGroup: {
        id: "groupId",
        name: "group1",
        projectId: projectId,
      },
      defaultAllocationRetryDelay: 90,
      groupAllocationNearCapacityThreshold: 80,
    };
  }

  function getExpectedCredentials(): CredentialsUri {
    return {
      uri: "updated_uri",
    };
  }
});
