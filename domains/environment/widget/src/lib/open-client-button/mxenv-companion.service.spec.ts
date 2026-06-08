import { TestBed } from "@angular/core/testing";
import { DOCUMENT } from "@angular/common";
import { MxenvCompanionService } from "./mxenv-companion.service";
import {
  CompanionRequest,
  SecureCompanionRequest,
} from "./companion-request.model";

describe("MxenvCompanionService", () => {
  let service: MxenvCompanionService;
  let mockDocument: {
    location: { href: string };
    defaultView?: { open: jest.Mock };
  };

  beforeEach(() => {
    mockDocument = { location: { href: "" } };

    TestBed.configureTestingModule({
      providers: [
        MxenvCompanionService,
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });

    service = TestBed.inject(MxenvCompanionService);
  });

  describe("buildCompanionUrl", () => {
    it("builds a correct regular companion URL with all parameters", () => {
      const request: CompanionRequest = {
        environmentId: "env-001",
        launcher: "client",
        host: "host.example.com",
        port: 8080,
        clientPackageName: "my-package",
        clientPackageUri: "https://storage/package.zip",
        clientJarName: "my-jar",
        clientJarUri: "https://storage/jar.jar",
      };

      const url = service.buildCompanionUrl(request);

      expect(url).toContain("mxenv-companion://deploy-client?");
      expect(url).toContain("environmentId=env-001");
      expect(url).toContain("launcher=client");
      expect(url).toContain("host=host.example.com");
      expect(url).toContain("port=8080");
      expect(url).toContain("clientPackageName=my-package");
      expect(url).toContain("clientJarName=my-jar");
      expect(url).toContain(
        `clientJarUrl=${encodeURIComponent("https://storage/jar.jar")}`
      );
      expect(url).toContain(
        `clientPackageUrl=${encodeURIComponent("https://storage/package.zip")}`
      );
    });

    it("encodes special characters in parameter values", () => {
      const request: CompanionRequest = {
        environmentId: "env with spaces",
        launcher: "client",
        host: "host",
        port: 80,
        clientPackageName: "name",
        clientPackageUri: "https://example.com/path?q=1&r=2",
        clientJarName: "jar",
        clientJarUri: "https://example.com/jar",
      };

      const url = service.buildCompanionUrl(request);

      expect(url).toContain("environmentId=env%20with%20spaces");
      expect(url).toContain(
        `clientPackageUrl=${encodeURIComponent(
          "https://example.com/path?q=1&r=2"
        )}`
      );
    });
  });

  describe("buildSecureCompanionUrl", () => {
    it("builds a correct secure companion URL", () => {
      const request: SecureCompanionRequest = {
        environmentId: "env-002",
        launcher: "client_tls",
        secureClientArtifactUri: "https://secure.example.com/artifact",
      };

      const url = service.buildSecureCompanionUrl(request);

      expect(url).toContain("mxenv-companion://deploy-secure-client?");
      expect(url).toContain("environmentId=env-002");
      expect(url).toContain("launcher=client_tls");
      expect(url).toContain(
        `secureClientArtifactUri=${encodeURIComponent(
          "https://secure.example.com/artifact"
        )}`
      );
    });
  });

  describe("callCompanionUrl", () => {
    it("sets document.location.href to the companion URL", () => {
      const request: CompanionRequest = {
        environmentId: "env-001",
        launcher: "client",
        host: "host",
        port: 80,
        clientPackageName: "pkg",
        clientPackageUri: "https://pkg",
        clientJarName: "jar",
        clientJarUri: "https://jar",
      };

      service.callCompanionUrl(request);

      expect(mockDocument.location.href).toContain(
        "mxenv-companion://deploy-client?"
      );
    });
  });

  describe("callSecureCompanionUrl", () => {
    it("sets document.location.href to the secure companion URL", () => {
      const request: SecureCompanionRequest = {
        environmentId: "env-002",
        launcher: "client_tls",
        secureClientArtifactUri: "https://secure.example.com/artifact",
      };

      service.callSecureCompanionUrl(request);

      expect(mockDocument.location.href).toContain(
        "mxenv-companion://deploy-secure-client?"
      );
    });
  });

  describe("launchWebClient", () => {
    it("opens a new browser tab with the web client URL", () => {
      const openSpy = jest.fn().mockReturnValue(null);
      mockDocument.defaultView = { open: openSpy };

      service.launchWebClient("https://web.example.com");

      expect(openSpy).toHaveBeenCalledWith("https://web.example.com", "_blank");
    });
  });
});
