import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { IssueTrackerDetailsApiRequest } from "./issue-tracker-details-api-request";
import { IssueTrackerDetailsApiResponse } from "./issue-tracker-details-api-response";
import { JiraDetailsRequest } from "./jira/jira-details-request";
import { JiraDetailsResponse } from "./jira/jira-details-response";
import { map } from "rxjs/operators";

@Injectable({ providedIn: "root" })
export class IssueTrackingService {
  apiUrl: string;
  private readonly http = inject(HttpClient);
  private readonly config: AppConfig = inject(APP_CONFIG);

  constructor() {
    this.apiUrl = this.config.gatewayUrl + "issue-tracking";
  }

  updateJiraDetails(
    projectId: string,
    request: JiraDetailsRequest
  ): Observable<void> {
    const req: IssueTrackerDetailsApiRequest = {
      issueTrackerProjectId: request.jiraProjectId,
    };
    return this.http
      .put<void>(
        this.apiUrl + "/projects/" + projectId + "/project-details",
        req
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  getJiraDetails(projectId: string): Observable<JiraDetailsResponse> {
    return this.http
      .get<IssueTrackerDetailsApiResponse>(
        this.apiUrl + "/projects/" + projectId + "/project-details"
      )
      .pipe(
        map(
          (response: IssueTrackerDetailsApiResponse): JiraDetailsResponse => ({
            projectId: response.projectId,
            jiraProjectId: response.issueTrackerProjectId,
            jiraBaseUrl: response.issueTrackerBaseUrl,
          })
        ),
        catchError((error) => throwError(() => error))
      );
  }
}
