import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient } from "@angular/common/http";
import { catchError, map, Observable, throwError } from "rxjs";
import { ArtifactManagerApiModel } from "./api-models/artifact-manager-api-model";
import { ArtifactManager } from "./artifact-manager";
import {
  FactoryProductApiResponse,
  FactoryProductsApiResponse,
} from "./api-models/factory-product/factory-product-api-response";
import { FactoryProducts } from "./api-models/factory-product/factory-product";
import { FactoryProductFilters } from "./api-models/factory-product/factory-product-filters";

@Injectable({ providedIn: "root" })
export class ArtifactManagerService {
  apiUrl: string;

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.apiUrl = config.gatewayUrl;
  }

  private static toArtifactManagers(
    managerApiModels: ArtifactManagerApiModel[]
  ): ArtifactManager[] {
    return managerApiModels.map(ArtifactManagerService.toArtifactManager);
  }

  private static toArtifactManager(
    apiModel: ArtifactManagerApiModel
  ): ArtifactManager {
    return {
      id: apiModel.id,
      name: apiModel.name,
      url: apiModel.url,
      credentialsId: apiModel.credentialsId,
    };
  }

  getAllArtifactManagers(projectId: string): Observable<ArtifactManager[]> {
    return this.http
      .get<ArtifactManagerApiModel[]>(
        this.apiUrl + `projects/${projectId}/artifact-managers`
      )
      .pipe(
        map(ArtifactManagerService.toArtifactManagers),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  editArtifactManager(
    projectId: string,
    artifactManagerId: string,
    artifactManagerDetails: any
  ): Observable<ArtifactManager> {
    return this.http
      .put<ArtifactManagerApiModel>(
        this.apiUrl +
          `projects/${projectId}/artifact-managers/${artifactManagerId}`,
        artifactManagerDetails
      )
      .pipe(
        map(ArtifactManagerService.toArtifactManager),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  createArtifactManager(
    projectId: string,
    artifactManagerDetails: any
  ): Observable<ArtifactManager> {
    return this.http
      .post<ArtifactManagerApiModel>(
        this.apiUrl + `projects/${projectId}/artifact-managers`,
        artifactManagerDetails
      )
      .pipe(
        map(ArtifactManagerService.toArtifactManager),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  deleteArtifactManager(
    projectId: string,
    artifactManagerId: string
  ): Observable<void> {
    return this.http
      .delete<void>(
        this.apiUrl +
          `projects/${projectId}/artifact-managers/` +
          artifactManagerId
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  getFactoryProducts(
    filters: FactoryProductFilters,
    projectId: string
  ): Observable<FactoryProducts> {
    return this.http
      .get<FactoryProductsApiResponse>(
        this.getFactoryProductUrl(filters, projectId)
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  getFactoryProductById(factoryProductId: string, projectId: string) {
    return this.http
      .get<FactoryProductApiResponse>(
        this.geFactoryProductByIdUrl(factoryProductId, projectId)
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private geFactoryProductByIdUrl(
    factoryProductId: string,
    projectId: string
  ): string {
    return (
      this.apiUrl +
      `artifact-management/projects/${projectId}/factory-products/${factoryProductId}`
    );
  }

  private getFactoryProductUrl(
    filters: FactoryProductFilters,
    projectId: string
  ): string {
    let url =
      this.apiUrl +
      `artifact-management/projects/${projectId}/factory-products?page=${filters.pageIndex}&size=${filters.pageSize}`;

    if (filters.parentFactoryProductIdFilter) {
      url += `&parentFactoryProductIdFilter=${encodeURIComponent(
        filters.parentFactoryProductIdFilter
      )}`;
    }
    if (filters.softwareProductVersionFilter) {
      url += `&softwareProductVersionFilter=${encodeURIComponent(
        filters.softwareProductVersionFilter
      )}`;
    }

    if (filters.softwareProductBuildFilter) {
      url += `&softwareProductBuildIdFilter=${encodeURIComponent(
        filters.softwareProductBuildFilter
      )}`;
    }

    if (filters.softwareProductVersionSearch) {
      url += `&softwareProductVersionSearch=${encodeURIComponent(
        filters.softwareProductVersionSearch
      )}`;
    }

    if (filters.softwareProductBuildSearch) {
      url += `&softwareProductBuildIdSearch=${encodeURIComponent(
        filters.softwareProductBuildSearch
      )}`;
    }

    if (filters.configurationComponentVersionSearch) {
      url += `&configurationComponentVersionSearch=${encodeURIComponent(
        filters.configurationComponentVersionSearch
      )}`;
    }

    url += "&sort=createdOn%2Casc";

    return url;
  }
}
