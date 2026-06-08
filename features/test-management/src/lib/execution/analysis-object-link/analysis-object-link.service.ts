import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import {
  AnalysisObjectLink,
  AnalysisObjectLinkedScenarioExecution,
  TestUnitAnalysisObjectLink,
  CreateAnalysisObjectLinkRequest,
  UnlinkAnalysisObjectRequest,
  UpdateAnalysisObjectLinkRequest,
} from "./analysis-object-link";
import { map, Observable } from "rxjs";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import {
  CandidateAnalysisObjectLinkResponse,
  CreateCandidateAnalysisObjectLinksRequest,
} from "./candidate-analysis-object-link";

@Injectable()
export class AnalysisObjectLinkService {
  private http = inject(HttpClient);

  apiUrl: string;

  constructor() {
    const config = inject<AppConfig>(APP_CONFIG);

    this.apiUrl = config.gatewayUrl;
  }

  fetchDistinct(
    projectId: string,
    scenarioExecutionId: string,
    analysisObjectType?: AnalysisObjectType
  ): Observable<AnalysisObjectLink[]> {
    return this.fetch(projectId, scenarioExecutionId, analysisObjectType).pipe(
      map((links) => {
        const distinctLinks = new Map<string, AnalysisObjectLink>();
        links.forEach((link) => {
          if (!distinctLinks.has(link.analysisObjectId)) {
            distinctLinks.set(link.analysisObjectId, link);
          }
        });
        return Array.from(distinctLinks.values());
      })
    );
  }

  fetch(
    projectId: string,
    scenarioExecutionId: string,
    analysisObjectType?: AnalysisObjectType
  ): Observable<AnalysisObjectLink[]> {
    return this.http
      .get<AnalysisObjectLink[]>(
        this.getAnalysisObjectLinkUrl(projectId, scenarioExecutionId)
      )
      .pipe(
        map((links) => {
          if (analysisObjectType) {
            return links.filter(
              (link) => link.analysisObjectType === analysisObjectType
            );
          }
          return links;
        })
      );
  }

  fetchProjectSpecificAnalysisObjectLinks(
    projectId: string,
    analysisObjectId: string,
    analysisObjectType: AnalysisObjectType
  ): Observable<AnalysisObjectLinkedScenarioExecution[]> {
    return this.http.get<AnalysisObjectLinkedScenarioExecution[]>(
      this.getProjectSpecificLinksBaseUrl(
        projectId,
        analysisObjectType,
        analysisObjectId
      )
    );
  }

  fetchGlobalAnalysisObjectLinks(
    analysisObjectId: string,
    analysisObjectType: AnalysisObjectType
  ): Observable<AnalysisObjectLinkedScenarioExecution[]> {
    return this.http.get<AnalysisObjectLinkedScenarioExecution[]>(
      this.getGlobalAnalysisObjectBaseUrl(analysisObjectType, analysisObjectId)
    );
  }

  fetchTestUnitAnalysisObjectLinks(
    projectId: string,
    testUnitId: string
  ): Observable<TestUnitAnalysisObjectLink[]> {
    return this.http.get<TestUnitAnalysisObjectLink[]>(
      `${this.apiUrl}projects/${projectId}/test-execution-manager/test-units/${testUnitId}/analysis-object-links`
    );
  }

  update(
    projectId: string,
    scenarioExecutionId: string,
    request: UpdateAnalysisObjectLinkRequest
  ): Observable<void> {
    return this.http.patch<void>(
      this.getAnalysisObjectLinkUrl(projectId, scenarioExecutionId),
      request
    );
  }

  createLink(request: CreateAnalysisObjectLinkRequest) {
    return this.update(request.projectId, request.scenarioExecutionId, {
      linksToAdd: [request.link],
      linksToRemove: [],
    });
  }

  unlink(request: UnlinkAnalysisObjectRequest) {
    return this.update(request.projectId, request.scenarioExecutionId, {
      linksToAdd: [],
      linksToRemove: [request.link],
    });
  }

  createCandidateAnalysisObjectLinks(
    projectId: string,
    scenarioExecutionId: string,
    request: CreateCandidateAnalysisObjectLinksRequest
  ): Observable<CandidateAnalysisObjectLinkResponse> {
    return this.http.post<CandidateAnalysisObjectLinkResponse>(
      this.getCandidateAnalysisObjectLinkUrl(projectId, scenarioExecutionId),
      request
    );
  }

  private getBaseUrl(projectId: string, scenarioExecutionId: string): string {
    return `${this.apiUrl}projects/${projectId}/test-execution-manager/scenario-executions/${scenarioExecutionId}`;
  }

  private getAnalysisObjectLinkUrl(
    projectId: string,
    scenarioExecutionId: string
  ): string {
    return `${this.getBaseUrl(
      projectId,
      scenarioExecutionId
    )}/analysis-object-links`;
  }

  private getCandidateAnalysisObjectLinkUrl(
    projectId: string,
    scenarioExecutionId: string
  ): string {
    return `${this.getBaseUrl(
      projectId,
      scenarioExecutionId
    )}/candidate-analysis-object-links`;
  }

  private getProjectSpecificLinksBaseUrl(
    projectId: string,
    analysisObjectType: AnalysisObjectType,
    analysisObjectId: string
  ): string {
    return `${this.apiUrl}projects/${projectId}/test-execution-manager/analysis-objects/${analysisObjectType}/${analysisObjectId}/scenario-executions`;
  }

  private getGlobalAnalysisObjectBaseUrl(
    analysisObjectType: AnalysisObjectType,
    analysisObjectId: string
  ): string {
    return `${this.apiUrl}test-execution-manager/analysis-objects/${analysisObjectType}/${analysisObjectId}/scenario-executions`;
  }
}
