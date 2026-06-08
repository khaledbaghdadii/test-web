import { inject, Injectable } from "@angular/core";
import { APP_CONFIG } from "@mxflow/config";
import { HttpClient } from "@angular/common/http";
import { catchError, map, Observable, throwError } from "rxjs";
import {
  InfraFamily,
  InfraFamilyApiResponse,
  CreateInfraFamilyRequest,
} from "./model/infra-family.model";

@Injectable({ providedIn: "root" })
export class InfraFamilyService {
  private readonly config = inject(APP_CONFIG);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = this.config.gatewayUrl;

  /**
   * Get all infra families for a project
   * @param projectId - The project ID
   * @returns Observable of InfraFamily array
   */
  getInfraFamilies(projectId: string): Observable<InfraFamily[]> {
    return this.http
      .get<InfraFamilyApiResponse[]>(this.getInfraFamiliesUrl(projectId))
      .pipe(
        map((apiResponse) => this.mapToInfraFamilies(apiResponse)),
        catchError(() =>
          throwError(() => new Error("Could not fetch infra families"))
        )
      );
  }

  /**
   * Create a new infra family
   * @param projectId - The project ID
   * @param request - The create infra family request
   * @returns Observable of created InfraFamily
   */
  createInfraFamily(
    projectId: string,
    request: CreateInfraFamilyRequest
  ): Observable<InfraFamily> {
    return this.http
      .post<InfraFamilyApiResponse>(
        this.getInfraFamiliesUrl(projectId),
        request
      )
      .pipe(
        map((apiResponse) => this.mapToInfraFamily(apiResponse)),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.message || "Could not create infra family"
              )
          )
        )
      );
  }

  /**
   * Delete an infra family
   * @param projectId - The project ID
   * @param infraFamilyId - The infra family ID to delete
   * @returns Observable of void
   */
  deleteInfraFamily(
    projectId: string,
    infraFamilyId: string
  ): Observable<void> {
    return this.http
      .delete<void>(this.getDeleteInfraFamilyUrl(projectId, infraFamilyId))
      .pipe(
        catchError(() =>
          throwError(() => new Error("Could not delete infra family"))
        )
      );
  }

  /**
   * Get a single infra family by ID
   * @param projectId - The project ID
   * @param infraFamilyId - The infra family ID
   * @returns Observable of InfraFamily
   */
  getInfraFamilyById(
    projectId: string,
    infraFamilyId: string
  ): Observable<InfraFamily> {
    return this.http
      .get<InfraFamilyApiResponse>(
        this.getInfraFamilyByIdUrl(projectId, infraFamilyId)
      )
      .pipe(
        map((apiResponse) => this.mapToInfraFamily(apiResponse)),
        catchError(() =>
          throwError(() => new Error("Could not fetch infra family"))
        )
      );
  }

  private getInfraFamiliesUrl(projectId: string): string {
    return `${this.apiUrl}projects/${projectId}/infra/infra-families`;
  }

  private getInfraFamilyByIdUrl(
    projectId: string,
    infraFamilyId: string
  ): string {
    return `${this.apiUrl}projects/${projectId}/infra/infra-families/${infraFamilyId}`;
  }

  private mapToInfraFamilies(
    response: InfraFamilyApiResponse[]
  ): InfraFamily[] {
    return response.map((item) => this.mapToInfraFamily(item));
  }

  private mapToInfraFamily(response: InfraFamilyApiResponse): InfraFamily {
    return {
      id: response.id,
      name: response.name,
      projectId: response.projectId,
      description: response.description,
      createdOn: response.createdOn,
      lastModifiedOn: response.lastModifiedOn,
      createdBy: response.createdBy,
      lastModifiedBy: response.lastModifiedBy,
    };
  }

  private getDeleteInfraFamilyUrl(
    projectId: string,
    infraFamilyId: string
  ): string {
    return `${this.apiUrl}projects/${projectId}/infra/infra-families/${infraFamilyId}`;
  }
}
