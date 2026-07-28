import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, forkJoin, Observable, of, throwError } from "rxjs";
import type { UserApiResponse, UserPageResponse } from "./user-api-model";

@Injectable()
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  fetchByIds(
    projectId: string,
    userIds: string[]
  ): Observable<UserApiResponse[]> {
    if (userIds.length === 0) return of([]);
    return forkJoin(
      userIds.map((userId) =>
        this.http.get<UserApiResponse>(
          `${this.config.gatewayUrl}projects/${projectId}/users/${userId}`
        )
      )
    );
  }

  /**
   * Resolves prefilled notification recipients back to user objects.
   * Migrated from the business-process new-arch `ProjectUsersFetcherService`
   * (itself migrated verbatim from the legacy
   * `web/libs/features/user-management/src/lib/project-users-fetcher-service/project-users-fetcher.service.ts`),
   * consolidated here alongside the other user lookup (VAL-27132 follow-up
   * cleanup). Note this hits a different provider (`user-management-service`)
   * than {@link fetchByIds} (`project-definition-service`).
   */
  fetchUsersByEmails(
    projectId: string,
    emails: string[]
  ): Observable<UserPageResponse> {
    return this.http
      .get<UserPageResponse>(
        `${this.config.gatewayUrl}user-management/projects/${projectId}/users`,
        {
          params: {
            userEmails: emails,
          },
        }
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }
}
