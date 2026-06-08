import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient } from "@angular/common/http";
import { CustomizeSoftwareProductBuildApiRequest } from "./model/software-product-build.model";
import { catchError, Observable, throwError } from "rxjs";
import { SoftwareProductBuildResponse } from "../api-models/factory-product/factory-product";

@Injectable({
  providedIn: "root",
})
export class SoftwareProductBuildService {
  apiUrl: string;

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.apiUrl = config.gatewayUrl;
  }

  customizeSoftwareProductBuild(
    request: CustomizeSoftwareProductBuildApiRequest,
    softwareProductBuildId: string,
    projectId: string
  ): Observable<SoftwareProductBuildResponse> {
    return this.http
      .post<SoftwareProductBuildResponse>(
        `${this.apiUrl}artifact-management/projects/${projectId}/software-product-builds/${softwareProductBuildId}/customized-bundles`,
        request
      )
      .pipe(catchError((error) => throwError(() => error)));
  }
}
