import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, map, Observable, throwError } from "rxjs";
import {
  FailureReason,
  MergeRequestFilterRequest,
  MergeRequestOverview,
  MergeRequestState,
} from "./merge-request-overview.model";
import { MergeRequestPriority } from "./merge-request-priority.model";

interface MergeRequestApiItem {
  readonly pullRequestId?: string;
  readonly id: string;
  readonly mergeRequestState: string;
  readonly createdOn?: string;
  readonly pullRequestUrl?: string;
  readonly mergeConfiguration?: {
    readonly id?: string;
    readonly branchName?: string;
  };
  readonly failureReason?: string;
  readonly mergeRequestPriority?: string;
  readonly queuePosition?: number;
  readonly queuedDate?: string;
  readonly endDate?: string;
  readonly isLastBuildInBulkMode?: boolean;
  readonly development?: {
    readonly id: string;
    readonly name: string;
    readonly projectId: string;
    readonly repository: { readonly id: string };
  };
  readonly builds?: Array<{
    readonly id: string;
    readonly scenarioExecutionId?: string;
    readonly bulkMode: boolean;
  }>;
  readonly stateTransitions?: Array<{
    readonly mergeRequestPreviousState: string;
    readonly mergeRequestCurrentState: string;
    readonly transitionedOn: string;
  }>;
  readonly owner?: string;
  readonly projectId?: string;
  readonly isReOpenable?: boolean;
}

interface MergeRequestFilterApiResponse {
  readonly content: MergeRequestApiItem[];
}

@Injectable()
export class MergeRequestService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  private get baseUrl(): string {
    return this.config.gatewayUrl + "scm-management/";
  }

  getFilteredMergeRequests(
    projectId: string,
    request: MergeRequestFilterRequest
  ): Observable<MergeRequestOverview[]> {
    const url = `${this.baseUrl}projects/${projectId}/merge-requests/filter`;
    const params = new HttpParams()
      .set("sort", "createdOn,desc")
      .set("page", "0")
      .set("size", "200");

    return this.http
      .post<MergeRequestFilterApiResponse>(url, request, { params })
      .pipe(
        map((response) =>
          response.content.map((item) => ({
            pullRequestId: item.pullRequestId ?? item.id,
            mergeRequestState: item.mergeRequestState as MergeRequestState,
            createdOn: item.createdOn,
          }))
        ),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.message ??
                  error?.message ??
                  "Failed to fetch merge requests"
              )
          )
        )
      );
  }

  updateMergeRequestPriority(
    projectId: string,
    mergeRequestId: string,
    priority: MergeRequestPriority
  ): Observable<unknown> {
    const url = `${this.baseUrl}projects/${projectId}/merge-requests/${mergeRequestId}/priority`;
    return this.http
      .patch(url, { mergeRequestPriority: priority })
      .pipe(
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.message ??
                  error?.message ??
                  "Failed to update merge request priority"
              )
          )
        )
      );
  }

  getMergeRequestById(
    projectId: string,
    mergeRequestId: string
  ): Observable<MergeRequestOverview> {
    const url = `${this.baseUrl}projects/${projectId}/merge-requests/${mergeRequestId}`;
    return this.http.get<MergeRequestApiItem>(url).pipe(
      map((response) => ({
        id: response.id,
        pullRequestId: response.pullRequestId ?? response.id,
        mergeRequestState: response.mergeRequestState as MergeRequestState,
        createdOn: response.createdOn,
        pullRequestUrl: response.pullRequestUrl,
        destinationBranch: response.mergeConfiguration?.branchName,
        failureReason: response.failureReason as FailureReason | undefined,
        mergeRequestPriority: response.mergeRequestPriority as
          | MergeRequestPriority
          | undefined,
        queuePosition: response.queuePosition,
        queuedDate: response.queuedDate,
        endDate: response.endDate,
        isLastBuildInBulkMode: response.isLastBuildInBulkMode,
        development: response.development,
        mergeConfiguration: response.mergeConfiguration?.id
          ? {
              id: response.mergeConfiguration.id,
              branchName: response.mergeConfiguration.branchName ?? "",
            }
          : undefined,
        builds: response.builds,
        stateTransitions: response.stateTransitions?.map((t) => ({
          mergeRequestPreviousState:
            t.mergeRequestPreviousState as MergeRequestState,
          mergeRequestCurrentState:
            t.mergeRequestCurrentState as MergeRequestState,
          transitionedOn: t.transitionedOn,
        })),
        owner: response.owner,
        projectId: response.projectId,
        isReOpenable: response.isReOpenable,
      })),
      catchError((error) =>
        throwError(
          () =>
            new Error(
              error?.error?.message ??
                error?.message ??
                "Failed to fetch merge request"
            )
        )
      )
    );
  }
}
