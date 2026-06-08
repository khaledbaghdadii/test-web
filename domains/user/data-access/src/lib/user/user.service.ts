import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { forkJoin, Observable, of } from "rxjs";
import type { UserApiResponse } from "./user-api-model";

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
}
