import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { WorkItemsPerStatusApiResponse } from "./response/work-items-per-status-api-response.model";
import { WorkItemFilterApiRequest } from "./request/work-item-filter-api-request.model";
import { WorkItem } from "../../model/work-item";
import { WorkItemAssignableUsersApiResponse } from "./response/work-item-assignable-users-api-response.model";
import { WorkItemPageApiResponse } from "./response/work-item-page-api-response.model";

@Injectable({ providedIn: "root" })
export class WorkItemService {
  private config = inject<AppConfig>(APP_CONFIG);
  private http = inject(HttpClient);

  apiUrl: string = this.config.gatewayUrl;
  getWorkItemsPerStatus(
    filter: WorkItemFilterApiRequest = {},
    page = 0,
    size = 20
  ): Observable<WorkItemsPerStatusApiResponse> {
    const params = new HttpParams()
      .set("page", String(page))
      .set("size", String(size))
      .set("sort", "createdOn,desc");
    return this.http.post<WorkItemsPerStatusApiResponse>(
      `${this.apiUrl}work-item-management/work-items/bulk`,
      filter,
      { params }
    );
  }

  getWorkItemCategories(projectIds?: string[]): Observable<string[]> {
    let params = new HttpParams();
    params = this.appendMulti(params, "projectIds", projectIds);
    return this.http.get<string[]>(
      this.apiUrl + `work-item-management/work-items/categories`,
      { params }
    );
  }

  getWorkItemAssignableUsers(
    projectId: string,
    workItemId: string,
    page = 0,
    size = 25,
    searchKey?: string
  ): Observable<WorkItemAssignableUsersApiResponse> {
    let params = new HttpParams()
      .set("page", String(page))
      .set("size", String(size));
    params = this.setIfPresent(params, "searchKey", searchKey);
    return this.http.get<WorkItemAssignableUsersApiResponse>(
      `${this.apiUrl}work-item-management/projects/${projectId}/work-items/${workItemId}/assignable-users`,
      { params }
    );
  }

  updateWorkItemAssignee(
    projectId: string,
    workItemId: string,
    assignee?: string
  ): Observable<WorkItem> {
    return this.http.patch<WorkItem>(
      `${this.apiUrl}work-item-management/projects/${projectId}/work-items/${workItemId}/assignee`,
      { assignee: assignee ?? null }
    );
  }

  updateDueDate(
    projectId: string,
    workItemId: string,
    dueDate: Date
  ): Observable<WorkItem> {
    return this.http.patch<WorkItem>(
      `${this.apiUrl}work-item-management/projects/${projectId}/work-items/${workItemId}/dueDate`,
      { dueDate: dueDate.toISOString() }
    );
  }

  getFilteredWorkItems(
    filter: WorkItemFilterApiRequest = {},
    page = 0,
    size = 20,
    sort = "objectId,asc"
  ): Observable<WorkItemPageApiResponse> {
    const params = new HttpParams()
      .set("page", String(page))
      .set("size", String(size))
      .set("sort", sort);

    return this.http.post<WorkItemPageApiResponse>(
      `${this.apiUrl}work-item-management/work-items`,
      filter,
      { params }
    );
  }

  private appendMulti(
    params: HttpParams,
    key: string,
    values?: (string | number)[]
  ): HttpParams {
    if (!values || values.length === 0) return params;
    values.forEach((v) => {
      if (v !== undefined && v !== null) {
        params = params.append(key, String(v));
      }
    });
    return params;
  }

  private setIfPresent(
    params: HttpParams,
    key: string,
    value?: string | number | boolean
  ): HttpParams {
    if (value === undefined || value === null || value === "") return params;
    return params.set(key, String(value));
  }
}
