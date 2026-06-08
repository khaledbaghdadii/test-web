import { map, Observable, tap } from "rxjs";
import { MXClientDetailsApiModel } from "./models/mxclient-details-api.model";
import { MxenvCompanionService } from "./mxenv-companion.service";
import {
  CompanionRequest,
  SecureCompanionRequest,
} from "./models/companion-request.model";
import { EnvironmentService } from "./environment.service";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class EnvironmentClientLauncherService {
  constructor(
    private companionService: MxenvCompanionService,
    private environmentService: EnvironmentService
  ) {}

  launchClient(
    projectId: string,
    environmentId: string,
    launcher: string
  ): Observable<void> {
    return this.environmentService
      .getMXClientDetails(projectId, environmentId)
      .pipe(
        map((details: MXClientDetailsApiModel) => ({
          environmentId: details.environmentId,
          host: details.host,
          port: details.port,
          clientPackageName: details.clientPackage.name,
          clientPackageUri: details.clientPackage.uri,
          clientJarName: details.clientJar.name,
          clientJarUri: details.clientJar.uri,
          launcher: launcher,
        })),
        tap((companionRequest: CompanionRequest) => {
          this.companionService.callCompanionUrl(companionRequest);
        }),
        map(() => void 0)
      );
  }

  launchSecureClient(
    environmentId: string,
    launcher: string,
    secureClientArtifactUri: string
  ) {
    const companionRequest: SecureCompanionRequest = {
      environmentId: environmentId,
      launcher: launcher,
      secureClientArtifactUri: secureClientArtifactUri,
    };
    this.companionService.callSecureCompanionUrl(companionRequest);
  }

  launchWebClient(webClientUrl: string) {
    window.open(webClientUrl, "_blank");
  }
}
