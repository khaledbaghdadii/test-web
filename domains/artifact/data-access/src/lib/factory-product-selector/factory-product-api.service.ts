import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { PageResponse } from "@mxflow/ui/mxevolve-dropdown";
import { FactoryProducts, FactoryProduct } from "./models/factory-product";
import { FactoryProductFilters } from "./models/factory-product-filters";
import { SoftwareProductVersion } from "./models/software-product-version";
import { SoftwareProductBuild } from "./models/software-product-build";

interface SpringPage<T> {
  content: T[];
  last: boolean;
}

@Injectable({ providedIn: "root" })
export class FactoryProductApiService {
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = this.config.gatewayUrl;

  getFactoryProducts(
    projectId: string,
    filters: FactoryProductFilters
  ): Observable<FactoryProducts> {
    let params = new HttpParams()
      .set("page", (filters.pageIndex ?? 0).toString())
      .set("size", (filters.pageSize ?? 10).toString())
      .set("sort", "createdOn,asc");

    if (filters.softwareProductVersionFilter) {
      params = params.set(
        "softwareProductVersionFilter",
        filters.softwareProductVersionFilter
      );
    }
    if (filters.softwareProductBuildFilter) {
      params = params.set(
        "softwareProductBuildIdFilter",
        filters.softwareProductBuildFilter
      );
    }
    if (filters.configurationComponentVersionSearch) {
      params = params.set(
        "configurationComponentVersionSearch",
        filters.configurationComponentVersionSearch
      );
    }
    if (filters.fetchGlobal != null) {
      params = params.set("fetchGlobal", filters.fetchGlobal.toString());
    }

    return this.http
      .get<FactoryProducts>(
        `${this.apiUrl}artifact-management/projects/${encodeURIComponent(
          projectId
        )}/factory-products`,
        { params }
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  getFactoryProductById(
    projectId: string,
    factoryProductId: string
  ): Observable<FactoryProduct> {
    return this.http
      .get<FactoryProduct>(
        `${this.apiUrl}artifact-management/projects/${encodeURIComponent(
          projectId
        )}/factory-products/${encodeURIComponent(factoryProductId)}`
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  getDistinctVersions(
    projectId: string,
    page: number,
    size: number,
    search?: string
  ): Observable<PageResponse<SoftwareProductVersion>> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString());

    if (search) {
      params = params.set("searchKey", search);
    }

    return this.http
      .get<SpringPage<SoftwareProductVersion>>(
        `${this.apiUrl}artifact-management/projects/${encodeURIComponent(
          projectId
        )}/factory-products/software-product-versions`,
        { params }
      )
      .pipe(
        map((springPage) => ({
          content: springPage.content,
          last: springPage.last,
        })),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  getDistinctBuilds(
    projectId: string,
    softwareProductVersion: string,
    page: number,
    size: number,
    search?: string
  ): Observable<PageResponse<SoftwareProductBuild>> {
    let params = new HttpParams()
      .set("softwareProductVersion", softwareProductVersion)
      .set("page", page.toString())
      .set("size", size.toString());

    if (search) {
      params = params.set("searchKey", search);
    }

    return this.http
      .get<SpringPage<SoftwareProductBuild>>(
        `${this.apiUrl}artifact-management/projects/${encodeURIComponent(
          projectId
        )}/factory-products/software-product-builds`,
        { params }
      )
      .pipe(
        map((springPage) => ({
          content: springPage.content,
          last: springPage.last,
        })),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }
}
