import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, map, Observable, throwError } from "rxjs";
import { RuntimePropertiesDocumentationApiResponse } from "../model/runtime-properties-documentation-api-model";
import { RuntimePropertiesDocumentationModel } from "../model/runtime-properties-documentation-model";
import { toRuntimePropertiesDocumentation } from "../mapper/runtime-properties-documentation-mapper";

@Injectable()
export class RuntimePropertiesDocumentationService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  getRuntimePropertiesDocumentation(
    projectId: string,
    requestType: string
  ): Observable<RuntimePropertiesDocumentationModel> {
    return this.http
      .get<RuntimePropertiesDocumentationApiResponse>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/management-requests/runtime-properties/${requestType}`
      )
      .pipe(
        map((response) => toRuntimePropertiesDocumentation(response)),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }
}
