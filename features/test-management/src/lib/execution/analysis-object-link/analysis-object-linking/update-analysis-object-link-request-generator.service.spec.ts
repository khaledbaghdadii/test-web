import { TestBed } from "@angular/core/testing";

import {
  UpdateAnalysisObjectLinkRequestGeneratorInput,
  UpdateAnalysisObjectLinkRequestGeneratorService,
} from "./update-analysis-object-link-request-generator.service";
import { AnalysisObjectSelectionStateService } from "./analysis-object-selection-state.service";
import {
  ANALYSIS_OBJECT_1,
  ANALYSIS_OBJECT_2,
  analysisObjectId1,
  analysisObjectId2,
  analysisObjectId3,
  getAnalysisObjectLink1,
  getAnalysisObjectLink2,
  getAnalysisObjectLink3,
  getAnalysisObjectLinkWithEmptyTestCaseExecution,
  getFullySelectedAnalysisObject,
  getInitiallyFullyLinkedAnalysisObject,
  getInitiallyPartiallyLinkedAnalysisObject,
  testCaseExecutionId1,
  updateLinksRequestGeneratorDefaultInput,
} from "../analysis-object-link-test-utils";
import {
  testCaseExecution1,
  testCaseExecution2,
  testCaseExecution3,
  testCaseExecutionId2,
} from "../../test-case-execution/test-case-execution-utils";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectType,
} from "@mxflow/features/analysis-objects";

