import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, map, Observable, of, throwError } from "rxjs";
import { IncidentPage } from "./model/incident-page.model";
import { IncidentApiPage } from "./model/incident-page-api-model";
import { Incident } from "./model/incident.model";
import {
  IncidentsApiRequest,
  IncidentsFetchRequest,
  IncidentsQueryParams,
} from "./model/incidents-fetch-request.model";

@Injectable({
  providedIn: "root",
})
export class IncidentService {
  private http = inject(HttpClient);
  private config = inject<AppConfig>(APP_CONFIG);

  apiUrl: string;

  constructor() {
    const config = this.config;

    this.apiUrl = config.gatewayUrl;
  }

  map(incidentApiPage: IncidentApiPage): IncidentPage {
    return incidentApiPage.incidents;
  }

  fetch(fetchRequest: IncidentsFetchRequest): Observable<IncidentPage> {
    const queryParams = new HttpParams({
      fromObject: { ...fetchRequest.queryParams } as Record<string, string>,
    });

    return this.http
      .post<IncidentApiPage>(
        `${this.getBaseUrl()}/fetch`,
        fetchRequest.filters ?? {},
        {
          params: queryParams,
        }
      )
      .pipe(
        map((apiModel) => this.map(apiModel)),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  fetchIncidentsByIds(ids: string[]): Observable<Incident[]> {
    if (ids && ids.length > 0) {
      const queryParams: IncidentsQueryParams = {
        page: 0,
        size: ids.length,
      };

      const filters: IncidentsApiRequest = {
        ids: ids,
      };

      const fetchRequest: IncidentsFetchRequest = {
        queryParams: queryParams,
        filters: filters,
      };

      return this.fetch(fetchRequest).pipe(
        map((incidentPage) => incidentPage.content)
      );
    }
    return of([]);
  }

  fetchAllStatuses(): Observable<string[]> {
    return this.http
      .get<string[]>(`${this.getBaseUrl()}/statuses`)
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private getBaseUrl() {
    return `${this.apiUrl}incident-management/incidents`;
  }
}
