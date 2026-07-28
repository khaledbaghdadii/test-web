import { inject, Injectable } from "@angular/core";
import { catchError, Observable, throwError } from "rxjs";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import {
  FetchProjectUsersRequest,
  UsersPageResponse,
} from "./models/project-user.model";

/**
 * New-architecture migration (copied verbatim) of the paginated project-users
 * search from the legacy
 * `web/libs/features/user-management/src/lib/project-users-multiselect/service/project-users.service.ts`.
 * Feeds the notifications-recipients multiselect. `handleError` is inlined here
 * (the legacy reached into `core/error-handler/src/lib/error-utils`, which is
 * not exported through the public barrel). No pact test exists for this
 * endpoint on the legacy side, so none is added (see
 * devo/feature/VAL-27132/open-points.md item #2).
 */
@Injectable()
export class ProjectUsersService {
  private readonly httpClient = inject(HttpClient);
  private readonly appConfig = inject(GATEWAY_CONFIG);
  private readonly SIZE_PARAM = "size";
  private readonly PAGE_PARAM = "page";
  private readonly SEARCH_KEY_PARAM = "searchKey";
  private readonly apiUrl = `${this.appConfig.gatewayUrl}user-management`;

  getProjectUsers(
    request: FetchProjectUsersRequest
  ): Observable<UsersPageResponse> {
    let params = new HttpParams()
      .set(this.SIZE_PARAM, request.pageSize.toString())
      .set(this.PAGE_PARAM, request.pageIndex.toString());
    if (request.searchKey) {
      params = params.set(this.SEARCH_KEY_PARAM, request.searchKey);
    }
    return this.httpClient
      .get<UsersPageResponse>(this.buildGetProjectUsersUrl(request.projectId), {
        params: params,
      })
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(this.handleError(error)))
        )
      );
  }

  private handleError(error: HttpErrorResponse): string {
    if (error?.error?.message == null) {
      return error?.error;
    }
    return error?.error?.message;
  }

  private buildGetProjectUsersUrl(projectId: string): string {
    return `${this.apiUrl}/projects/${projectId}/users`;
  }
}
