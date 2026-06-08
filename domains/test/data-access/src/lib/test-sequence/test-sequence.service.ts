import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient, HttpParams } from "@angular/common/http";
import { catchError, Observable, throwError } from "rxjs";
import {
  FetchTestSelectionsRequest,
  TestSelectionTreeNode,
  TestSequenceSummaryModel,
} from "@mxevolve/domains/test/model";

@Injectable()
export class TestSequenceService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);
  private readonly apiUrl = this.config.gatewayUrl;

  fetchTestSequences(
    projectId: string,
    repositoryId: string,
    branch: string
  ): Observable<TestSequenceSummaryModel[]> {
    const params = new HttpParams()
      .append("repositoryId", repositoryId)
      .append("source", branch);
    return this.http
      .get<TestSequenceSummaryModel[]>(
        this.config.gatewayUrl + `projects/${projectId}/test-sequences`,
        { params }
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  fetchTestSelections(
    request: FetchTestSelectionsRequest
  ): Observable<TestSelectionTreeNode> {
    return this.http
      .get<TestSelectionTreeNode>(
        `${this.getBaseUrl(request.projectId)}/${
          request.testSequenceName
        }/test-selections`,
        {
          params: {
            repositoryId: request.repositoryId,
            source: request.source,
          },
        }
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private getBaseUrl(projectId: string) {
    return `${this.apiUrl}projects/${projectId}/test-sequences`;
  }
}
