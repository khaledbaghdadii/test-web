import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { Tag } from "./model/tag.model";
import { ErrorHandler } from "@mxflow/features/scm";

@Injectable()
export class TagService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  getTag(
    projectId: string,
    repositoryId: string,
    name: string
  ): Observable<Tag> {
    return this.http
      .get<Tag>(
        `${this.config.gatewayUrl}scm-operations/projects/${projectId}/repositories/${repositoryId}/tags/${name}`
      )
      .pipe(
        catchError((error) =>
          throwError(() => ErrorHandler.createErrorWithStatus(error))
        )
      );
  }
}
