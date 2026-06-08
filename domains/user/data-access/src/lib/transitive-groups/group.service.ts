import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { type Observable, EMPTY, expand, reduce } from "rxjs";

export interface Group {
  id: string;
  name: string;
}

export interface GroupsPage {
  content: Group[];
  last: boolean;
}

@Injectable()
export class GroupService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  getTransitiveGroups(page = 0, size = 100): Observable<GroupsPage> {
    return this.http.get<GroupsPage>(
      `${this.config.gatewayUrl}user-management/current-user/transitive-groups`,
      { params: { page, size } }
    );
  }

  getAllTransitiveGroups(size = 100): Observable<Group[]> {
    let currentPage = 0;
    return this.getTransitiveGroups(currentPage, size).pipe(
      expand((response) =>
        response.last ? EMPTY : this.getTransitiveGroups(++currentPage, size)
      ),
      reduce(
        (allGroups, response) => [...allGroups, ...response.content],
        [] as Group[]
      )
    );
  }
}