describe("UpdateAnalysisObjectLinkRequestGeneratorService", () => {
  let service: UpdateAnalysisObjectLinkRequestGeneratorService;
  let analysisObjectSelectionStateService: AnalysisObjectSelectionStateService;

  beforeEach(() => {
    analysisObjectSelectionStateService = {
      getIdsWithPartialToFullSelectionChange: jest.fn(() => []),
    } as unknown as AnalysisObjectSelectionStateService;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AnalysisObjectSelectionStateService,
          useValue: analysisObjectSelectionStateService,
        },
      ],
    });
    service = TestBed.inject(UpdateAnalysisObjectLinkRequestGeneratorService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("generateUpdateAnalysisObjectLinkRequest", () => {
    it("should link the selected analysis object to the scenario if checked and no analysis objects are initially linked", () => {
      const contextWithNoInitialLinks: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          currentAnalysisObjectsSelectionState: [
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
          ],
          isScenarioExecutionSelected: true,
        };
      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithNoInitialLinks
      );
      expect(updateRequest).toEqual({
        linksToAdd: [
          getAnalysisObjectLinkWithEmptyTestCaseExecution(
            AnalysisObjectType.BINARY_IMPACT
          ),
        ],
        linksToRemove: [],
      });
    });

    it("should link multiple selected analysis objects to the scenario if checked and no analysis objects are initially linked", () => {
      const contextWithNoInitialLinks: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          currentAnalysisObjectsSelectionState: [
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
          ],
          isScenarioExecutionSelected: true,
        };
      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithNoInitialLinks
      );
      expect(updateRequest).toEqual({
        linksToAdd: [
          getAnalysisObjectLinkWithEmptyTestCaseExecution(
            AnalysisObjectType.BINARY_IMPACT
          ),
          {
            ...getAnalysisObjectLinkWithEmptyTestCaseExecution(
              AnalysisObjectType.BINARY_IMPACT
            ),
            analysisObjectId: analysisObjectId2,
          },
        ],
        linksToRemove: [],
      });
    });

    it("should link the newly selected analysis objects to the scenario if checked and some analysis objects are already linked", () => {
      const contextWithAnalysisObjectsFullyLinkedToTheScenario: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          initialAnalysisObjectLinks: [
            getAnalysisObjectLinkWithEmptyTestCaseExecution(
              AnalysisObjectType.BINARY_IMPACT
            ),
          ],
          currentAnalysisObjectsSelectionState: [
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
          ],
          isScenarioExecutionSelected: true,
        };
      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithAnalysisObjectsFullyLinkedToTheScenario
      );
      expect(updateRequest).toEqual({
        linksToAdd: [
          {
            ...getAnalysisObjectLinkWithEmptyTestCaseExecution(
              AnalysisObjectType.BINARY_IMPACT
            ),
            analysisObjectId: analysisObjectId2,
          },
        ],
        linksToRemove: [],
      });
    });

    it("should unlink the deselected analysis objects from the scenario if checked", () => {
      const contextWithAnalysisObjectsFullyLinkedToScenario: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          initialAnalysisObjectLinks: [
            getAnalysisObjectLinkWithEmptyTestCaseExecution(
              AnalysisObjectType.BINARY_IMPACT
            ),
            {
              ...getAnalysisObjectLinkWithEmptyTestCaseExecution(
                AnalysisObjectType.BINARY_IMPACT
              ),
              analysisObjectId: analysisObjectId2,
            },
          ],
          currentAnalysisObjectsSelectionState: [
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
          ],
          isScenarioExecutionSelected: true,
        };
      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithAnalysisObjectsFullyLinkedToScenario
      );
      expect(updateRequest).toEqual({
        linksToAdd: [],
        linksToRemove: [
          {
            ...getAnalysisObjectLinkWithEmptyTestCaseExecution(
              AnalysisObjectType.BINARY_IMPACT
            ),
            analysisObjectId: analysisObjectId2,
          },
        ],
      });
    });

    it("should link the selected analysis object to a selected test case", () => {
      const contextWithNoInitialLinks: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          testCaseExecutions: [testCaseExecution1],
          currentAnalysisObjectsSelectionState: [
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
          ],
        };
      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithNoInitialLinks
      );
      expect(updateRequest).toEqual({
        linksToAdd: [getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT)],
        linksToRemove: [],
      });
    });

    it("should link multiple analysis objects to a selected test case", () => {
      const contextWithNoInitialLinks: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          testCaseExecutions: [testCaseExecution1],
          currentAnalysisObjectsSelectionState: [
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
          ],
        };
      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithNoInitialLinks
      );
      expect(updateRequest).toEqual({
        linksToAdd: [
          getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
          {
            ...getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
            analysisObjectId: analysisObjectId2,
          },
        ],
        linksToRemove: [],
      });
    });

    it("should link multiple analysis objects to all selected test cases if no test cases were previously linked", () => {
      const contextWithMultipleSelectedTestCases: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          testCaseExecutions: [testCaseExecution1, testCaseExecution2],
          currentAnalysisObjectsSelectionState: [
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
          ],
        };
      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithMultipleSelectedTestCases
      );
      expect(updateRequest).toEqual({
        linksToAdd: [
          getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
          {
            ...getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
            analysisObjectId: analysisObjectId2,
          },
          {
            ...getAnalysisObjectLink2(AnalysisObjectType.BINARY_IMPACT),
            analysisObjectId: analysisObjectId1,
            testCaseExecutionId: testCaseExecutionId2,
          },
          {
            ...getAnalysisObjectLink2(AnalysisObjectType.BINARY_IMPACT),
            analysisObjectId: analysisObjectId2,
            testCaseExecutionId: testCaseExecutionId2,
          },
        ],
        linksToRemove: [],
      });
    });

    it("should link the newly selected analysis objects to the selected test case executions", () => {
      const contextWithMultipleSelectedTestCases: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          testCaseExecutions: [testCaseExecution1, testCaseExecution2],
          currentAnalysisObjectsSelectionState: [
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
          ],
          initialAnalysisObjectLinks: [
            getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
            {
              ...getAnalysisObjectLink2(AnalysisObjectType.BINARY_IMPACT),
              analysisObjectId: analysisObjectId1,
              testCaseExecutionId: testCaseExecutionId2,
            },
          ],
        };
      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithMultipleSelectedTestCases
      );
      expect(updateRequest).toEqual({
        linksToAdd: [
          {
            ...getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
            analysisObjectId: analysisObjectId2,
          },
          {
            ...getAnalysisObjectLink2(AnalysisObjectType.BINARY_IMPACT),
            analysisObjectId: analysisObjectId2,
            testCaseExecutionId: testCaseExecutionId2,
          },
        ],
        linksToRemove: [],
      });
    });

    it("should unlink an unselected analysis object from its linked test case executions", () => {
      const contextWithMultipleSelectedTestCases: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          testCaseExecutions: [testCaseExecution1, testCaseExecution3],
          currentAnalysisObjectsSelectionState: [],
          initialAnalysisObjectLinks: [
            getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
            {
              ...getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
              analysisObjectId: analysisObjectId1,
            },
          ],
        };
      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithMultipleSelectedTestCases
      );
      expect(updateRequest).toEqual({
        linksToAdd: [],
        linksToRemove: [
          getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
          {
            ...getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
            analysisObjectId: analysisObjectId1,
          },
        ],
      });
    });

    it("should unlink the deselected analysis objects from the selected test case executions", () => {
      const contextWithMultipleSelectedTestCases: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          testCaseExecutions: [testCaseExecution1, testCaseExecution3],
          currentAnalysisObjectsSelectionState: [
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
          ],
          initialAnalysisObjectLinks: [
            getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
            {
              ...getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
              analysisObjectId: analysisObjectId1,
            },
            {
              ...getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
              analysisObjectId: analysisObjectId3,
            },
            {
              ...getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
              analysisObjectId: analysisObjectId3,
            },
          ],
        };
      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithMultipleSelectedTestCases
      );
      expect(updateRequest).toEqual({
        linksToAdd: [],
        linksToRemove: [
          {
            ...getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
            analysisObjectId: analysisObjectId3,
          },
          {
            ...getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
            analysisObjectId: analysisObjectId3,
          },
        ],
      });
    });

    it("should link the newly selected analysis objects to the scenario execution and test case executions", () => {
      const contextWithSelectedTestCasesAndScenario: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          testCaseExecutions: [testCaseExecution1],
          currentAnalysisObjectsSelectionState: [
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
          ],
          initialAnalysisObjectLinks: [
            getAnalysisObjectLinkWithEmptyTestCaseExecution(
              AnalysisObjectType.BINARY_IMPACT
            ),
            getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
          ],
          isScenarioExecutionSelected: true,
        };
      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithSelectedTestCasesAndScenario
      );
      expect(updateRequest).toEqual({
        linksToAdd: [
          {
            ...getAnalysisObjectLinkWithEmptyTestCaseExecution(
              AnalysisObjectType.BINARY_IMPACT
            ),
            analysisObjectId: analysisObjectId2,
          },
          {
            ...getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
            analysisObjectId: analysisObjectId2,
          },
        ],
        linksToRemove: [],
      });
    });

    it("should unlink the deselected analysis objects from the scenario execution and test case executions", () => {
      const contextWithMultipleSelectedTestCases: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          testCaseExecutions: [testCaseExecution1],
          currentAnalysisObjectsSelectionState: [
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
          ],
          initialAnalysisObjectLinks: [
            getAnalysisObjectLinkWithEmptyTestCaseExecution(
              AnalysisObjectType.BINARY_IMPACT
            ),
            getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
            {
              ...getAnalysisObjectLinkWithEmptyTestCaseExecution(
                AnalysisObjectType.BINARY_IMPACT
              ),
              analysisObjectId: analysisObjectId2,
            },
            {
              ...getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
              analysisObjectId: analysisObjectId2,
            },
          ],
          isScenarioExecutionSelected: true,
        };
      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithMultipleSelectedTestCases
      );
      expect(updateRequest).toEqual({
        linksToAdd: [],
        linksToRemove: [
          {
            ...getAnalysisObjectLinkWithEmptyTestCaseExecution(
              AnalysisObjectType.BINARY_IMPACT
            ),
            analysisObjectId: analysisObjectId2,
          },
          {
            ...getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
            analysisObjectId: analysisObjectId2,
          },
        ],
      });
    });

    it("should unlink deselected analysis objects and link newly selected ones to the scenario execution if checked", () => {
      const contextWithSelectedScenario: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          currentAnalysisObjectsSelectionState: [
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
          ],
          initialAnalysisObjectLinks: [
            getAnalysisObjectLinkWithEmptyTestCaseExecution(
              AnalysisObjectType.BINARY_IMPACT
            ),
          ],
          isScenarioExecutionSelected: true,
        };
      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithSelectedScenario
      );
      expect(updateRequest).toEqual({
        linksToAdd: [
          {
            ...getAnalysisObjectLinkWithEmptyTestCaseExecution(
              AnalysisObjectType.BINARY_IMPACT
            ),
            analysisObjectId: analysisObjectId2,
          },
        ],
        linksToRemove: [
          getAnalysisObjectLinkWithEmptyTestCaseExecution(
            AnalysisObjectType.BINARY_IMPACT
          ),
        ],
      });
    });

    it("should unlink deselected analysis objects and link newly selected ones to the selected test case executions", () => {
      const contextWithSelectedTestCases: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          testCaseExecutions: [testCaseExecution1],
          currentAnalysisObjectsSelectionState: [
            getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
          ],
          initialAnalysisObjectLinks: [
            getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
          ],
        };
      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithSelectedTestCases
      );
      expect(updateRequest).toEqual({
        linksToAdd: [
          {
            ...getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
            analysisObjectId: analysisObjectId2,
          },
        ],
        linksToRemove: [
          getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        ],
      });
    });

    it("should link the initially partially selected analysis objects to the other test cases if the analysis objects were selected", () => {
      const newSelection = [
        getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
        getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
      ];
      const initialSelection = [
        getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId1),
        getInitiallyFullyLinkedAnalysisObject(analysisObjectId2),
      ];

      const contextWithPartialSelections: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          testCaseExecutions: [testCaseExecution1, testCaseExecution2],
          initiallyLinkedAnalysisObjectsState: initialSelection,
          currentAnalysisObjectsSelectionState: newSelection,
          initialAnalysisObjectLinks: [
            getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
            {
              ...getAnalysisObjectLink2(AnalysisObjectType.BINARY_IMPACT),
              testCaseExecutionId: testCaseExecutionId1,
            },
            {
              ...getAnalysisObjectLink2(AnalysisObjectType.BINARY_IMPACT),
              testCaseExecutionId: testCaseExecutionId2,
            },
          ],
        };

      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "getIdsWithPartialToFullSelectionChange"
        )
        .mockReturnValue([analysisObjectId1]);

      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithPartialSelections
      );

      expect(
        analysisObjectSelectionStateService.getIdsWithPartialToFullSelectionChange
      ).toHaveBeenCalledWith(initialSelection, newSelection);
      expect(updateRequest).toEqual({
        linksToAdd: [
          {
            ...getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
            analysisObjectId: analysisObjectId1,
            testCaseExecutionId: testCaseExecutionId2,
          },
        ],
        linksToRemove: [],
      });
    });

    it("should link the initially partially selected analysis objects to the scenario execution if the analysis objects were selected", () => {
      const newSelection = [
        getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
        getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
      ];
      const initialSelection = [
        getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId1),
        getInitiallyFullyLinkedAnalysisObject(analysisObjectId2),
      ];

      const contextWithPartialSelections: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          testCaseExecutions: [testCaseExecution1],
          initiallyLinkedAnalysisObjectsState: initialSelection,
          currentAnalysisObjectsSelectionState: newSelection,
          initialAnalysisObjectLinks: [
            getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
            {
              ...getAnalysisObjectLinkWithEmptyTestCaseExecution(
                AnalysisObjectType.BINARY_IMPACT
              ),
              analysisObjectId: analysisObjectId2,
            },
            {
              ...getAnalysisObjectLink2(AnalysisObjectType.BINARY_IMPACT),
              testCaseExecutionId: testCaseExecutionId1,
            },
          ],
          isScenarioExecutionSelected: true,
        };

      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "getIdsWithPartialToFullSelectionChange"
        )
        .mockReturnValue([analysisObjectId1]);

      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithPartialSelections
      );

      expect(
        analysisObjectSelectionStateService.getIdsWithPartialToFullSelectionChange
      ).toHaveBeenCalledWith(initialSelection, newSelection);

      expect(updateRequest).toEqual({
        linksToAdd: [
          {
            ...getAnalysisObjectLinkWithEmptyTestCaseExecution(
              AnalysisObjectType.BINARY_IMPACT
            ),
            analysisObjectId: analysisObjectId1,
          },
        ],
        linksToRemove: [],
      });
    });

    it("should link an initially partially selected analysis object only to the test case executions if it is already linked to the scenario", () => {
      const newSelection = [getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1)];
      const initialSelection = [
        getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId1),
      ];

      const contextWithPartialSelections: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          testCaseExecutions: [testCaseExecution1],
          initiallyLinkedAnalysisObjectsState: initialSelection,
          currentAnalysisObjectsSelectionState: newSelection,
          initialAnalysisObjectLinks: [
            getAnalysisObjectLinkWithEmptyTestCaseExecution(
              AnalysisObjectType.BINARY_IMPACT
            ),
          ],
          isScenarioExecutionSelected: true,
        };

      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "getIdsWithPartialToFullSelectionChange"
        )
        .mockReturnValue([analysisObjectId1]);

      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithPartialSelections
      );

      expect(
        analysisObjectSelectionStateService.getIdsWithPartialToFullSelectionChange
      ).toHaveBeenCalledWith(initialSelection, newSelection);
      expect(updateRequest).toEqual({
        linksToAdd: [getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT)],
        linksToRemove: [],
      });
    });

    it("should unlink a partially selected analysis object only from the test case executions it was already linked to", () => {
      const newSelection: AnalysisObjectSelectionState<AnalysisObject>[] = [];
      const initialSelection = [
        getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId1),
      ];
      const contextWithPartialSelections: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          testCaseExecutions: [testCaseExecution1, testCaseExecution3],
          initiallyLinkedAnalysisObjectsState: initialSelection,
          currentAnalysisObjectsSelectionState: newSelection,
          initialAnalysisObjectLinks: [
            getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
          ],
        };
      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithPartialSelections
      );

      expect(
        analysisObjectSelectionStateService.getIdsWithPartialToFullSelectionChange
      ).toHaveBeenCalledWith(initialSelection, newSelection);
      expect(updateRequest).toEqual({
        linksToAdd: [],
        linksToRemove: [
          getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        ],
      });
    });

    it("should unlink a partially selected analysis object only from the test case executions it was linked to but not from the scenario if selected", () => {
      const newSelection: AnalysisObjectSelectionState<AnalysisObject>[] = [];
      const initialSelection = [
        getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId1),
      ];
      const contextWithPartialSelections: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          testCaseExecutions: [testCaseExecution1],
          initiallyLinkedAnalysisObjectsState: initialSelection,
          currentAnalysisObjectsSelectionState: newSelection,
          initialAnalysisObjectLinks: [
            getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
          ],
          isScenarioExecutionSelected: true,
        };
      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithPartialSelections
      );

      expect(
        analysisObjectSelectionStateService.getIdsWithPartialToFullSelectionChange
      ).toHaveBeenCalledWith(initialSelection, newSelection);
      expect(updateRequest).toEqual({
        linksToAdd: [],
        linksToRemove: [
          getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        ],
      });
    });

    it("should unlink a partially selected analysis object only from the scenario execution it was linked to but not from the selected test cases", () => {
      const newSelection: AnalysisObjectSelectionState<AnalysisObject>[] = [];
      const initialSelection = [
        getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId1),
      ];
      const contextWithPartialSelections: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          testCaseExecutions: [testCaseExecution1],
          initiallyLinkedAnalysisObjectsState: initialSelection,
          currentAnalysisObjectsSelectionState: newSelection,
          initialAnalysisObjectLinks: [
            getAnalysisObjectLinkWithEmptyTestCaseExecution(
              AnalysisObjectType.BINARY_IMPACT
            ),
          ],
          isScenarioExecutionSelected: true,
        };
      const updateRequest = service.generateUpdateAnalysisObjectLinkRequest(
        contextWithPartialSelections
      );

      expect(
        analysisObjectSelectionStateService.getIdsWithPartialToFullSelectionChange
      ).toHaveBeenCalledWith(initialSelection, newSelection);
      expect(updateRequest).toEqual({
        linksToAdd: [],
        linksToRemove: [
          getAnalysisObjectLinkWithEmptyTestCaseExecution(
            AnalysisObjectType.BINARY_IMPACT
          ),
        ],
      });
    });
  });
});
