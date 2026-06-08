import { inject, Injectable } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { HttpParams, HttpUrlEncodingCodec } from "@angular/common/http";
import {
  CompanionRequest,
  SecureCompanionRequest,
} from "./models/companion-request.model";

@Injectable({
  providedIn: "root",
})
export class MxenvCompanionService {
  private readonly document = inject(DOCUMENT);

  callCompanionUrl(request: CompanionRequest): void {
    this.document.location.href = this.buildCompanionUrl(request);
  }

  private buildCompanionUrl(request: CompanionRequest): string {
    const baseURL = "mxenv-companion://deploy-client";

    const queryParams = {
      environmentId: request.environmentId,
      launcher: request.launcher,
      host: request.host,
      port: request.port,
      clientPackageName: request.clientPackageName,
      clientJarName: request.clientJarName,
      clientJarUrl: request.clientJarUri,
      clientPackageUrl: request.clientPackageUri,
    };

    const httpParams = new HttpParams({
      encoder: new CompanionUrlEncodingCodec(),
    }).appendAll(queryParams);

    return `${baseURL}?${httpParams.toString()}`;
  }

  callSecureCompanionUrl(request: SecureCompanionRequest): void {
    this.document.location.href = this.buildSecureCompanionUrl(request);
  }

  private buildSecureCompanionUrl(request: SecureCompanionRequest): string {
    const baseURL = "mxenv-companion://deploy-secure-client";

    const queryParams = {
      environmentId: request.environmentId,
      launcher: request.launcher,
      secureClientArtifactUri: request.secureClientArtifactUri,
    };

    const httpParams = new HttpParams({
      encoder: new CompanionUrlEncodingCodec(),
    }).appendAll(queryParams);

    return `${baseURL}?${httpParams.toString()}`;
  }
}

export class CompanionUrlEncodingCodec extends HttpUrlEncodingCodec {
  override encodeValue(v: string): string {
    return encodeURIComponent(v);
  }
}
