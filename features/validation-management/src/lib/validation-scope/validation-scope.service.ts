import { Injectable, inject } from "@angular/core";
import {
  ArtifactManagerService,
  FactoryProduct,
} from "@mxflow/features/artifact-manager";
import {
  catchError,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  throwError,
} from "rxjs";
import { ValidationScope } from "./model/validation-scope.model";
import { HttpClient } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { FactoryProductValidationScope } from "./model/factory-product-validation-scope";

@Injectable({
  providedIn: "root",
})
export class ValidationScopeService {
  private http = inject(HttpClient);
  private artifactManagerService = inject(ArtifactManagerService);

  private technicalFailureErrorMessage = "Failed to fetch the validation scope";
  private readonly apiUrl: string;

  constructor() {
    const config = inject<AppConfig>(APP_CONFIG);

    this.apiUrl = `${config.gatewayUrl}`;
  }

  getValidationScope(
    projectId: string,
    currentFactoryProductId: string | undefined,
    referenceFactoryProductId: string | undefined
  ): Observable<ValidationScope> {
    return forkJoin([
      this.getFactoryProduct(currentFactoryProductId, projectId),
      this.getFactoryProduct(referenceFactoryProductId, projectId),
    ]).pipe(
      map(([currentFactoryProduct, referenceFactoryProduct]) =>
        this.mapToValidationScope(
          currentFactoryProduct,
          referenceFactoryProduct
        )
      ),
      catchError(() => throwError(() => this.technicalFailureErrorMessage))
    );
  }

  getValidationScopeByCorrelationId(
    projectId: string,
    correlationId: string
  ): Observable<ValidationScope> {
    return this.http
      .get<FactoryProductValidationScope>(
        this.getScenarioExecutionsBaseUrl(projectId) + `/${correlationId}`
      )
      .pipe(
        switchMap((correlation) =>
          this.getValidationScope(
            projectId,
            correlation.requestedfactoryProductId,
            correlation.referenceFactoryProductId
          )
        ),
        catchError(() => throwError(() => this.technicalFailureErrorMessage))
      );
  }

  private getScenarioExecutionsBaseUrl(projectId: string): string {
    return (
      this.apiUrl +
      `projects/${projectId}/test-execution-manager/scenario-executions`
    );
  }

  private mapToValidationScope(
    currentFactoryProduct: FactoryProduct | undefined,
    referenceFactoryProduct: FactoryProduct | undefined
  ): ValidationScope {
    return {
      currentVersion: currentFactoryProduct?.softwareProduct.version,
      referenceVersion: referenceFactoryProduct?.softwareProduct.version,
    };
  }

  private getFactoryProduct(
    factoryProductId: string | undefined,
    projectId: string
  ): Observable<FactoryProduct | undefined> {
    if (factoryProductId) {
      return this.artifactManagerService.getFactoryProductById(
        factoryProductId,
        projectId
      );
    }
    return of(undefined);
  }
}
