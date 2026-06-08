import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { CreateBinaryRegressionRequest } from "./create-binary-regression-modal/create-binary-regression-request.model";
import { catchError, map, Observable, throwError } from "rxjs";
import { BinaryRegression } from "./binary-regression";
import { BinaryRegressionApiResponse } from "./binary-regression-api-response.model";
import { EditBinaryRegressionRequest } from "./edit-binary-regression-modal/edit-binary-regression-request";
import {
  FetchBinaryRegressionsResponse,
  LiteBinaryRegression,
} from "./model/lite-binary-regression.model";
import {
  FetchBinaryRegressionsApiResponse,
  LiteBinaryRegressionApiResponse,
} from "./model/lite-binary-regression-api-response.model";
import {
  FetchBinaryRegressionsRequest,
  Pageable,
} from "./model/fetch-binary-regressions-request";

@Injectable({
  providedIn: "root",
})
export class BinaryRegressionDataService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  private readonly apiUrl: string;

  constructor() {
    const config = this.config;

    this.apiUrl = `${config.gatewayUrl}`;
  }

  createBinaryRegression(
    projectId: string,
    request: CreateBinaryRegressionRequest
  ): Observable<string> {
    const trimmedRequest = {
      title: request.title.trim(),
      description: request.description,
      mxVersion: request.mxVersion.trim(),
      defect: request.defect?.trim(),
      fix: request.fix?.trim(),
      incidentId: request.incidentId?.trim(),
    } as CreateBinaryRegressionRequest;
    return this.http
      .post<{ id: string }>(
        this.apiUrl +
          `projects/${projectId}/failure-management/regressions/binary`,
        trimmedRequest
      )
      .pipe(
        map((response) => response.id),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  fetchAll(
    pageable: Pageable,
    request: FetchBinaryRegressionsRequest = {}
  ): Observable<FetchBinaryRegressionsResponse> {
    const queryParams = new HttpParams({ fromObject: { ...pageable } });
    return this.http
      .post<FetchBinaryRegressionsApiResponse>(this.getFetchAllUrl(), request, {
        params: queryParams,
      })
      .pipe(
        map((response) => this.map(response)),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  fetchByIds(ids: string[]): Observable<LiteBinaryRegression[]> {
    const pageable: Pageable = this.buildFetchBinaryRegressionsPageable(ids);
    const request: FetchBinaryRegressionsRequest =
      this.buildFetchBinaryRegressionsRequest(ids);
    return this.fetchAll(pageable, request).pipe(
      map((response) => response.binaryRegressions.content),
      catchError((error) => throwError(() => new Error(error.error)))
    );
  }

  private buildFetchBinaryRegressionsPageable(binaryRegressionIds: string[]) {
    return {
      page: 0,
      size: binaryRegressionIds.length,
    } as Pageable;
  }

  private buildFetchBinaryRegressionsRequest(binaryRegressionIds: string[]) {
    return {
      ids: binaryRegressionIds,
    } as FetchBinaryRegressionsRequest;
  }

  private map(
    response: FetchBinaryRegressionsApiResponse
  ): FetchBinaryRegressionsResponse {
    const binaryRegressionResponse =
      this.buildFetchBinaryRegressionResponse(response);
    return response.warningMessage
      ? {
          ...binaryRegressionResponse,
          warningMessage: this.constructWarningMessage(response.warningMessage),
        }
      : binaryRegressionResponse;
  }

  private buildFetchBinaryRegressionResponse(
    response: FetchBinaryRegressionsApiResponse
  ) {
    return {
      binaryRegressions: {
        content: response.binaryRegressions.content.map(
          this.toLiteBinaryRegression
        ),
        totalElements: response.binaryRegressions.totalElements,
      },
    } as FetchBinaryRegressionsResponse;
  }

  getBinaryRegressionById(regressionId: string): Observable<BinaryRegression> {
    return this.http
      .get<BinaryRegressionApiResponse>(this.getBaseUrl() + `/${regressionId}`)
      .pipe(
        map((response) => this.toBinaryRegression(response)),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  update(
    regressionId: string,
    request: EditBinaryRegressionRequest
  ): Observable<void> {
    const trimmedRequest = {
      title: request.title?.trim(),
      description: request.description,
      fix: request.fix?.trim(),
      defect: request.defect?.trim(),
      incidentId: request.incidentId?.trim(),
    } as EditBinaryRegressionRequest;
    return this.http
      .patch<void>(this.getBaseUrl() + `/${regressionId}`, trimmedRequest)
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  getFetchAllUrl(): string {
    return `${this.getBaseUrl()}/fetch`;
  }

  getBaseUrl(): string {
    return this.apiUrl + `failure-management/regressions/binary`;
  }

  private toBinaryRegression(
    response: BinaryRegressionApiResponse
  ): BinaryRegression {
    return {
      id: response.id,
      title: response.title,
      description: response.description,
      defect: {
        id: response.defect.id,
        link: response.defect.link,
      },
      fix: response.fix,
      mxVersion: response.mxVersion,
      owner: response.owner,
      projectId: response.projectId,
      incidentId: response.incidentId,
      creationDate: response.creationDate,
    };
  }

  private toLiteBinaryRegression(
    response: LiteBinaryRegressionApiResponse
  ): LiteBinaryRegression {
    return {
      id: response.id,
      title: response.title,
      defect: {
        id: response.defect.id,
        link: response.defect.link,
      },
      fix: response.fix,
      mxVersion: response.mxVersion,
      owner: response.owner,
    };
  }

  private constructWarningMessage(warningMessage: string) {
    return `Showing all binary regressions due to: ${warningMessage}. Data includes binary regressions outside the validation cycle.`;
  }
}
