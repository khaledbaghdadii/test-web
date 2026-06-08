import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { Observable } from "rxjs";
import { VersionApiModel } from "./version-api-model";
import { Page } from "../page";
import { FetchVersionsQuery } from "./fetch-versions-query";

@Injectable({
  providedIn: "root",
})
export class VersionService {
  private readonly config = inject<AppConfig>(APP_CONFIG);
  private readonly http = inject(HttpClient);

  fetchVersions(query: FetchVersionsQuery): Observable<Page<VersionApiModel>> {
    const url = `${this.config.gatewayUrl}validation-resources/versions`;
    const params: HttpParams = new HttpParams({
      fromObject: { ...query },
    });
    return this.http.get<Page<VersionApiModel>>(url, { params });
  }
}
