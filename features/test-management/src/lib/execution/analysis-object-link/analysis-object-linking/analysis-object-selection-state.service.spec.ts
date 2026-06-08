import { TestBed } from "@angular/core/testing";
import { AnalysisObjectSelectionStateService } from "./analysis-object-selection-state.service";
import {
  ANALYSIS_OBJECT_1,
  ANALYSIS_OBJECT_2,
  analysisObjectId1,
  analysisObjectId2,
  analysisObjectId3,
  getAnalysisObjectLink1,
  getAnalysisObjectLink3,
  getAnalysisObjectLinkWithEmptyTestCaseExecution,
  getFullySelectedAnalysisObject,
  getInitiallyFullyLinkedAnalysisObject,
  getInitiallyPartiallyLinkedAnalysisObject,
  getPartiallySelectedAnalysisObject,
  getUnselectedAnalysisObject,
  testCaseExecutionId1,
  testCaseExecutionId3,
} from "../analysis-object-link-test-utils";
import {
  testCaseExecution1,
  testCaseExecution3,
} from "../../test-case-execution/test-case-execution-utils";
import { TestCaseExecution } from "../../test-case-execution/test-case-execution";
import { AnalysisObjectLink } from "../analysis-object-link";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectType,
} from "@mxflow/features/analysis-objects";

