import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient } from "@angular/common/http";
import { catchError, map, Observable, throwError } from "rxjs";
import {
  AllocationMetrics,
  AllocationMetricsApiResponse,
} from "./model/allocation-metrics.model";

@Injectable({ providedIn: "root" })
export class InfraAllocationsService {
  private readonly apiUrl: string;

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.apiUrl = config.gatewayUrl;
  }
  getAllocationMetrics(projectId: string): Observable<AllocationMetrics> {
    return this.http
      .get<AllocationMetricsApiResponse>(
        this.getAllocationMetricsUrl(projectId)
      )
      .pipe(
        map((apiResponse) => this.map(apiResponse)),
        catchError(() =>
          throwError(() => new Error("Could not fetch allocation metrics"))
        )
      );
  }

  private getAllocationMetricsUrl(projectId: string): string {
    return (
      this.apiUrl +
      "projects/" +
      projectId +
      "/infra/management/allocations/metrics"
    );
  }

  private map(response: AllocationMetricsApiResponse): AllocationMetrics {
    return {
      states: {
        deallocationFailed: response.states.deallocation_failed,
        failed: response.states.failed,
        queued: response.states.queued,
      },
    };
  }
}
