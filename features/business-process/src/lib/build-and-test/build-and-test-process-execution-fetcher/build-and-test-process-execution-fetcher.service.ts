import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { catchError, map, Observable, throwError } from "rxjs";
import { BuildAndTestProcessExecution } from "../build-and-test-process-execution";
import { BuildAndTestProcessExecutionApiModel } from "./mapper/build-and-test-process-execution-api-model";
import { BuildAndTestProcessExecutionMapperService } from "./mapper/build-and-test-process-execution-mapper.service";
import { handleError } from "../../../../../../core/error-handler/src/lib/error-utils";

@Injectable({ providedIn: "root" })
export class BuildAndTestProcessExecutionFetcherService {
  httpClient = inject(HttpClient);
  appConfig = inject(APP_CONFIG);
  mapper = inject(BuildAndTestProcessExecutionMapperService);

  getBuildAndTestProcessExecution(
    projectId: string,
    ciProcessId: string
  ): Observable<BuildAndTestProcessExecution> {
    return this.httpClient
      .get<BuildAndTestProcessExecutionApiModel>(
        `${this.getApiUrl(projectId)}/${ciProcessId}`
      )
      .pipe(
        map((response) => this.mapper.map(response)),
        catchError((error) => throwError(() => new Error(handleError(error))))
      );
  }

  private getApiUrl(projectId: string) {
    return (
      this.appConfig.gatewayUrl +
      "projects/" +
      projectId +
      "/business-process/executions/ci-process"
    );
  }
}
