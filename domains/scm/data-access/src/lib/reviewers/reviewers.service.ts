import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { Reviewer } from "./reviewer.model";

export interface ReviewersPage {
  content: Reviewer[];
  totalElements: number;
  page: number;
  last: boolean;
}

export interface DefaultReviewersResponse {
  content: Reviewer[];
}

@Injectable()
export class ReviewersService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  private get baseUrl(): string {
    return this.config.gatewayUrl + "scm-operations/";
  }

  getReviewers(
    projectId: string,
    repositoryId: string,
    filter: string,
    page: number,
    size: number
  ): Observable<ReviewersPage> {
    const url = `${this.baseUrl}projects/${projectId}/repositories/${repositoryId}/reviewers?page=${page}&size=${size}&filter=${filter}`;
    return this.http
      .get<ReviewersPage>(url)
      .pipe(
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.message ??
                  error?.message ??
                  "Failed to fetch reviewers"
              )
          )
        )
      );
  }

  getDefaultReviewers(
    projectId: string,
    repositoryId: string,
    sourceBranch: string,
    targetBranch: string
  ): Observable<DefaultReviewersResponse> {
    const params = new HttpParams()
      .set("sourceBranch", sourceBranch)
      .set("targetBranch", targetBranch);
    const url = `${this.baseUrl}projects/${projectId}/repositories/${repositoryId}/default-reviewers`;
    return this.http
      .get<DefaultReviewersResponse>(url, { params })
      .pipe(
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.message ??
                  error?.message ??
                  "Failed to fetch default reviewers"
              )
          )
        )
      );
  }
}
