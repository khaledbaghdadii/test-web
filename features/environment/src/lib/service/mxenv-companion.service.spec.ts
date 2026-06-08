import { TestBed } from "@angular/core/testing";
import { DOCUMENT } from "@angular/common";
import { MxenvCompanionService } from "./mxenv-companion.service";
import {
  CompanionRequest,
  SecureCompanionRequest,
} from "@mxflow/features/environment";

describe("MxenvCompanionService", () => {
  let companionService: MxenvCompanionService;
  let mockDocument: { location: { href: string } };

  beforeEach(() => {
    mockDocument = { location: { href: "" } };

    TestBed.configureTestingModule({
      providers: [
        MxenvCompanionService,
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });

    companionService = TestBed.inject(MxenvCompanionService);
  });

  it("should build correct companion url", async () => {
    companionService.callCompanionUrl(getCompanionRequest());
    expect(mockDocument.location.href).toEqual(getCompanionUrl());
  });

  it("should build correct companion url for secure deployment", async () => {
    companionService.callSecureCompanionUrl(getSecureCompanionRequest());
    expect(mockDocument.location.href).toEqual(getSecureCompanionUrl());
  });

  function getCompanionRequest(): CompanionRequest {
    return {
      launcher: "client",
      environmentId: "4c3a14",
      host: "platf-app-3",
      port: 123,
      clientPackageName: "6457663-230112-1646-5665220-SetupClient.jar",
      clientJarName: "mxdeploy-mx3_client-package.zip",
      clientPackageUri:
        "https://mxsetups.murex.com/build/mx/v3.1.build.archival.2024.022/Linux-i386-3.10.0-957.5.1.el7.x86_64/7000063-240313-0556-6246189/deployment/mxdeploy-mx3_client-package.zip",
      clientJarUri:
        "https://mxsetups.murex.com/quality/mx/QL4/v3.1.build.archival.2024.022/Linux-i386-3.10.0-957.5.1.el7.x86_64/7000063-240313-0556-6246189/7000063-240313-0556-6246189-SetupClient.jar",
    } as unknown as CompanionRequest;
  }

  function getCompanionUrl(): string {
    return "mxenv-companion://deploy-client?environmentId=4c3a14&launcher=client&host=platf-app-3&port=123&clientPackageName=6457663-230112-1646-5665220-SetupClient.jar&clientJarName=mxdeploy-mx3_client-package.zip&clientJarUrl=https%3A%2F%2Fmxsetups.murex.com%2Fquality%2Fmx%2FQL4%2Fv3.1.build.archival.2024.022%2FLinux-i386-3.10.0-957.5.1.el7.x86_64%2F7000063-240313-0556-6246189%2F7000063-240313-0556-6246189-SetupClient.jar&clientPackageUrl=https%3A%2F%2Fmxsetups.murex.com%2Fbuild%2Fmx%2Fv3.1.build.archival.2024.022%2FLinux-i386-3.10.0-957.5.1.el7.x86_64%2F7000063-240313-0556-6246189%2Fdeployment%2Fmxdeploy-mx3_client-package.zip";
  }

  function getSecureCompanionRequest(): SecureCompanionRequest {
    return {
      launcher: "client_tls",
      environmentId: "4c3a14",
      secureClientArtifactUri: "this-nexus-uri",
    } as unknown as SecureCompanionRequest;
  }

  function getSecureCompanionUrl(): string {
    return "mxenv-companion://deploy-secure-client?environmentId=4c3a14&launcher=client_tls&secureClientArtifactUri=this-nexus-uri";
  }
});
