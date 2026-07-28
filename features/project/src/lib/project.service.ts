import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { AppConfig, APP_CONFIG } from "@mxflow/config";
import { catchError, map, Observable, throwError } from "rxjs";
import { ProjectResponse } from "./response/project-response";
import { FeatureToggleResponse } from "./response/feature-toggle-response";
import { CrmProjectResponse } from "./response/crm-project-response";
import { Project } from "./project";
import { CrmProject } from "./crm-project";

@Injectable({ providedIn: "root" })
export class ProjectService {
  apiUrl: string;

  constructor(@Inject(APP_CONFIG) config: AppConfig, private http: HttpClient) {
    this.apiUrl = config.gatewayUrl + "projects";
  }

  getAllProjects(): Observable<Project[]> {
    return this.http
      .get<ProjectResponse[]>(this.apiUrl)
      .pipe(catchError((error) => throwError(() => new Error(error.message))));
  }

  getViewProjects(): Observable<Project[]> {
    return this.http
      .get<ProjectResponse[]>(this.apiUrl + "/view")
      .pipe(catchError((error) => throwError(() => new Error(error.message))));
  }

  editProject(project: Project): Observable<Project> {
    return this.http
      .put<ProjectResponse>(this.apiUrl + "/" + project.id, project)
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  getProjectById(projectId: string): Observable<Project> {
    return this.http
      .get<ProjectResponse>(this.apiUrl + "/" + projectId)
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  getCrmProjects(projectId: string): Observable<CrmProject[]> {
    return this.http
      .get<CrmProjectResponse[]>(
        this.apiUrl + "/" + projectId + "/crm-projects"
      )
      .pipe(
        map((responses) =>
          responses.map(
            (response): CrmProject => ({
              id: response.id,
              projectId: response.projectId,
              externalId: response.externalId,
              name: response.name,
            })
          )
        ),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  getFeatureToggle(projectId: string, featureId: string) {
    return this.http
      .get<FeatureToggleResponse>(
        this.apiUrl + "/" + projectId + "/feature-toggles/" + featureId
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }
}
