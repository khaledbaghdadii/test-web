import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { Group } from "./group";
import { catchError, map, Observable, throwError } from "rxjs";
import { GroupApiModel } from "./group-api-model";

@Injectable()
export class GroupService {
  apiUrl: string;

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.apiUrl = config.gatewayUrl + "projects/";
  }

  getAllGroups(prefix: string): Observable<Group[]> {
    return this.http
      .get<GroupApiModel[]>(this.buildGetAllGroupsUrl(prefix))
      .pipe(
        map((apiModels) => this.toGroups(apiModels)),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  getGroups(projectId: string): Observable<Group[]> {
    return this.http
      .get<GroupApiModel[]>(this.buildGetGroupsUrl(projectId))
      .pipe(
        map((apiModels) => this.toGroups(apiModels)),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  private buildGetAllGroupsUrl(prefix: string) {
    const url = `${this.apiUrl}groups`;
    return prefix ? `${url}?prefix=${prefix}` : url;
  }

  private buildGetGroupsUrl(projectId: string) {
    return `${this.apiUrl}${projectId}/groups`;
  }

  toGroups(groupsApiModels: GroupApiModel[]): Group[] {
    return groupsApiModels.map(
      (apiModel: GroupApiModel): Group => this.toGroup(apiModel)
    );
  }

  toGroup(groupApiModel: GroupApiModel): Group {
    return {
      id: groupApiModel.id,
      displayName: groupApiModel.displayName,
    };
  }
}
