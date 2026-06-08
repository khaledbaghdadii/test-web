import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, Observable, throwError } from "rxjs";
import {
  FinalProduct,
  FinalProductFilters,
  FinalProducts,
} from "./final-product.model";

@Injectable({ providedIn: "root" })
export class FinalProductService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  getFinalProductById(
    projectId: string,
    finalProductId: string
  ): Observable<FinalProduct> {
    return this.http
      .get<FinalProduct>(
        `${this.baseProjectUrl(projectId)}/${encodeURIComponent(
          finalProductId
        )}`
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.error))
        )
      );
  }

  getFinalProducts(
    projectId: string,
    filters: FinalProductFilters = {}
  ): Observable<FinalProducts> {
    return this.http
      .get<FinalProducts>(this.baseProjectUrl(projectId), {
        params: this.toHttpParams(filters),
      })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.error))
        )
      );
  }

  private baseProjectUrl(projectId: string): string {
    return `${this.config.gatewayUrl}artifact-management/projects/${encodeURIComponent(
      projectId
    )}/final-products`;
  }

  private toHttpParams(filters: FinalProductFilters): HttpParams {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;

      if (Array.isArray(value)) {
        value.forEach((item) => {
          params = params.append(key, item);
        });
        return;
      }

      params = params.set(key, String(value));
    });

    return params;
  }
}
