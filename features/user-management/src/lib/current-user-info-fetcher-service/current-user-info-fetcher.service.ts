import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";

export interface CurrentUserInfoResponse {
  userId: string | null;
  displayName: string | null;
  email: string | null;
  username: string | null;
  groups: string[];
}

@Injectable({ providedIn: "root" })
export class CurrentUserInfoFetcherService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  fetchCurrentUserInfo(): Observable<CurrentUserInfoResponse> {
    return this.http.get<CurrentUserInfoResponse>(
      `${this.config.gatewayUrl}user-management/current-user-info`
    );
  }
}
