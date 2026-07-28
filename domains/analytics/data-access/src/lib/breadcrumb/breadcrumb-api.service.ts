import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { Observable } from "rxjs";
import type {
  BreadcrumbResourceType,
  BreadcrumbResponse,
} from "./breadcrumb.model";

@Injectable({ providedIn: "root" })
export class BreadcrumbApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  getBreadcrumb(
    projectId: string,
    resourceType: BreadcrumbResourceType,
    resourceId: string
  ): Observable<BreadcrumbResponse> {
    const params = new HttpParams()
      .set("resourceType", resourceType)
      .set("resourceId", resourceId);
    return this.http.get<BreadcrumbResponse>(
      `${this.config.gatewayUrl}analytics/projects/${projectId}/breadcrumb`,
      {
        params,
      }
    );
  }
}
