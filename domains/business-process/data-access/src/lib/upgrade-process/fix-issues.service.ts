import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, throwError } from "rxjs";

@Injectable()
export class FixIssuesService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  fixIssues(projectId: string, processId: string) {
    return this.httpClient
      .post(
        `${this.getApiUrl(projectId)}/${processId}/user-input/fix-issues`,
        ""
      )
      .pipe(
        catchError((error) => throwError(() => new Error(error.error.message)))
      );
  }

  private getApiUrl(projectId: string) {
    return (
      this.config.gatewayUrl +
      "projects/" +
      projectId +
      "/business-process/executions/binary-upgrade"
    );
  }
}
