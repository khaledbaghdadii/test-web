import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { FactoryProductFilters } from "../api-models/factory-product/factory-product-filters";
import { catchError, Observable, throwError } from "rxjs";
import { FactoryProducts } from "../api-models/factory-product/factory-product";
import {
  FactoryProductApiResponse,
  FactoryProductsApiResponse,
} from "../api-models/factory-product/factory-product-api-response";
import { SyncFactoryProductApiRequest } from "./model/request/sync-factory-product-api-request";

@Injectable({ providedIn: "root" })
export class ArtifactFactoryProductsService {
  apiUrl: string;

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.apiUrl = config.gatewayUrl;
  }

  cloneFactoryProduct(
    projectId: string,
    factoryProductId: string
  ): Observable<FactoryProductApiResponse> {
    return this.http
      .post<FactoryProductApiResponse>(
        `${this.apiUrl}artifact-management/projects/${projectId}/factory-products/${factoryProductId}/clone`,
        {}
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  getFactoryProducts(
    filters: FactoryProductFilters
  ): Observable<FactoryProducts> {
    return this.http
      .get<FactoryProductsApiResponse>(this.getFactoryProductsUrl(filters))
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  syncFactoryProduct(request: SyncFactoryProductApiRequest) {
    return this.http
      .put<FactoryProductApiResponse>(
        `${this.apiUrl}artifact-management/factory-products/sync`,
        request
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  private getFactoryProductsUrl(filters: FactoryProductFilters): string {
    let url =
      this.apiUrl +
      `artifact-management/factory-products?page=${filters.pageIndex}&size=${filters.pageSize}`;

    url += this.appendFilter(
      filters.factoryProductIdSearch,
      "factoryProductIdSearch"
    );
    url += this.appendFilter(
      filters.softwareProductVersionFilter,
      "softwareProductVersionFilter"
    );
    url += this.appendFilter(
      filters.softwareProductBuildFilter,
      "softwareProductBuildIdFilter"
    );
    url += this.appendFilter(
      filters.softwareProductVersionSearch,
      "softwareProductVersionSearch"
    );
    url += this.appendFilter(
      filters.softwareProductBuildSearch,
      "softwareProductBuildIdSearch"
    );
    url += this.appendFilter(
      filters.configurationComponentVersionSearch,
      "configurationComponentVersionSearch"
    );
    url += this.appendFilter(
      filters.configurationComponentVersionFilter,
      "configurationComponentVersionFilter"
    );
    url += this.appendFilter(
      filters.factoryProductTypeFilter,
      "factoryProductTypeFilter"
    );
    url += this.appendFilter(
      filters.softwareProductRevisionFilter,
      "softwareProductRevisionFilter"
    );
    url += this.appendFilter(
      filters.softwareProductOsFilter,
      "softwareProductOsFilter"
    );
    url += this.appendFilter(
      filters.factoryProductTypeSearch,
      "factoryProductTypeSearch"
    );
    url += this.appendFilter(
      filters.softwareProductRevisionSearch,
      "softwareProductRevisionSearch"
    );
    url += this.appendFilter(
      filters.softwareProductOsSearch,
      "softwareProductOsSearch"
    );
    url += this.appendFilter(
      filters.factoryProductValidationLevelSearch,
      "factoryProductValidationLevelSearch"
    );
    url += this.appendFilter(
      filters.parentFactoryProductIdFilter,
      "parentFactoryProductIdFilter"
    );
    url += this.appendBooleanFilter(filters.fetchGlobal, "fetchGlobal");
    url += this.appendArrayFilter(filters.projectIds, "projectIds");
    url += this.appendFilter(filters.searchKey, "searchKey");

    url += "&sort=createdOn%2Cdesc";

    return url;
  }

  private appendFilter(
    filterValue: string | undefined,
    filterName: string
  ): string {
    return filterValue
      ? `&${filterName}=${encodeURIComponent(filterValue)}`
      : "";
  }

  private appendBooleanFilter(
    filterValue: boolean | undefined,
    filterName: string
  ): string {
    return filterValue != null ? `&${filterName}=${filterValue}` : "";
  }

  private appendArrayFilter(
    filterValues: string[] | undefined,
    filterName: string
  ): string {
    return filterValues
      ? filterValues.map((value) => `&${filterName}=${value}`).join("")
      : "";
  }
}
