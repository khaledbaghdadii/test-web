import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";

export interface RepositoryDetails {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly defaultBranch: string;
}

@Injectable()
export class RepositoryService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  getRepository(
    projectId: string,
    repositoryId: string
  ): Observable<RepositoryDetails> {
    return this.http
      .get<RepositoryDetails>(
        `${this.config.gatewayUrl}projects/${projectId}/repositories/${repositoryId}`
      )
      .pipe(
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.message ??
                  error?.message ??
                  "Failed to fetch repository"
              )
          )
        )
      );
  }
}
