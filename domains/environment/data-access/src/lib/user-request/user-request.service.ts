import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, map, Observable, of, throwError } from "rxjs";
import { UserRequestApiModel } from "./user-request-api-model";
import { UserRequest, UserRequestStatus } from "./user-request";
import { toDeploymentRequests } from "./user-request-mapper";

@Injectable()
export class UserRequestService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  fetchUserRequestStatus(
    projectId: string,
    requestIds: string[]
  ): Observable<UserRequestStatus> {
    if (requestIds.length === 0) {
      return of({
        environmentIds: [],
        latestRequestInProgress: false,
        latestRequestFailed: false,
      });
    }

    const params = new HttpParams().set("requestIds", requestIds.join(","));

    return this.http
      .get<UserRequestApiModel[]>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/user-requests`,
        {
          params,
        }
      )
      .pipe(
        map((apiModels) => toDeploymentRequests(apiModels)),
        map((requests) => this.toDeploymentRequestStatus(requests)),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  private toDeploymentRequestStatus(
    requests: UserRequest[]
  ): UserRequestStatus {
    const environmentIds = requests
      .map((request) => request.environmentId)
      .filter((id): id is string => id !== undefined);

    const latestRequest = requests[requests.length - 1];

    return {
      environmentIds,
      latestRequestInProgress:
        latestRequest?.environmentId === undefined &&
        latestRequest?.completedAt === undefined,
      latestRequestFailed:
        latestRequest?.environmentId === undefined &&
        latestRequest?.completedAt !== undefined,
    };
  }
}
