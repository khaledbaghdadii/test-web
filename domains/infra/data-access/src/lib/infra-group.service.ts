import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";

export interface InfraGroup {
  readonly id: string;
  readonly name: string;
}

@Injectable()
export class InfraGroupService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  getGroup(projectId: string, groupId: string): Observable<InfraGroup> {
    return this.http
      .get<InfraGroup>(
        `${this.config.gatewayUrl}projects/${projectId}/infra/registry/groups/${groupId}`
      )
      .pipe(
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.message ??
                  error?.message ??
                  "Failed to fetch infra group"
              )
          )
        )
      );
  }
}
