import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { CreateBinaryImpactRequest } from "./create-binary-impact-modal/create-binary-impact-request.model";
import { CreateBinaryImpactResponse } from "./create-binary-impact-response.model";
import { catchError, map, Observable, throwError } from "rxjs";
import { BinaryImpact } from "./binary-impact";
import { EditBinaryImpactRequest } from "./edit-binary-impact-modal/edit-binary-impact-request.model";
import { BinaryImpactApiResponse } from "./binary-impact-api-response.model";
import { UploadBinaryImpactAttachmentResponse } from "./upload-binary-impact-attachment-response";
import { FetchBinaryImpactsQuery } from "./fetch-binary-impacts-query";
import { FetchBinaryImpactsApiResponse } from "./fetch-binary-impacts-api-response.model";
import { FetchBinaryImpactsResponse } from "./fetch-binary-impacts-response.model";
import { FetchBinaryImpactsQueryApiRequest } from "./fetch-binary-impacts-query-api-request";
import { LiteBinaryImpact } from "./lite-binary-impact.model";

@Injectable()
export class BinaryImpactService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  private readonly apiUrl: string;

  constructor() {
    const config = this.config;
    this.apiUrl = `${config.gatewayUrl}`;
  }

  createBinaryImpact(
    projectId: string,
    request: CreateBinaryImpactRequest
  ): Observable<CreateBinaryImpactResponse> {
    return this.http
      .post<CreateBinaryImpactResponse>(
        this.getBaseUrl(projectId),
        this.getTrimmedCreateRequest(request)
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  fetchAll(
    projectId: string,
    query: FetchBinaryImpactsQuery = {}
  ): Observable<FetchBinaryImpactsResponse> {
    const pageable = {
      page: query.page?.toString() ?? "0",
      size: query.size?.toString() ?? "20",
    };
    const params = new HttpParams({ fromObject: { ...pageable } });

    return this.http
      .post<FetchBinaryImpactsApiResponse>(
        this.getFetchAllUrl(projectId),
        this.buildFetchBinaryImpactsQueryApiRequest(query),
        { params }
      )
      .pipe(
        map((result) => this.buildFetchBinaryImpactsResult(result)),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  fetchByIds(projectId: string, ids: string[]): Observable<LiteBinaryImpact[]> {
    const query: FetchBinaryImpactsQuery = {
      ids: ids,
      page: 0,
      size: ids.length,
    };
    return this.fetchAll(projectId, query).pipe(
      map((response) => response.binaryImpacts.content)
    );
  }

  private buildFetchBinaryImpactsResult(
    result: FetchBinaryImpactsApiResponse
  ): FetchBinaryImpactsResponse {
    return {
      binaryImpacts: {
        content: result.binaryImpacts.content,
        totalElements: result.binaryImpacts.totalElements,
      },
      warningMessage: result.warningMessage,
    };
  }

  private buildFetchBinaryImpactsQueryApiRequest(
    query: FetchBinaryImpactsQuery
  ): FetchBinaryImpactsQueryApiRequest {
    return {
      ids: query.ids,
      titlePhrase: query.titlePhrase,
      ownerPhrase: query.ownerPhrase,
      mxVersionPhrases: query.mxVersionPhrases,
      upgradeImpactExternalIssuePhrase: query.upgradeImpactExternalIssuePhrase,
      currentVersion: query.currentVersion,
      referenceVersion: query.referenceVersion,
      returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact:
        query.returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact,
    };
  }

  getById(projectId: string, binaryImpactId: string): Observable<BinaryImpact> {
    return this.http
      .get<BinaryImpactApiResponse>(
        this.getBaseUrl(projectId) + `/${binaryImpactId}`
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  update(
    projectId: string,
    binaryImpactId: string,
    request: EditBinaryImpactRequest
  ): Observable<void> {
    const trimmedRequest = this.getEditBinaryImpactRequest(request);
    return this.http
      .put<void>(
        this.getBaseUrl(projectId) + "/" + binaryImpactId,
        trimmedRequest
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private getEditBinaryImpactRequest(request: EditBinaryImpactRequest) {
    return {
      title: request.title?.trim(),
      description: request.description?.trim(),
      upgradeImpactId: request.upgradeImpactId,
      region: request.region,
      stream: request.stream,
      magnitude: request.magnitude,
      sourceType: request.sourceType,
      resolutionType: request.resolutionType,
      impactedOutputs: request.impactedOutputs,
      propagationQuery: request.propagationQuery,
      propagationPattern: request.propagationPattern,
      configurationDesign: request.configurationDesign,
      identificationPattern: request.identificationPattern,
      cbpmL3L4: request.cbpmL3L4,
      cbpmL1L2L3: request.cbpmL1L2L3,
      cbpmL2Scope: request.cbpmL2Scope,
      incidentId: request.incidentId,
    } as EditBinaryImpactRequest;
  }

  upload(
    projectId: string,
    binaryImpactId: string,
    file: File
  ): Observable<UploadBinaryImpactAttachmentResponse> {
    const formData = new FormData();
    formData.set("file", file);
    return this.http
      .post<UploadBinaryImpactAttachmentResponse>(
        `${this.getBaseUrl(projectId)}/${binaryImpactId}/attachment`,
        formData
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private getBaseUrl(projectId: string): string {
    return `${this.apiUrl}projects/${projectId}/failure-management/impacts/binary`;
  }

  private getFetchAllUrl(projectId: string): string {
    return `${this.getBaseUrl(projectId)}/fetch`;
  }

  private getTrimmedCreateRequest(request: CreateBinaryImpactRequest) {
    return {
      title: request.title.trim(),
      description: request.description,
      mxVersion: request.mxVersion.trim(),
      upgradeImpactId: request.upgradeImpactId,
      attachmentIds: request.attachmentIds,
      correlationId: request.correlationId,
      impactedOutputs: request.impactedOutputs,
      cbpmL1L2L3: request.cbpmL1L2L3,
      cbpmL2Scope: request.cbpmL2Scope,
      stream: request.stream,
      region: request.region,
      sourceType: request.sourceType,
      cbpmL3L4: request.cbpmL3L4,
      resolutionType: request.resolutionType,
      identificationPattern: request.identificationPattern,
      propagationPattern: request.propagationPattern,
      propagationQuery: request.propagationQuery,
      configurationDesign: request.configurationDesign,
      magnitude: request.magnitude,
      incidentId: request.incidentId,
    };
  }
}
