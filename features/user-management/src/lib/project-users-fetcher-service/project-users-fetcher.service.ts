import { inject, Injectable } from "@angular/core";
import { catchError, Observable, throwError } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";

export interface UserResponse {
  id: string;
  mail: string;
  displayName: string;
}

export interface UserPageResponse {
  content: UserResponse[];
}

@Injectable({ providedIn: "root" })
export class ProjectUsersFetcherService {
  http = inject(HttpClient);
  config = inject(APP_CONFIG);

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
