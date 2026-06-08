import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { PickReferenceExecutionRequest } from "./models/pick-reference-execution-request";
import { AuthenticationService } from "@mxflow/core/auth";
import { catchError, Observable, throwError } from "rxjs";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";

@Injectable()
export class PickReferenceExecutionService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);
  private readonly authenticationService = inject(AuthenticationService);

  pickReferenceExecution(
    projectId: string,
    processId: string,
    referenceExecution: string
  ): Observable<void> {
    return this.http
      .post<void>(
        this.getApiUrl(projectId) +
          "/" +
          processId +
          "/user-input/pick-reference-execution",
        this.toPickReferenceExecutionRequest(referenceExecution)
      )
      .pipe(
        catchError((error) => throwError(() => new Error(error.error.message)))
      );
  }

  private toPickReferenceExecutionRequest(
    referenceExecution: string
  ): PickReferenceExecutionRequest {
    return {
      actionRequester: this.authenticationService.getUsername(),
      referenceExecution: referenceExecution,
    };
  }

  private getApiUrl(projectId: string) {
    return (
      this.config.gatewayUrl +
      "projects/" +
      projectId +
      "/business-process/executions/binary-upgrade"
    );
  }
}
