import { inject, Injectable } from "@angular/core";
import {
  AnalysisObjectLink,
  UpdateAnalysisObjectLinkRequest,
} from "../analysis-object-link";
import { ListUtils } from "@mxflow/features/incident-management";
import { AnalysisObjectSelectionStateService } from "./analysis-object-selection-state.service";
import { TestCaseExecution } from "../../test-case-execution/test-case-execution";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectType,
} from "@mxflow/features/analysis-objects";

export interface UpdateAnalysisObjectLinkRequestGeneratorInput {
  projectId: string;
  scenarioExecutionId: string;
  analysisObjectType: AnalysisObjectType;
  currentAnalysisObjectsSelectionState: AnalysisObjectSelectionState<AnalysisObject>[];
  initiallyLinkedAnalysisObjectsState: AnalysisObjectSelectionState<AnalysisObject>[];
  initialAnalysisObjectLinks: AnalysisObjectLink[];
  testCaseExecutions: TestCaseExecution[];
  isScenarioExecutionSelected: boolean;
}

@Injectable({
  providedIn: "root",
})
export class UpdateAnalysisObjectLinkRequestGeneratorService {
  private analysisObjectSelectionStateService = inject(
    AnalysisObjectSelectionStateService
  );

  generateUpdateAnalysisObjectLinkRequest(
    requestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput
  ): UpdateAnalysisObjectLinkRequest {
    return {
      linksToAdd: this.generateLinksToAdd(requestGeneratorInput),
      linksToRemove: this.generateLinksToRemove(requestGeneratorInput),
    };
  }

  private generateLinksToAdd(
    requestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput
  ): AnalysisObjectLink[] {
    const initiallySelectedAnalysisObjectIds =
      requestGeneratorInput.initialAnalysisObjectLinks.map(
        (link) => link.analysisObjectId
      );

    const analysisObjectIdsAdded = ListUtils.itemsNotInSecondList(
      requestGeneratorInput.currentAnalysisObjectsSelectionState.map(
        (obj) => obj.analysisObject.id
      ),
      initiallySelectedAnalysisObjectIds
    );

    const analysisObjectIdsWithPartialToFullSelectionChange =
      this.analysisObjectSelectionStateService.getIdsWithPartialToFullSelectionChange(
        requestGeneratorInput.initiallyLinkedAnalysisObjectsState,
        requestGeneratorInput.currentAnalysisObjectsSelectionState
      );

    return this.getLinksToAdd(
      [
        ...analysisObjectIdsAdded,
        ...analysisObjectIdsWithPartialToFullSelectionChange,
      ],
      requestGeneratorInput
    );
  }

  getLinksToAdd(
    analysisObjectIdsToLink: string[],
    requestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput
  ) {
    const linksToAdd: AnalysisObjectLink[] = [];
    this.addLinksToScenarioExecutionIfChecked(
      linksToAdd,
      analysisObjectIdsToLink,
      requestGeneratorInput
    );
    this.addLinksToTestCaseExecutions(
      linksToAdd,
      analysisObjectIdsToLink,
      requestGeneratorInput
    );
    return linksToAdd;
  }

  private addLinksToScenarioExecutionIfChecked(
    linksToAdd: AnalysisObjectLink[],
    analysisObjectIdsToLink: string[],
    requestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput
  ) {
    if (requestGeneratorInput.isScenarioExecutionSelected) {
      analysisObjectIdsToLink.forEach((id) => {
        if (
          !this.scenarioExecutionAlreadyLinkedToAnalysisObject(
            requestGeneratorInput,
            id
          )
        ) {
          linksToAdd.push({
            projectId: requestGeneratorInput.projectId,
            scenarioExecutionId: requestGeneratorInput.scenarioExecutionId,
            testCaseExecutionId: undefined,
            analysisObjectId: id,
            analysisObjectType: requestGeneratorInput.analysisObjectType,
          });
        }
      });
    }
  }

