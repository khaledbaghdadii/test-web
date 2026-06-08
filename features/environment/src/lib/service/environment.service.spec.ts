import { EnvironmentService } from "./environment.service";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { provideHttpClient } from "@angular/common/http";
import { throwError } from "rxjs";
import {
  Environment,
  EnvironmentDeploymentMode,
  EnvironmentSource,
} from "./models/environment.model";
import { EnvironmentStatus } from "../environment-status/environment-status";
import { EnvironmentServiceModel } from "./models/environment-service.model";
import { EnvironmentServicesApiModel } from "./models/environment-services-api.model";
import { EnvironmentDefinitionStatus } from "../environment-definition-status";
import { MXClientDetailsApiModel } from "./models/mxclient-details-api.model";
import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";

describe("EnvironmentService", () => {
  const PROJECT_ID = "123";
  const ENVIRONMENT_ID = "456";
  const ENVIRONMENT_DEFINITION_ID = "id";
  const ENVIRONMENT_DEFINITION_NAME = "Sample Environment Definition - 2";
  const ENVIRONMENT_DEFINITION_STATUS = EnvironmentDefinitionStatus.ACTIVE;

  const appConfig: AppConfig = {
    gatewayUrl: "https://gateway.cd.murex.com/api/v1/",
  } as unknown as AppConfig;

  let service: EnvironmentService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: APP_CONFIG,
          useValue: appConfig,
        },
        provideHttpClient(),
        provideHttpClientTesting(),
        EnvironmentService,
      ],
    });

    service = TestBed.inject(EnvironmentService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it("should return the environment termination message", async () => {
    service
      .getEnvironmentRequestTerminationMessage("id", PROJECT_ID)
      .subscribe((message) => expect(message).toEqual("termination message"));

    const testRequest = controller.expectOne(
      `${appConfig.gatewayUrl}projects/${PROJECT_ID}/environments/id/requests`
    );

    expect(testRequest.request.method).toEqual("GET");
    testRequest.flush([
      {
        id: "id",
        type: "deployment",
        result: {
          message: "termination message",
          status: "status",
        },
        status: "status",
        correlationId: "correlationId",
        configurationIdentifier: {
          branch: "branch",
          revision: "revision",
        },
        environmentId: "envId",
      },
    ]);
  });

  it("should return the environment execution by id", async () => {
    const expectedEnvironment: Environment = {
      id: "id",
      projectId: PROJECT_ID,
      status: EnvironmentStatus.READY,
      configurationIdentifier: {
        branch: "branch",
        revision: "revision",
      },
      outputsDirectoryUri: "",
      tests: [{ directory: "directory1" }],
      primaryApplicative: {
        directory: "directory",
        allocation: {},
      },
      secondaryApplicatives: [],
      bundles: [],
      isTools: [{ name: "is-tool-name" }],
      clients: [],
      allocationId: "allocationId",
      databases: [],
      environmentActions: ["MONITOR_SERVICES"],
      webClientUrl: "some-url",
      maintenance: {
        full: true,
      },
      createdOn: "createdOn",
      createdBy: "createdBy",
      environmentDefinition: {
        id: ENVIRONMENT_DEFINITION_ID,
        name: ENVIRONMENT_DEFINITION_NAME,
      },
      environmentDeploymentMode: EnvironmentDeploymentMode.ENVIRONMENT_SNAPSHOT,
      environmentSource: EnvironmentSource.POOL,
      configurationEditorProperties: {
        disabled: false,
        testConfigurationApplication: {
          url: "test-configuration-application-url",
        },
      },
      clientRepositoryConfiguration: {
        test: {
          directory: "repo-test-directory",
        },
      },
      parentResources: [
        {
          id: "business-process-id",
          type: "BusinessProcess",
        },
        {
          id: "scenario-id",
          type: "Scenario",
        },
      ],
      configurationRepository: {
        id: "repo-id",
      },
    } as Environment;

    service
      .getEnvironmentExecutionById(PROJECT_ID, "id")
      .subscribe((response) => expect(response).toEqual(expectedEnvironment));

    const testRequest = controller.expectOne(
      `${appConfig.gatewayUrl}projects/${PROJECT_ID}/environments/id`
    );
    expect(testRequest.request.method).toEqual("GET");

    testRequest.flush({
      id: "id",
      projectId: PROJECT_ID,
      status: EnvironmentStatus.READY,
      definitionId: "definitionId",
      primaryApplicative: {
        directory: "directory",
        allocation: {},
      },
      secondaryApplicatives: [],
      databases: [],
      tests: [{ directory: "directory1" }],
      configurationIdentifier: {
        branch: "branch",
        revision: "revision",
      },
      bundles: [],
      isTools: [{ name: "is-tool-name" }],
      clients: [],
      allocationId: "allocationId",
      outputsDirectoryUri: "",
      environmentActions: ["MONITOR_SERVICES"],
      webClientUrl: "some-url",
      maintenance: {
        full: true,
      },
      createdOn: "createdOn",
      createdBy: "createdBy",
      environmentDefinition: {
        id: ENVIRONMENT_DEFINITION_ID,
        name: ENVIRONMENT_DEFINITION_NAME,
      },
      environmentDeploymentMode: EnvironmentDeploymentMode.ENVIRONMENT_SNAPSHOT,
      environmentSource: EnvironmentSource.POOL,
      configurationEditorProperties: {
        disabled: false,
        testConfigurationApplication: {
          url: "test-configuration-application-url",
        },
      },
      clientRepositoryConfiguration: {
        test: {
          directory: "repo-test-directory",
        },
      },
      parentResources: [
        {
          id: "business-process-id",
          type: "BusinessProcess",
        },
        {
          id: "scenario-id",
          type: "Scenario",
        },
      ],
      configurationRepository: {
        id: "repo-id",
      },
    });
  });

  it("should return the environment services", async () => {
    service
      .getEnvironmentServices(PROJECT_ID, ENVIRONMENT_ID)
      .subscribe((response) =>
        expect(response).toEqual(getExpectedEnvironmentServices())
      );

    const testRequest = controller.expectOne(
      `${appConfig.gatewayUrl}projects/${PROJECT_ID}/environments/${ENVIRONMENT_ID}/services/status`
    );
    expect(testRequest.request.method).toEqual("GET");

    testRequest.flush(getActualEnvironmentServices());
  });

  it("should fail to return the environment services if any error", async () => {
    service.getEnvironmentServices(PROJECT_ID, ENVIRONMENT_ID).subscribe({
      next: () => throwError(() => "expected an error"),
      error: (error) =>
        expect(error).toEqual("Error fetching environment services"),
    });

    const testRequest = controller.expectOne(
      `${appConfig.gatewayUrl}projects/${PROJECT_ID}/environments/${ENVIRONMENT_ID}/services/status`
    );

    testRequest.flush("Error fetching environment services", {
      status: 500,
      statusText: "Server Error",
    });
  });

  describe("Get environment definitions", () => {
    it("should return correct environment definitions", async () => {
      service
        .getEnvironmentDefinitions(PROJECT_ID)
        .subscribe((response) =>
          expect(response).toEqual([getEnvironmentDefinition()])
        );

      const testRequest = controller.expectOne(
        `${appConfig.gatewayUrl}projects/${PROJECT_ID}/environments/definitions?includeInactive=false`
      );
      expect(testRequest.request.method).toEqual("GET");

      testRequest.flush([getEnvironmentDefinition()]);
    });

    it("should include the include inactive flag in the http request if set to false by the service client", async () => {
      service.getEnvironmentDefinitions(PROJECT_ID, false).subscribe();

      const testRequest = controller.expectOne(
        `${appConfig.gatewayUrl}projects/${PROJECT_ID}/environments/definitions?includeInactive=false`
      );

      testRequest.flush([]);
    });

    it("should include the include inactive flag in the http request if set to true by the service client", async () => {
      service.getEnvironmentDefinitions(PROJECT_ID, true).subscribe();

      const testRequest = controller.expectOne(
        `${appConfig.gatewayUrl}projects/${PROJECT_ID}/environments/definitions?includeInactive=true`
      );

      testRequest.flush([]);
    });
  });

  function getActualEnvironmentServices(): EnvironmentServicesApiModel {
    return {
      environmentId: ENVIRONMENT_DEFINITION_ID,
      services: [
        {
          name: "name1",
          nickname: "nickname1",
          installationCode: "installationCode1",
          description: "description1",
          status: "status1",
        },
        {
          name: "name2",
          nickname: "nickname2",
          installationCode: "installationCode2",
          description: "description2",
          status: "status2",
        },
      ],
    };
  }

  function getExpectedEnvironmentServices(): EnvironmentServiceModel[] {
    return [
      {
        name: "name1",
        nickname: "nickname1",
        installationCode: "installationCode1",
        description: "description1",
        status: "status1",
      },
      {
        name: "name2",
        nickname: "nickname2",
        installationCode: "installationCode2",
        description: "description2",
        status: "status2",
      },
    ];
  }

  it("should return MX client details", async () => {
    const mockMxClientDetails: MXClientDetailsApiModel = {
      environmentId: ENVIRONMENT_ID,
      host: "platf-app-3",
      port: 123,
      clientPackage: {
        name: "mxdeploy-mx3_client-package.zip",
        uri: "https://mxsetups.murex.com/quality/mx/deployment/mxdeploy-mx3_client-package.zip",
      },
      clientJar: {
        name: "6457663-230112-1646-5665220-SetupClient.jar",
        uri: "https://mxsetups.murex.com/build/6457663-230112-1646-5665220-SetupClient.jar",
      },
    };

    service
      .getMXClientDetails(PROJECT_ID, ENVIRONMENT_ID)
      .subscribe((response) => expect(response).toEqual(mockMxClientDetails));

    const testRequest = controller.expectOne(
      `${appConfig.gatewayUrl}projects/${PROJECT_ID}/environments/${ENVIRONMENT_ID}/mxclient-details`
    );
    expect(testRequest.request.method).toEqual("GET");

    testRequest.flush(mockMxClientDetails);
  });

  it("should handle error when fetching MX client details", async () => {
    const errorMessage = "Error fetching MX client details";

    service.getMXClientDetails(PROJECT_ID, ENVIRONMENT_ID).subscribe({
      next: () => throwError(() => "expected an error"),
      error: (error) => expect(error).toBe(errorMessage),
    });

    const testRequest = controller.expectOne(
      `${appConfig.gatewayUrl}projects/${PROJECT_ID}/environments/${ENVIRONMENT_ID}/mxclient-details`
    );
    testRequest.flush(errorMessage, {
      status: 500,
      statusText: "Server Error",
    });
  });

  function getEnvironmentDefinition() {
    return {
      id: ENVIRONMENT_DEFINITION_ID,
      name: ENVIRONMENT_DEFINITION_NAME,
      status: ENVIRONMENT_DEFINITION_STATUS,
    };
  }

  describe("exclude from shutdown", () => {
    const EXCLUDED = true;
    it("should exclude the environment from shutdown correctly", () => {
      service
        .excludeFromShutdown(PROJECT_ID, ENVIRONMENT_ID, EXCLUDED)
        .subscribe();

      const testRequest = controller.expectOne(
        `${appConfig.gatewayUrl}projects/${PROJECT_ID}/environments/${ENVIRONMENT_ID}/services/exclude-from-shutdown/${EXCLUDED}`
      );
      expect(testRequest.request.method).toEqual("POST");

      testRequest.flush({});
    });

    it("should return that the environment is invalid in case it is not found", async () => {
      const errorMessage =
        "The specified environment is invalid, could not exclude from daily shutdown";

      service
        .excludeFromShutdown(PROJECT_ID, ENVIRONMENT_ID, EXCLUDED)
        .subscribe({
          error: (err) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe(errorMessage);
          },
        });

      const testRequest = controller.expectOne(
        `${appConfig.gatewayUrl}projects/${PROJECT_ID}/environments/${ENVIRONMENT_ID}/services/exclude-from-shutdown/${EXCLUDED}`
      );

      testRequest.flush(
        { message: errorMessage },
        { status: 404, statusText: "Not Found" }
      );
    });

    it("should return the exclusion failed if the API returns internal server error", async () => {
      const errorMessage =
        "An error occurred while excluding the environment from daily shutdown, please try again";

      service
        .excludeFromShutdown(PROJECT_ID, ENVIRONMENT_ID, EXCLUDED)
        .subscribe({
          error: (err) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe(errorMessage);
          },
        });

      const testRequest = controller.expectOne(
        `${appConfig.gatewayUrl}projects/${PROJECT_ID}/environments/${ENVIRONMENT_ID}/services/exclude-from-shutdown/${EXCLUDED}`
      );

      testRequest.flush(
        { message: errorMessage },
        { status: 500, statusText: "Internal Server Error" }
      );
    });
  });
});
