import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { AppConfig, APP_CONFIG } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { ProjectResponse } from "./response/project-response";
import { FeatureToggleResponse } from "./response/feature-toggle-response";
import { Project } from "./project";

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

  getFeatureToggle(projectId: string, featureId: string) {
    return this.http
      .get<FeatureToggleResponse>(
        this.apiUrl + "/" + projectId + "/feature-toggles/" + featureId
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }
}