  private addLinksToTestCaseExecutions(
    linksToAdd: AnalysisObjectLink[],
    analysisObjectIdsToLink: string[],
    requestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput
  ) {
    requestGeneratorInput.testCaseExecutions.forEach((testCaseExecution) => {
      analysisObjectIdsToLink.forEach((id) => {
        if (
          !this.testCaseExecutionAlreadyLinkedToAnalysisObject(
            requestGeneratorInput,
            testCaseExecution,
            id
          )
        ) {
          linksToAdd.push({
            projectId: requestGeneratorInput.projectId,
            scenarioExecutionId: requestGeneratorInput.scenarioExecutionId,
            testCaseExecutionId: testCaseExecution.id,
            analysisObjectId: id,
            analysisObjectType: requestGeneratorInput.analysisObjectType,
          });
        }
      });
    });
  }

  private testCaseExecutionAlreadyLinkedToAnalysisObject(
    requestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput,
    testCaseExecution: TestCaseExecution,
    id: string
  ) {
    return requestGeneratorInput.initialAnalysisObjectLinks.some(
      (link) =>
        link.testCaseExecutionId === testCaseExecution.id &&
        link.analysisObjectId === id
    );
  }

  private scenarioExecutionAlreadyLinkedToAnalysisObject(
    requestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput,
    id: string
  ) {
    return requestGeneratorInput.initialAnalysisObjectLinks.some(
      (link) => link.testCaseExecutionId == null && link.analysisObjectId === id
    );
  }

  private generateLinksToRemove(
    requestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput
  ): AnalysisObjectLink[] {
    const linksToRemove: AnalysisObjectLink[] = [];
    const initiallySelectedAnalysisObjectIds = [
      ...new Set(
        requestGeneratorInput.initialAnalysisObjectLinks.map(
          (link) => link.analysisObjectId
        )
      ),
    ];
    const analysisObjectLinkIdsToUnlink = ListUtils.itemsNotInSecondList(
      initiallySelectedAnalysisObjectIds,
      requestGeneratorInput.currentAnalysisObjectsSelectionState.map(
        (obj) => obj.analysisObject.id
      )
    );

    this.removeLinksFromScenarioExecution(
      linksToRemove,
      analysisObjectLinkIdsToUnlink,
      requestGeneratorInput
    );
    this.removeLinksFromTestCaseExecutions(
      linksToRemove,
      analysisObjectLinkIdsToUnlink,
      requestGeneratorInput
    );
    return linksToRemove;
  }

  private removeLinksFromScenarioExecution(
    linksToRemove: AnalysisObjectLink[],
    analysisObjectLinkIdsToUnlink: string[],
    requestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput
  ) {
    if (requestGeneratorInput.isScenarioExecutionSelected) {
      analysisObjectLinkIdsToUnlink.forEach((id) => {
        if (
          this.scenarioExecutionAlreadyLinkedToAnalysisObject(
            requestGeneratorInput,
            id
          )
        ) {
          linksToRemove.push({
            projectId: requestGeneratorInput.projectId,
            scenarioExecutionId: requestGeneratorInput.scenarioExecutionId,
            testCaseExecutionId: undefined,
            analysisObjectId: id,
            analysisObjectType: requestGeneratorInput.analysisObjectType,
          });
        }
      });
    }
  }

  private removeLinksFromTestCaseExecutions(
    linksToRemove: AnalysisObjectLink[],
    analysisObjectLinkIdsToUnlink: string[],
    requestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput
  ) {
    requestGeneratorInput.testCaseExecutions.forEach((testCaseExecution) => {
      analysisObjectLinkIdsToUnlink.forEach((id) => {
        if (
          this.testCaseExecutionAlreadyLinkedToAnalysisObject(
            requestGeneratorInput,
            testCaseExecution,
            id
          )
        ) {
          linksToRemove.push({
            projectId: requestGeneratorInput.projectId,
            scenarioExecutionId: requestGeneratorInput.scenarioExecutionId,
            testCaseExecutionId: testCaseExecution.id,
            analysisObjectId: id,
            analysisObjectType: requestGeneratorInput.analysisObjectType,
          });
        }
      });
    });
  }
}
