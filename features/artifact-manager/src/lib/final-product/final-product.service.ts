import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient, HttpParams } from "@angular/common/http";
import { catchError, Observable, throwError } from "rxjs";
import {
  FinalProductApiResponse,
  FinalProductsApiResponse,
} from "./model/final-product-api-response";
import { FinalProducts } from "./model/final-product";
import { FinalProductFilters } from "./model/final-product-filters";
import { SyncFinalProductApiRequest } from "./model/sync-final-product-api-request";

@Injectable({ providedIn: "root" })
export class FinalProductService {
  apiUrl: string;

  constructor(@Inject(APP_CONFIG) config: AppConfig, private http: HttpClient) {
    this.apiUrl = config.gatewayUrl;
  }

  getFinalProductById(finalProductId: string, projectId: string) {
    return this.http
      .get<FinalProductApiResponse>(
        this.getFinalProductByIdUrl(finalProductId, projectId)
      )
      .pipe(
        catchError((error) =>
          throwError(() => {
            return new Error(error.error.message);
          })
        )
      );
  }

  getFinalProducts(
    filters: FinalProductFilters,
    projectId: string
  ): Observable<FinalProducts> {
    const queryParams = this.getFinalProductsHttpParams(filters);
    return this.http
      .get<FinalProductsApiResponse>(this.getFinalProductUrl(projectId), {
        params: queryParams,
      })
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  getFilteredFinalProducts(
    filters: FinalProductFilters
  ): Observable<FinalProducts> {
    const queryParams = this.getFilteredFinalProductsHttpParams(filters);
    return this.http
      .get<FinalProductsApiResponse>(
        `${this.apiUrl}artifact-management/final-products`,
        {
          params: queryParams,
        }
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  syncFinalProduct(
    projectId: string,
    finalProductId: string,
    request: SyncFinalProductApiRequest
  ): Observable<void> {
    return this.http
      .post<void>(
        this.createSyncFinalProductUrl(projectId, finalProductId),
        request
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  private getFinalProductByIdUrl(
    finalProductId: string | undefined,
    projectId: string
  ): string {
    return (
      this.apiUrl +
      `artifact-management/projects/${projectId}/final-products/${finalProductId}`
    );
  }

  private getFinalProductsHttpParams(filters: FinalProductFilters): HttpParams {
    const filtersWithNoEmptyValues = Object.fromEntries(
      Object.entries(filters).filter(
        ([, value]) => value !== undefined && value !== "" && value !== null
      )
    );
    const params = { fromObject: { ...filtersWithNoEmptyValues } };
    return new HttpParams(params);
  }

  private getFilteredFinalProductsHttpParams(
    filters: FinalProductFilters
  ): HttpParams {
    const filtersWithNoUndefinedAndNullValues = Object.fromEntries(
      Object.entries(filters).filter(
        ([, value]) => value !== undefined && value !== null
      )
    );
    const params = { fromObject: { ...filtersWithNoUndefinedAndNullValues } };
    return new HttpParams(params);
  }

  private getFinalProductUrl(projectId: string): string {
    return `${this.apiUrl}artifact-management/projects/${projectId}/final-products`;
  }

  private createSyncFinalProductUrl(
    projectId: string,
    finalProductId: string
  ): string {
    return `${this.apiUrl}artifact-management/projects/${projectId}/final-products/${finalProductId}/sync`;
  }
}
