import { HttpClient, HttpParams } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { UserProfilePicture } from "./user-profile-picture";
import { User, Users } from "./user";
import { UserApiModel, UsersApiModel } from "./user-api-model";

@Injectable()
export class UserService {
  apiUrl: string;

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.apiUrl = config.gatewayUrl + "projects/";
  }

  getUsersByBpcIds(
    bpcIds: string[],
    projectId: string,
    pageSize: number,
    pageIndex: number,
    name: string
  ): Observable<Users> {
    const params = new HttpParams()
      .set("bpcIds", bpcIds.join(","))
      .set("size", pageSize)
      .set("page", pageIndex)
      .set("username", name);
    return this.http.get<UsersApiModel>(this.apiUrl + projectId + "/users", {
      params,
    });
  }

  getUserById(id: string, projectId: string): Observable<User> {
    return this.http
      .get<UserApiModel>(`${this.apiUrl + projectId}/users/${id}`)
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  getUserProfilePicture(): Observable<UserProfilePicture> {
    return this.http.get<UserProfilePicture>(
      `${this.apiUrl}users/profile-picture`
    );
  }
}
