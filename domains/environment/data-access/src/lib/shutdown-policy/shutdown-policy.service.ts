import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, map, Observable, throwError } from "rxjs";
import {
  AllocationState,
  EnvironmentShutdownPolicyState,
} from "./environment-shutdown-policy-state";

interface AllocationResponse {
  state: AllocationState;
  allocationShutdownPolicy?: ShutdownPolicyResponse;
}

interface ShutdownPolicyResponse {
  includedInShutdown?: boolean;
}

@Injectable()
export class ShutdownPolicyService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  getEnvironmentShutdownPolicyState(
    projectId: string,
    allocationId: string
  ): Observable<EnvironmentShutdownPolicyState> {
    return this.http
      .get<AllocationResponse>(
        `${this.config.gatewayUrl}projects/${projectId}/infra/management/allocations/${allocationId}`
      )
      .pipe(
        map((response) => ({
          isIncludedInShutdown:
            response?.allocationShutdownPolicy?.includedInShutdown,
          actionsAllowed: ["active", "idle"].includes(response.state),
        })),
        catchError((error) => throwError(() => new Error(error.error?.message)))
      );
  }

  includeEnvironmentInShutdownPolicy(
    projectId: string,
    allocationId: string
  ): Observable<void> {
    return this.http
      .put<void>(
        `${this.config.gatewayUrl}projects/${projectId}/infra/management/allocations/${allocationId}/include`,
        {
          policyType: "MUREX",
        }
      )
      .pipe(
        catchError((error) => throwError(() => new Error(error.error?.message)))
      );
  }

  excludeEnvironmentFromShutdownPolicy(
    projectId: string,
    allocationId: string
  ): Observable<void> {
    return this.http
      .put<void>(
        `${this.config.gatewayUrl}projects/${projectId}/infra/management/allocations/${allocationId}/exclude`,
        {
          policyType: "MUREX",
        }
      )
      .pipe(
        catchError((error) => throwError(() => new Error(error.error?.message)))
      );
  }
}
