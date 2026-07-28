import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, Observable, throwError } from "rxjs";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import {
  FactoryProductUpdateUserActionsResponse,
  UpdateFactoryProductRequest,
  UpdateFactoryProductResponse,
} from "./models/factory-product-update.model";

@Injectable()
export class FactoryProductUpdateService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  updateFactoryProduct(
    request: UpdateFactoryProductRequest
  ): Observable<UpdateFactoryProductResponse> {
    return this.httpClient
      .post<UpdateFactoryProductResponse>(
        `${this.buildExecutionUrl(
          request.projectId,
          request.processId
        )}/user-input/update-factory-product`,
        {
          factoryProductId: request.factoryProductId,
          commitMessage: request.commitMessage,
          filesToUpdate: request.filesToUpdate,
          skipUpdate: request.skipUpdate,
        }
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }

  getFactoryProductUpdates(
    projectId: string,
    processId: string
  ): Observable<FactoryProductUpdateUserActionsResponse> {
    return this.httpClient
      .get<FactoryProductUpdateUserActionsResponse>(
        `${this.buildExecutionUrl(
          projectId,
          processId
        )}/user-actions/factory-product-actions`
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }

  private buildExecutionUrl(projectId: string, executionId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/binary-upgrade/${executionId}`;
  }
}
