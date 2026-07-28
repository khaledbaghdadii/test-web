import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import {
  FinalProduct,
  FinalProductFilters,
  FinalProducts,
} from "./final-product.model";

@Injectable({ providedIn: "root" })
export class FinalProductApiService {
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);
  private readonly http = inject(HttpClient);

  getFinalProducts(
    projectId: string,
    filters: FinalProductFilters = {}
  ): Observable<FinalProducts> {
    let params = new HttpParams()
      .set("page", (filters.page ?? 0).toString())
      .set("size", (filters.size ?? 50).toString());

    if (filters.sort) {
      params = params.set("sort", filters.sort);
    }
    if (filters.branchFilter) {
      params = params.set("branchFilter", filters.branchFilter);
    }
    if (filters.configurationCommitIdFilter) {
      params = params.set(
        "configurationCommitIdFilter",
        filters.configurationCommitIdFilter
      );
    }
    if (filters.fetchParent !== undefined) {
      params = params.set("fetchParent", filters.fetchParent.toString());
    }
    if (filters.stateFilter?.length) {
      params = params.set("stateFilter", filters.stateFilter.join(","));
    }
    if (filters.validationLevelFilter?.length) {
      filters.validationLevelFilter.forEach((validationLevel) => {
        params = params.append("validationLevelFilter", validationLevel);
      });
    }
    if (filters.searchKey) {
      params = params.set("searchKey", filters.searchKey);
    }

    return this.http
      .get<FinalProducts>(this.getBaseUrl(projectId), { params })
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  getFinalProductById(
    projectId: string,
    finalProductId: string
  ): Observable<FinalProduct> {
    return this.http
      .get<FinalProduct>(
        `${this.getBaseUrl(projectId)}/${encodeURIComponent(finalProductId)}`
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private getBaseUrl(projectId: string): string {
    return `${
      this.config.gatewayUrl
    }artifact-management/projects/${encodeURIComponent(
      projectId
    )}/final-products`;
  }
}
