import {
  EnvironmentService,
  MxenvCompanionService,
  SecureCompanionRequest,
} from "@mxflow/features/environment";
import { lastValueFrom, of } from "rxjs";
import { MXClientDetailsApiModel } from "./models/mxclient-details-api.model";
import { EnvironmentClientLauncherService } from "./environment-client-launcher-service";

describe("Environment Client Launcher Service Test", () => {
  let companionService: MxenvCompanionService;
  let environmentService: EnvironmentService;
  let launcherService: EnvironmentClientLauncherService;

  beforeEach(() => {
    companionService = {
      callCompanionUrl: jest.fn(),
      callSecureCompanionUrl: jest.fn(),
    } as unknown as MxenvCompanionService;

    environmentService = {
      getMXClientDetails: jest.fn(() =>
        of({
          environmentId: "environmentId",
          host: "localhost",
          port: 8080,
          clientJar: {
            name: "client.jar",
            uri: "http://localhost:8080/client.jar",
          },
          clientPackage: {
            name: "client.zip",
            uri: "http://localhost:8080/client.zip",
          },
        } as MXClientDetailsApiModel)
      ),
    } as unknown as EnvironmentService;

    launcherService = new EnvironmentClientLauncherService(
      companionService,
      environmentService
    );
  });

  describe("launching a regular client", () => {
    it("should retrieve the environment mxclient details", () => {
      launcherService.launchClient(
        "projectId",
        "environmentId",
        "launcherType"
      );

      expect(environmentService.getMXClientDetails).toHaveBeenCalledWith(
        "projectId",
        "environmentId"
      );
    });

    it("should call the companion with the correct request", async () => {
      await lastValueFrom(
        launcherService.launchClient(
          "projectId",
          "environmentId",
          "launcherType"
        )
      );

      expect(companionService.callCompanionUrl).toHaveBeenCalledWith({
        environmentId: "environmentId",
        host: "localhost",
        port: 8080,
        clientPackageName: "client.zip",
        clientPackageUri: "http://localhost:8080/client.zip",
        clientJarName: "client.jar",
        clientJarUri: "http://localhost:8080/client.jar",
        launcher: "launcherType",
      });
    });
  });

  describe("launching a secure client", () => {
    it("should call and build companion url correctly in case of Secure Deployment", () => {
      const expectedRequest = getExpectedSecureCompanionRequest("client_tls");
      let nexusUri = "this-nexus-uri";
      launcherService.launchSecureClient(
        "testEnvironmentId",
        "client_tls",
        nexusUri
      );
      expect(companionService.callSecureCompanionUrl).toHaveBeenCalledWith(
        expectedRequest
      );
    });

    function getExpectedSecureCompanionRequest(
      launcher: string
    ): SecureCompanionRequest {
      return {
        launcher: launcher,
        environmentId: "testEnvironmentId",
        secureClientArtifactUri: "this-nexus-uri",
      };
    }
  });

  describe("launching the web client", () => {
    it("should open the client url in a separate tab", () => {
      let windowOpenSpy = jest
        .spyOn(window, "open")
        .mockImplementation(() => null);

      launcherService.launchWebClient("http://localhost:8080/webclient");

      expect(windowOpenSpy).toHaveBeenCalledWith(
        "http://localhost:8080/webclient",
        "_blank"
      );
      windowOpenSpy.mockRestore();
    });
  });
});
