import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, Observable, throwError } from "rxjs";
import { ProjectInfraConfigApiResponse } from "./response/project-infra-config-api-response";
import { EditProjectInfraConfigRequest } from "./request/project-infra-config";
import { CredentialsAPIResponse } from "./response/credentials-api-response";
import { UpdateCredentialsRequest } from "./request/credentials";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { ProjectInfraConfig } from "./model/project-infra-config";
import { CredentialsUri } from "./model/credentials-uri";

@Injectable()
export class ProjectInfraConfigService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);
  apiUrl = this.config.gatewayUrl;

  getProjectInfraConfig(projectId: string): Observable<ProjectInfraConfig> {
    return this.http
      .get<ProjectInfraConfig>(this.getProjectInfraConfigUrl(projectId))
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  private handleError(errorResponse: HttpErrorResponse): string {
    if (
      errorResponse.error.message === null ||
      errorResponse.error.message === ""
    ) {
      return "Operation failed!";
    } else {
      return errorResponse.error.message;
    }
  }

  getProjectInfraConfigUrl(projectId: string): string {
    return this.apiUrl + "projects/" + projectId + "/infra/registry/config";
  }

  editProjectInfraConfig(
    projectId: string,
    editProjectInfraConfigRequest: EditProjectInfraConfigRequest
  ): Observable<ProjectInfraConfig> {
    return this.http
      .put<ProjectInfraConfigApiResponse>(
        this.getProjectInfraConfigUrl(projectId),
        editProjectInfraConfigRequest
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  updateProjectDefaultSshCredentials(
    projectId: string,
    request: UpdateCredentialsRequest
  ): Observable<CredentialsUri> {
    return this.http
      .put<CredentialsAPIResponse>(
        this.getProjectInfraConfigUrl(projectId) + "/default-ssh-credentials",
        request
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  removeProjectDefaultSshCredentials(projectId: string) {
    return this.http
      .delete(
        this.getProjectInfraConfigUrl(projectId) + "/default-ssh-credentials"
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  updateProjectDefaultMssqlCredentials(
    projectId: string,
    request: UpdateCredentialsRequest
  ): Observable<CredentialsUri> {
    return this.http
      .put<CredentialsAPIResponse>(
        this.getProjectInfraConfigUrl(projectId) +
          "/default-mssql-admin-credentials",
        request
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  removeProjectDefaultMssqlCredentials(projectId: string) {
    return this.http
      .delete(
        this.getProjectInfraConfigUrl(projectId) +
          "/default-mssql-admin-credentials"
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  updateProjectDefaultOracleCredentials(
    projectId: string,
    request: UpdateCredentialsRequest
  ): Observable<CredentialsUri> {
    return this.http
      .put<CredentialsAPIResponse>(
        this.getProjectInfraConfigUrl(projectId) +
          "/default-oracle-admin-credentials",
        request
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  removeProjectDefaultOracleCredentials(projectId: string) {
    return this.http
      .delete(
        this.getProjectInfraConfigUrl(projectId) +
          "/default-oracle-admin-credentials"
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  updateProjectDefaultPostgresCredentials(
    projectId: string,
    request: UpdateCredentialsRequest
  ): Observable<CredentialsUri> {
    return this.http
      .put<CredentialsAPIResponse>(
        this.getProjectInfraConfigUrl(projectId) +
          "/default-postgres-admin-credentials",
        request
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  removeProjectDefaultPostgresCredentials(projectId: string) {
    return this.http
      .delete(
        this.getProjectInfraConfigUrl(projectId) +
          "/default-postgres-admin-credentials"
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  updateProjectDefaultSybaseCredentials(
    projectId: string,
    request: UpdateCredentialsRequest
  ): Observable<CredentialsUri> {
    return this.http
      .put<CredentialsAPIResponse>(
        this.getProjectInfraConfigUrl(projectId) +
          "/default-sybase-admin-credentials",
        request
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  removeProjectDefaultSybaseCredentials(projectId: string) {
    return this.http
      .delete(
        this.getProjectInfraConfigUrl(projectId) +
          "/default-sybase-admin-credentials"
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }
}
