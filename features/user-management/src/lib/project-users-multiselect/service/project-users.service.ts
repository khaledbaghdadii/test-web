import { inject, Injectable } from "@angular/core";
import { catchError, Observable, throwError } from "rxjs";
import { FetchProjectUsersRequest } from "../model/fetch-project-users-request";
import { APP_CONFIG } from "@mxflow/config";
import { UsersPageResponse } from "../model/users";
import { HttpClient, HttpParams } from "@angular/common/http";
import { handleError } from "../../../../../../core/error-handler/src/lib/error-utils";

@Injectable()
export class ProjectUsersService {
  private readonly httpClient = inject(HttpClient);
  private readonly appConfig = inject(APP_CONFIG);
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
        catchError((error) => throwError(() => new Error(handleError(error))))
      );
  }

  private buildGetProjectUsersUrl(projectId: string) {
    return `${this.apiUrl}/projects/${projectId}/users`;
  }
}
