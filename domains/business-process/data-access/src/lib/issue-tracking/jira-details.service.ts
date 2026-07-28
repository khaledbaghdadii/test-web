import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { JiraDetails } from "./jira-details";
import { JiraDetailsApiResponse } from "./jira-details-api-response";

@Injectable({ providedIn: "root" })
export class JiraDetailsService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  getJiraDetails(projectId: string): Observable<JiraDetails> {
    return this.httpClient
      .get<JiraDetailsApiResponse>(this.buildProjectDetailsUrl(projectId))
      .pipe(
        map((response) => ({
          projectId: response.projectId,
          jiraProjectId: response.issueTrackerProjectId,
          jiraBaseUrl: response.issueTrackerBaseUrl,
        })),
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }

  private buildProjectDetailsUrl(projectId: string): string {
    return `${
      this.config.gatewayUrl
    }issue-tracking/projects/${encodeURIComponent(projectId)}/project-details`;
  }
}
