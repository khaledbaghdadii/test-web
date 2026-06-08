import { Inject, Injectable } from "@angular/core";
import { catchError, map, Observable, throwError } from "rxjs";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient } from "@angular/common/http";
import { RepositoryApiModel } from "./api-model/repository-api-model";
import { Repository, repositoryLabels } from "./repository";
import { RepositoryApiModelSummary } from "./api-model/repository-api-model-summary";
import { RepositorySummary } from "./repository-summary";
import { UpdateRepositoryCredentialsRequest } from "./request/update-repository-credentials-request";
@Injectable({ providedIn: "root" })
export class RepositoryService {
  apiUrl: string;
  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.apiUrl = config.gatewayUrl + "projects/";
  }

  private static toRepositories(repoApiModels: RepositoryApiModel[]) {
    return repoApiModels.map(RepositoryService.toRepository);
  }

  private static toRepository(apiModel: RepositoryApiModel): Repository {
    return {
      id: apiModel.id,
      name: apiModel.name,
      url: apiModel.url,
      credentialsId: apiModel.credentialsId,
      label: apiModel.label,
      defaultBranch: apiModel.defaultBranch,
    };
  }
  private static toRepositorySummary(
    apiModel: RepositoryApiModelSummary
  ): RepositorySummary {
    return {
      id: apiModel.id,
      name: apiModel.name,
      url: apiModel.url,
      defaultBranch: apiModel.defaultBranch,
    };
  }
  createRepo(
    projectId: string,
    repoDetails: {
      name: string;
      url: string;
      username: string | undefined;
      pass: string | undefined;
      label: string | undefined;
      defaultBranch: string;
    }
  ): Observable<RepositorySummary> {
    return this.http
      .post<RepositoryApiModelSummary>(
        this.apiUrl + `${projectId}/repositories`,
        repoDetails
      )
      .pipe(
        map(RepositoryService.toRepositorySummary),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  editRepo(
    projectId: string,
    repoId: string,
    repoDetails: {
      name: string;
      url: string;
      defaultBranch: string;
    }
  ): Observable<RepositorySummary> {
    return this.http
      .put<RepositoryApiModelSummary>(
        this.apiUrl + `${projectId}/repositories/${repoId}`,
        repoDetails
      )
      .pipe(
        map(RepositoryService.toRepositorySummary),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  editRepoCredentials(
    projectId: string,
    repoId: string,
    credentials: UpdateRepositoryCredentialsRequest
  ): Observable<void> {
    return this.http
      .put<void>(
        this.apiUrl + `${projectId}/repositories/${repoId}/credentials`,
        credentials
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  deleteRepo(projectId: string, repoId: string): Observable<void> {
    return this.http
      .delete<void>(this.apiUrl + `${projectId}/repositories/` + repoId)
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  getRepoById(projectId: string, repoId: string): Observable<Repository> {
    return this.http
      .get<RepositoryApiModel>(
        this.apiUrl + `${projectId}/repositories/${repoId}`
      )
      .pipe(
        map(RepositoryService.toRepository),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  getAllRepositories(projectId: string): Observable<Repository[]> {
    return this.http
      .get<RepositoryApiModel[]>(this.apiUrl + `${projectId}/repositories`)
      .pipe(
        map(RepositoryService.toRepositories),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  getTestRepositories(projectId: string): Observable<Repository[]> {
    return this.getAllRepositories(projectId).pipe(
      map((repositories) =>
        repositories.filter(
          (repository) =>
            repository.label.toLowerCase() ===
            repositoryLabels.TEST_REPOSITORY.toLowerCase()
        )
      )
    );
  }
}
