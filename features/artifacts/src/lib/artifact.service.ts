import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, forkJoin, map, Observable, throwError } from "rxjs";
import { Artifact } from "./artifact";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { ArtifactNameResponse } from "./artifact-name-response";
import { ArtifactValuesResponse } from "./artifact-values-response";
import { ArtifactValuesRequest } from "./artifact-values-request";

@Injectable()
export class ArtifactService {
  apiUrl: string;
  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.apiUrl = config.gatewayUrl;
  }
  getArtifacts(projectId: string): Observable<Artifact[]> {
    const artifactNames = this.getArtifactNames();
    const artifactValues = this.getArtifactValues(projectId);

    return forkJoin([artifactNames, artifactValues]).pipe(
      map((result) =>
        result[0].map((artifactName) => {
          const artifactValue =
            result[1].find((pv) => pv.id === artifactName.id) || null;
          return {
            id: artifactName.id,
            projectId: projectId,
            name: artifactName.name,
            artifactManagerId: artifactValue?.artifactManagerId,
            version: artifactValue?.version,
          };
        })
      )
    );
  }

  getArtifactNames(): Observable<ArtifactNameResponse[]> {
    return this.http
      .get<ArtifactNameResponse[]>(this.apiUrl + "bundles")
      .pipe(catchError(() => throwError(() => new Error())));
  }

  getArtifactValues(projectId: string): Observable<ArtifactValuesResponse[]> {
    return this.http.get<ArtifactValuesResponse[]>(
      this.apiUrl + "projects/" + projectId + "/artifacts"
    );
  }

  saveArtifactValues(
    projectId: string,
    artifactValuesRequest: ArtifactValuesRequest
  ): Observable<void> {
    return this.http.post<void>(
      this.apiUrl + "projects/" + projectId + "/artifacts",
      artifactValuesRequest
    );
  }
}
