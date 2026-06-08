import { inject, Injectable } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { HttpParams, HttpUrlEncodingCodec } from "@angular/common/http";
import {
  CompanionRequest,
  SecureCompanionRequest,
} from "./companion-request.model";

@Injectable()
export class MxenvCompanionService {
  private readonly document = inject(DOCUMENT);

  callCompanionUrl(request: CompanionRequest): void {
    this.document.location.href = this.buildCompanionUrl(request);
  }

  callSecureCompanionUrl(request: SecureCompanionRequest): void {
    this.document.location.href = this.buildSecureCompanionUrl(request);
  }

  launchWebClient(webClientUrl: string): void {
    this.document.defaultView?.open(webClientUrl, "_blank");
  }

  buildCompanionUrl(request: CompanionRequest): string {
    const baseURL = "mxenv-companion://deploy-client";
    const httpParams = new HttpParams({
      encoder: new CompanionUrlEncodingCodec(),
    }).appendAll({
      environmentId: request.environmentId,
      launcher: request.launcher,
      host: request.host,
      port: String(request.port),
      clientPackageName: request.clientPackageName,
      clientJarName: request.clientJarName,
      clientJarUrl: request.clientJarUri,
      clientPackageUrl: request.clientPackageUri,
    });
    return `${baseURL}?${httpParams.toString()}`;
  }

  buildSecureCompanionUrl(request: SecureCompanionRequest): string {
    const baseURL = "mxenv-companion://deploy-secure-client";
    const httpParams = new HttpParams({
      encoder: new CompanionUrlEncodingCodec(),
    }).appendAll({
      environmentId: request.environmentId,
      launcher: request.launcher,
      secureClientArtifactUri: request.secureClientArtifactUri,
    });
    return `${baseURL}?${httpParams.toString()}`;
  }
}

export class CompanionUrlEncodingCodec extends HttpUrlEncodingCodec {
  override encodeValue(v: string): string {
    return encodeURIComponent(v);
  }
}