describe("AnalysisObjectSelectionStateService", () => {
  let service: AnalysisObjectSelectionStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalysisObjectSelectionStateService);
  });

  describe("getInitiallyLinkedAnalysisObjects", () => {
    it("should return empty array if no test case executions are selected and scenario is not checked", () => {
      const filterCriteria = {
        analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        testCaseExecutions: [],
        linkedToScenarioExecution: false,
      };
      const analysisObjectLinks = [
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_REGRESSION),
      ];
      expect(
        service.getAnalysisObjectsLinkedToScenarioOrTestCaseExecution(
          analysisObjectLinks,
          filterCriteria
        )
      ).toEqual([]);
    });

    it("should return empty array if no links to the scenario execution or test case executions exist", () => {
      const filterCriteria = {
        analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        testCaseExecutions: [],
        linkedToScenarioExecution: false,
      };
      const analysisObjectLinks: AnalysisObjectLink[] = [];
      expect(
        service.getAnalysisObjectsLinkedToScenarioOrTestCaseExecution(
          analysisObjectLinks,
          filterCriteria
        )
      ).toEqual([]);
    });

    it("should return the analysis object with matching type and linked to a selected test case execution", () => {
      const filterCriteria = {
        analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        testCaseExecutions: [testCaseExecution1],
        linkedToScenarioExecution: false,
      };
      const analysisObjectLinks = [
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
        getAnalysisObjectLink3(AnalysisObjectType.BINARY_REGRESSION),
      ];
      expect(
        service.getAnalysisObjectsLinkedToScenarioOrTestCaseExecution(
          analysisObjectLinks,
          filterCriteria
        )
      ).toEqual([getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT)]);
    });

    it("should return the analysis objects with matching type and linked to at least one of the selected test case executions", () => {
      const filterCriteria = {
        analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        testCaseExecutions: [testCaseExecution1, testCaseExecution3],
        linkedToScenarioExecution: false,
      };
      const analysisObjectLinks = [
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
        getAnalysisObjectLink3(AnalysisObjectType.BINARY_REGRESSION),
        {
          ...getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
          testCaseExecutionId: "unselected-id",
        },
      ];
      expect(
        service.getAnalysisObjectsLinkedToScenarioOrTestCaseExecution(
          analysisObjectLinks,
          filterCriteria
        )
      ).toEqual([
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
      ]);
    });

    it("should return the analysis objects with matching type and linked to the unique selected test case executions", () => {
      const filterCriteria = {
        analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        testCaseExecutions: [testCaseExecution1, testCaseExecution1],
        linkedToScenarioExecution: false,
      };
      const analysisObjectLinks = [
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
        getAnalysisObjectLink3(AnalysisObjectType.BINARY_REGRESSION),
      ];
      expect(
        service.getAnalysisObjectsLinkedToScenarioOrTestCaseExecution(
          analysisObjectLinks,
          filterCriteria
        )
      ).toEqual([getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT)]);
    });

    it("should return the analysis objects with matching type and linked to the scenario execution if selected", () => {
      const filterCriteria = {
        analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        testCaseExecutions: [],
        linkedToScenarioExecution: true,
      };
      const analysisObjectLinks = [
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        getAnalysisObjectLinkWithEmptyTestCaseExecution(
          AnalysisObjectType.BINARY_IMPACT
        ),
        getAnalysisObjectLinkWithEmptyTestCaseExecution(
          AnalysisObjectType.BINARY_REGRESSION
        ),
      ];
      expect(
        service.getAnalysisObjectsLinkedToScenarioOrTestCaseExecution(
          analysisObjectLinks,
          filterCriteria
        )
      ).toEqual([
        getAnalysisObjectLinkWithEmptyTestCaseExecution(
          AnalysisObjectType.BINARY_IMPACT
        ),
      ]);
    });

    it("should not return analysis objects linked to the scenario execution if it is not checked", () => {
      const filterCriteria = {
        analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        testCaseExecutions: [],
        linkedToScenarioExecution: false,
      };
      const analysisObjectLinks = [
        getAnalysisObjectLinkWithEmptyTestCaseExecution(
          AnalysisObjectType.BINARY_IMPACT
        ),
      ];
      expect(
        service.getAnalysisObjectsLinkedToScenarioOrTestCaseExecution(
          analysisObjectLinks,
          filterCriteria
        )
      ).toEqual([]);
    });

    it("should return the analysis objects with matching type and linked to the scenario execution if it is checked or selected test case executions", () => {
      const filterCriteria = {
        analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        testCaseExecutions: [testCaseExecution1, testCaseExecution3],
        linkedToScenarioExecution: true,
      };

      const analysisObjectLinks = [
        getAnalysisObjectLinkWithEmptyTestCaseExecution(
          AnalysisObjectType.BINARY_IMPACT
        ),
        getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
        getAnalysisObjectLink3(AnalysisObjectType.BINARY_REGRESSION),
      ];
      expect(
        service.getAnalysisObjectsLinkedToScenarioOrTestCaseExecution(
          analysisObjectLinks,
          filterCriteria
        )
      ).toEqual([
        getAnalysisObjectLinkWithEmptyTestCaseExecution(
          AnalysisObjectType.BINARY_IMPACT
        ),
        getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
      ]);
    });
  });

  describe("getInitiallyLinkedAnalysisObjectsState", () => {
    it("should return empty list if there are no initially linked analysis objects", () => {
      const initialLinksState =
        service.getInitiallyLinkedAnalysisObjectsSelectionState(
          [],
          [testCaseExecution1]
        );
      expect(initialLinksState).toEqual([]);
    });

    it("should set an analysis object linked to all selected test case executions as full links", () => {
      const initiallyLinkedAnalysisObjects = [
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
      ];
      const selectedTestCaseExecutions = [testCaseExecution1];
      const initialLinks =
        service.getInitiallyLinkedAnalysisObjectsSelectionState(
          initiallyLinkedAnalysisObjects,
          selectedTestCaseExecutions
        );
      expect(initialLinks).toEqual([
        getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
      ]);
    });

    it("should set all analysis objects linked to all the selected test case executions as full links", () => {
      const initiallyLinkedAnalysisObjects = [
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
        {
          ...getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
          testCaseExecutionId: testCaseExecutionId3,
        },
        {
          ...getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
          testCaseExecutionId: testCaseExecutionId1,
        },
      ];
      const selectedTestCaseExecutions = [
        testCaseExecution1,
        testCaseExecution3,
      ];
      const initialLinks =
        service.getInitiallyLinkedAnalysisObjectsSelectionState(
          initiallyLinkedAnalysisObjects,
          selectedTestCaseExecutions
        );
      expect(initialLinks).toEqual([
        getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
        getInitiallyFullyLinkedAnalysisObject(analysisObjectId3),
      ]);
    });

    it("should set all analysis objects linked to some of the selected test cases as partially linked", () => {
      const initiallyLinkedAnalysisObjects = [
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
      ];
      const selectedTestCaseExecutions = [
        testCaseExecution1,
        testCaseExecution3,
      ];
      const initialLinks =
        service.getInitiallyLinkedAnalysisObjectsSelectionState(
          initiallyLinkedAnalysisObjects,
          selectedTestCaseExecutions
        );
      expect(initialLinks).toEqual([
        {
          ...getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId1),
          selectionMessage: `Linked to: ${testCaseExecution1.title}`,
        },
        {
          ...getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId3),
          selectionMessage: `Linked to: ${testCaseExecution3.title}`,
        },
      ]);
    });

    it("should set an analysis object linked to the scenario execution if checked as full links", () => {
      const initiallyLinkedAnalysisObjects = [
        getAnalysisObjectLinkWithEmptyTestCaseExecution(
          AnalysisObjectType.BINARY_IMPACT
        ),
      ];
      const selectedTestCaseExecutions: TestCaseExecution[] = [];
      const isScenarioExecutionChecked = true;
      const initialLinks =
        service.getInitiallyLinkedAnalysisObjectsSelectionState(
          initiallyLinkedAnalysisObjects,
          selectedTestCaseExecutions,
          isScenarioExecutionChecked
        );
      expect(initialLinks).toEqual([
        getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
      ]);
    });

    it("should set all analysis objects linked to the scenario execution if checked as full links", () => {
      const initiallyLinkedAnalysisObjects = [
        getAnalysisObjectLinkWithEmptyTestCaseExecution(
          AnalysisObjectType.BINARY_IMPACT
        ),
        {
          ...getAnalysisObjectLinkWithEmptyTestCaseExecution(
            AnalysisObjectType.BINARY_IMPACT
          ),
          analysisObjectId: analysisObjectId2,
        },
      ];
      const selectedTestCaseExecutions: TestCaseExecution[] = [];
      const isScenarioExecutionChecked = true;
      const initialLinks =
        service.getInitiallyLinkedAnalysisObjectsSelectionState(
          initiallyLinkedAnalysisObjects,
          selectedTestCaseExecutions,
          isScenarioExecutionChecked
        );
      expect(initialLinks).toEqual([
        getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
        getInitiallyFullyLinkedAnalysisObject(analysisObjectId2),
      ]);
    });

    it("should set an analysis object as partially linked if it is linked to a selected test case execution but not the scenario", () => {
      const initiallyLinkedAnalysisObjects = [
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
      ];
      const selectedTestCaseExecutions = [testCaseExecution1];
      const isScenarioExecutionChecked = true;
      const initialLinks =
        service.getInitiallyLinkedAnalysisObjectsSelectionState(
          initiallyLinkedAnalysisObjects,
          selectedTestCaseExecutions,
          isScenarioExecutionChecked
        );
      expect(initialLinks).toEqual([
        {
          ...getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId1),
          selectionMessage: `Linked to: ${testCaseExecution1.title}`,
        },
      ]);
    });

    it("should set an analysis object as partially linked if it is linked to the scenario execution but not to the selected test case executions", () => {
      const initiallyLinkedAnalysisObjects = [
        getAnalysisObjectLinkWithEmptyTestCaseExecution(
          AnalysisObjectType.BINARY_IMPACT
        ),
      ];
      const selectedTestCaseExecutions = [testCaseExecution1];
      const isScenarioExecutionChecked = true;
      const initialLinks =
        service.getInitiallyLinkedAnalysisObjectsSelectionState(
          initiallyLinkedAnalysisObjects,
          selectedTestCaseExecutions,
          isScenarioExecutionChecked
        );
      expect(initialLinks).toEqual([
        {
          ...getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId1),
          selectionMessage: `Linked to: Scenario Execution`,
        },
      ]);
    });

    it("should resolve partially linked info of an analysis object correctly if it is partially linked to scenario execution and selected test case executions", () => {
      const analysisObjectsLinkedToSelectedExecutions = [
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        getAnalysisObjectLinkWithEmptyTestCaseExecution(
          AnalysisObjectType.BINARY_IMPACT
        ),
      ];
      const selectedTestCaseExecutions = [
        testCaseExecution1,
        testCaseExecution3,
      ];
      const isScenarioExecutionChecked = true;
      const initialLinks =
        service.getInitiallyLinkedAnalysisObjectsSelectionState(
          analysisObjectsLinkedToSelectedExecutions,
          selectedTestCaseExecutions,
          isScenarioExecutionChecked
        );
      expect(initialLinks).toEqual([
        {
          ...getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId1),
          selectionMessage: `Linked to: Scenario Execution, ${testCaseExecution1.title}`,
        },
      ]);
    });

    it("should set an analysis object as fully linked if it is linked to the scenario execution and all selected test case executions", () => {
      const initiallyLinkedAnalysisObjects = [
        getAnalysisObjectLinkWithEmptyTestCaseExecution(
          AnalysisObjectType.BINARY_IMPACT
        ),
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        {
          ...getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
          analysisObjectId: analysisObjectId1,
        },
      ];
      const selectedTestCaseExecutions = [
        testCaseExecution1,
        testCaseExecution3,
      ];
      const isScenarioExecutionChecked = true;
      const initialLinks =
        service.getInitiallyLinkedAnalysisObjectsSelectionState(
          initiallyLinkedAnalysisObjects,
          selectedTestCaseExecutions,
          isScenarioExecutionChecked
        );
      expect(initialLinks).toEqual([
        getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
      ]);
    });
  });

  describe("getIdsWithPartialToFullSelectionChange", () => {
    it("should return an empty array if there are no initially linked objects", () => {
      const currentSelection: AnalysisObjectSelectionState<AnalysisObject>[] = [
        getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
      ];
      expect(
        service.getIdsWithPartialToFullSelectionChange([], currentSelection)
      ).toEqual([]);
    });

    it("should return an empty array if there are no initial partially selected objects", () => {
      const initialLinks: AnalysisObjectSelectionState<AnalysisObject>[] = [
        getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
      ];
      const currentSelection: AnalysisObjectSelectionState<AnalysisObject>[] = [
        getUnselectedAnalysisObject(ANALYSIS_OBJECT_1),
      ];
      expect(
        service.getIdsWithPartialToFullSelectionChange(
          initialLinks,
          currentSelection
        )
      ).toEqual([]);
    });

    it("should return an empty array if there are no currently selected objects", () => {
      const initialLinks: AnalysisObjectSelectionState<AnalysisObject>[] = [
        getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId1),
        getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId2),
      ];
      expect(
        service.getIdsWithPartialToFullSelectionChange(initialLinks, [])
      ).toEqual([]);
    });

    it("should return an empty array if the initial selection does not change", () => {
      const initialLinks: AnalysisObjectSelectionState<AnalysisObject>[] = [
        getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId1),
        getInitiallyFullyLinkedAnalysisObject(analysisObjectId2),
      ];
      const currentSelection: AnalysisObjectSelectionState<AnalysisObject>[] = [
        getPartiallySelectedAnalysisObject(ANALYSIS_OBJECT_1),
        getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
      ];
      expect(
        service.getIdsWithPartialToFullSelectionChange(
          initialLinks,
          currentSelection
        )
      ).toEqual([]);
    });

    it("should return ids that changed from partial to full selection", () => {
      const initialLinks: AnalysisObjectSelectionState<AnalysisObject>[] = [
        getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId1),
        getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId2),
      ];
      const currentSelection: AnalysisObjectSelectionState<AnalysisObject>[] = [
        getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
        getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
      ];
      expect(
        service.getIdsWithPartialToFullSelectionChange(
          initialLinks,
          currentSelection
        )
      ).toEqual([analysisObjectId1, analysisObjectId2]);
    });

    it("should not return ids of the analysis objects that are unchecked", () => {
      const initialLinks: AnalysisObjectSelectionState<AnalysisObject>[] = [
        getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId1),
        getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId2),
      ];
      const currentSelection: AnalysisObjectSelectionState<AnalysisObject>[] = [
        getUnselectedAnalysisObject(ANALYSIS_OBJECT_1),
        getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
      ];
      expect(
        service.getIdsWithPartialToFullSelectionChange(
          initialLinks,
          currentSelection
        )
      ).toEqual([analysisObjectId2]);
    });

    it("should not return ids of the analysis objects that remain partially checked", () => {
      const initialLinks: AnalysisObjectSelectionState<AnalysisObject>[] = [
        getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId1),
        getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId2),
      ];
      const currentSelection: AnalysisObjectSelectionState<AnalysisObject>[] = [
        getPartiallySelectedAnalysisObject(ANALYSIS_OBJECT_1),
        getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
      ];
      expect(
        service.getIdsWithPartialToFullSelectionChange(
          initialLinks,
          currentSelection
        )
      ).toEqual([analysisObjectId2]);
    });

    it("should handle cases where we have initially fully and partially selected analysis objects", () => {
      const initialLinks: AnalysisObjectSelectionState<AnalysisObject>[] = [
        getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId1),
        getInitiallyFullyLinkedAnalysisObject(analysisObjectId2),
      ];
      const currentSelection: AnalysisObjectSelectionState<AnalysisObject>[] = [
        getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
        getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
      ];
      expect(
        service.getIdsWithPartialToFullSelectionChange(
          initialLinks,
          currentSelection
        )
      ).toEqual([analysisObjectId1]);
    });

    it("should ignore entries where analysisObject is undefined", () => {
      const initialLinks: AnalysisObjectSelectionState<AnalysisObject>[] = [
        getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId1),
      ];
      const currentSelection: AnalysisObjectSelectionState<AnalysisObject>[] = [
        {
          ...getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
          analysisObject: undefined as any,
        },
        getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
      ];
      expect(
        service.getIdsWithPartialToFullSelectionChange(
          initialLinks,
          currentSelection
        )
      ).toEqual([analysisObjectId1]);
    });
  });
});
