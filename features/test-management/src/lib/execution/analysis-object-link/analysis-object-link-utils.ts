import { Injectable } from "@angular/core";
import { AnalysisObjectLink } from "./analysis-object-link";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";

@Injectable()
export class AnalysisObjectLinkUtils {
  getScenarioExecutionLinks(
    analysisObjectLinks: AnalysisObjectLink[]
  ): AnalysisObjectLink[] {
    return analysisObjectLinks.filter((link) =>
      this.isAnalysisObjectLinkedToScenarioExecutionOnly(link)
    );
  }

  getTestCaseExecutionLinks(
    analysisObjectLinks: AnalysisObjectLink[]
  ): AnalysisObjectLink[] {
    return analysisObjectLinks.filter(
      (link) => !this.isAnalysisObjectLinkedToScenarioExecutionOnly(link)
    );
  }

  getAnalysisObjectLinks(
    analysisObjectLinks: AnalysisObjectLink[],
    analysisObjectId: string,
    analysisObjectType: AnalysisObjectType
  ): AnalysisObjectLink[] {
    return analysisObjectLinks.filter((link) =>
      this.analysisObjectEquals(link, analysisObjectId, analysisObjectType)
    );
  }

  getAnalysisObjectScenarioExecutionLink(
    analysisObjectLinks: AnalysisObjectLink[],
    analysisObjectId: string,
    analysisObjectType?: AnalysisObjectType
  ): AnalysisObjectLink | undefined {
    if (!analysisObjectType) return undefined;
    const link = this.getScenarioExecutionLinks(analysisObjectLinks).filter(
      (link) =>
        this.analysisObjectEquals(link, analysisObjectId, analysisObjectType)
    );
    return link.length > 0 ? link[0] : undefined;
  }

  getAnalysisObjectTestCaseExecutionLinks(
    analysisObjectLinks: AnalysisObjectLink[],
    analysisObjectId: string,
    analysisObjectType?: AnalysisObjectType
  ): AnalysisObjectLink[] {
    if (!analysisObjectType) return [];
    return this.getTestCaseExecutionLinks(analysisObjectLinks).filter((link) =>
      this.analysisObjectEquals(link, analysisObjectId, analysisObjectType)
    );
  }

  isAnalysisObjectLinkedToScenarioExecutionOnly(
    analysisObjectLink: AnalysisObjectLink
  ): boolean {
    return !analysisObjectLink.testCaseExecutionId;
  }

  private analysisObjectEquals(
    link: AnalysisObjectLink,
    analysisObjectId: string,
    analysisObjectType: AnalysisObjectType
  ): boolean {
    return (
      link.analysisObjectId === analysisObjectId &&
      link.analysisObjectType === analysisObjectType
    );
  }
}
