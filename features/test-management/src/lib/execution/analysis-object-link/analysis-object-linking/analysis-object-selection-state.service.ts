import { Injectable } from "@angular/core";
import { AnalysisObjectLink } from "../analysis-object-link";
import { TestCaseExecution } from "../../test-case-execution/test-case-execution";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
} from "@mxflow/features/analysis-objects";

export interface AnalysisObjectLinkFilterCriteria {
  analysisObjectType: string;
  testCaseExecutions: TestCaseExecution[];
  linkedToScenarioExecution: boolean;
}

@Injectable({
  providedIn: "root",
})
export class AnalysisObjectSelectionStateService {
  getAnalysisObjectsLinkedToScenarioOrTestCaseExecution(
    analysisObjectLinks: AnalysisObjectLink[],
    filterCriteria: AnalysisObjectLinkFilterCriteria
  ): AnalysisObjectLink[] {
    const selectedTestCaseIds = new Set(
      filterCriteria.testCaseExecutions.map(
        (selectedTestCase) => selectedTestCase.id
      )
    );

    return analysisObjectLinks.filter((link) => {
      const isAnalysisObjectLinkedToScenarioExecution =
        filterCriteria.linkedToScenarioExecution &&
        this.isLinkedToScenario(link);
      const isAnalysisObjectLinkedToATestCaseExecution =
        link.testCaseExecutionId &&
        selectedTestCaseIds.has(link.testCaseExecutionId);
      const isMatchingAnalysisObjectType =
        link.analysisObjectType === filterCriteria.analysisObjectType;
      return (
        isMatchingAnalysisObjectType &&
        (isAnalysisObjectLinkedToScenarioExecution ||
          isAnalysisObjectLinkedToATestCaseExecution)
      );
    });
  }

  getInitiallyLinkedAnalysisObjectsSelectionState(
    initiallyLinkedAnalysisObjects: AnalysisObjectLink[],
    selectedTestCaseExecutions: TestCaseExecution[],
    isScenarioExecutionChecked = false
  ): AnalysisObjectSelectionState<AnalysisObject>[] {
    const linksByAnalysisObjectId = this.groupLinksByAnalysisObjectId(
      initiallyLinkedAnalysisObjects
    );
    return Object.entries(linksByAnalysisObjectId).map(
      ([analysisObjectId, links]) => {
        return this.computeLinkedAnalysisObjectState(
          analysisObjectId,
          links,
          selectedTestCaseExecutions,
          isScenarioExecutionChecked
        );
      }
    );
  }

  private groupLinksByAnalysisObjectId(
    analysisObjectsLinkedToSelectedExecutions: AnalysisObjectLink[]
  ): Record<string, AnalysisObjectLink[]> {
    return analysisObjectsLinkedToSelectedExecutions.reduce<
      Record<string, AnalysisObjectLink[]>
    >((acc, link) => {
      if (!acc[link.analysisObjectId]) {
        acc[link.analysisObjectId] = [];
      }
      acc[link.analysisObjectId].push(link);
      return acc;
    }, {});
  }

  private computeLinkedAnalysisObjectState(
    analysisObjectId: string,
    links: AnalysisObjectLink[],
    selectedTestCaseExecutions: TestCaseExecution[],
    isScenarioExecutionChecked = false
  ) {
    const selectedTestCaseIds = selectedTestCaseExecutions.map(
      (testCaseExecution) => testCaseExecution.id
    );
    const testCaseIdsLinkedToAnalysisObject = new Set(
      links.map((link) => link.testCaseExecutionId)
    );
    const linkedToScenario = links.some((link) =>
      this.isLinkedToScenario(link)
    );
    const linkedToAllTestCases = selectedTestCaseIds.every((id) =>
      testCaseIdsLinkedToAnalysisObject.has(id)
    );

    const isFullyLinked = isScenarioExecutionChecked
      ? linkedToAllTestCases && linkedToScenario
      : linkedToAllTestCases;

    return {
      analysisObject: { id: analysisObjectId },
      selectionType: isFullyLinked
        ? AnalysisObjectSelectionType.FULL
        : AnalysisObjectSelectionType.PARTIAL,
      selectionMessage: !isFullyLinked
        ? this.resolvePartialSelectionMessage(
            selectedTestCaseExecutions,
            testCaseIdsLinkedToAnalysisObject,
            linkedToScenario
          )
        : undefined,
    };
  }

  private isLinkedToScenario(link: AnalysisObjectLink) {
    return link.testCaseExecutionId == null;
  }

  private resolvePartialSelectionMessage(
    selectedTestCaseExecutions: TestCaseExecution[],
    testCaseIdsLinkedToAnalysisObject: Set<string | undefined>,
    isLinkedToScenario: boolean
  ): string {
    const scenarioExecutionText = isLinkedToScenario
      ? "Scenario Execution"
      : "";
    const linkedTestCaseTitles = selectedTestCaseExecutions
      .filter((tc) => testCaseIdsLinkedToAnalysisObject.has(tc.id))
      .map((tc) => tc.title)
      .join(", ");
    const separator =
      isLinkedToScenario && linkedTestCaseTitles.length > 0 ? ", " : "";

    return `Linked to: ${scenarioExecutionText}${separator}${linkedTestCaseTitles}`;
  }

  getIdsWithPartialToFullSelectionChange<T extends AnalysisObject>(
    initiallyLinkedAnalysisObjects: AnalysisObjectSelectionState<T>[],
    currentlySelectedAnalysisObjects: AnalysisObjectSelectionState<T>[]
  ): string[] {
    const initiallyPartiallyLinkedAnalysisObjectIds = new Set(
      initiallyLinkedAnalysisObjects
        .filter(
          (initiallyLinked) =>
            initiallyLinked.selectionType ===
            AnalysisObjectSelectionType.PARTIAL
        )
        .map((initiallyLinked) => initiallyLinked.analysisObject.id)
    );

    return currentlySelectedAnalysisObjects
      .filter(
        (currentSelection) =>
          currentSelection.selectionType === AnalysisObjectSelectionType.FULL &&
          initiallyPartiallyLinkedAnalysisObjectIds.has(
            currentSelection.analysisObject?.id
          )
      )
      .map((selected) => selected.analysisObject.id);
  }
}
