import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, concatMap, map, Observable, throwError } from 'rxjs';
import { ProjectApiModel } from './api-models/project-api-model';
import { Project } from '../project';
import { APP_CONFIG, AppConfig } from '@mxflow/config';
import { Repository, repositoryLabels, RepositoryService } from '@mxflow/features/repository';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  apiUrl: string;

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient,
    private repositoryService: RepositoryService
  ) {
    this.apiUrl = config.gatewayUrl + 'projects/';
  }

  private static toProject(apiModel: ProjectApiModel, repositories: Repository[]): Project {
    return {
      id: apiModel.id,
      name: apiModel.name,
      type: apiModel.type,
      description: apiModel.description,
      testRepositories: repositories.filter(
        (repository) => repository.label.toLowerCase() === repositoryLabels.TEST_REPOSITORY.toLowerCase()
      ),
    };
  }

  getProject(projectId: string): Observable<Project> {
    return this.repositoryService.getAllRepositories(projectId).pipe(
      concatMap((repositories) => {
        return this.http.get<ProjectApiModel>(this.apiUrl + `${projectId}`).pipe(
          map((project) => ProjectService.toProject(project, repositories)),
          catchError((error) => throwError(() => new Error(error.error)))
        );
      })
    );
  }
}
