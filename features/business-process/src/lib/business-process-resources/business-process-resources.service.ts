import { Inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { BusinessProcessResource } from "./business-process-resource";

@Injectable()
export class BusinessProcessResourcesService {
  constructor(
    private http: HttpClient,
    @Inject(APP_CONFIG) private config: AppConfig
  ) {}

  getBusinessProcessResources(
    projectId: string,
    processId: string,
    referenceResource?: boolean
  ): Observable<BusinessProcessResource[]> {
    let queryParams = new HttpParams().set("processId", processId);
    if (referenceResource !== undefined) {
      queryParams = queryParams.set(
        "referenceResource",
        referenceResource.toString()
      );
    }

    return this.http
      .get<BusinessProcessResource[]>(this.getBaseUrl(projectId), {
        params: queryParams,
      })
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private getBaseUrl(projectId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/resources`;
  }
}
