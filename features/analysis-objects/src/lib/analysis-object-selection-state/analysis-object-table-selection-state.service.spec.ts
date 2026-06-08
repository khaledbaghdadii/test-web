import { TestBed } from "@angular/core/testing";

import { AnalysisObjectTableSelectionStateService } from "./analysis-object-table-selection-state.service";
import { AnalysisObjectSelectionType } from "./analysis-object-selection-type.enum";

describe("AnalysisObjectSelectionStateService", () => {
  let service: AnalysisObjectTableSelectionStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalysisObjectTableSelectionStateService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection", () => {
    it("should return the new selection state of the analysis object if the latter is not already in the list of selection states", () => {
      const expectedListOfAnalysisObjectSelectionState =
        getListOfAnalysisObjectSelectionState();
      const actualListOfAnalysisObjectSelectionState =
        service.computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection(
          getFullySelectedAnalysisObject(),
          [getPartiallySelectedAnalysisObjectSelectionState()]
        );
      expect(actualListOfAnalysisObjectSelectionState).toEqual(
        expectedListOfAnalysisObjectSelectionState
      );
    });

    it("should return the same list of selection state if the analysis object being added is already fully selected", () => {
      const expectedListOfAnalysisObjectSelectionState =
        getListOfAnalysisObjectSelectionState();
      const actualListOfAnalysisObjectSelectionState =
        service.computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection(
          getFullySelectedAnalysisObject(),
          getListOfAnalysisObjectSelectionState()
        );
      expect(actualListOfAnalysisObjectSelectionState).toEqual(
        expectedListOfAnalysisObjectSelectionState
      );
    });

    it("should add the new selection state of the analysis object if the list of selection states is empty", () => {
      const expectedListOfAnalysisObjectSelectionState = [
        getFullySelectedAnalysisObjectSelectionState(),
      ];
      const actualListOfAnalysisObjectSelectionState =
        service.computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection(
          getFullySelectedAnalysisObject(),
          []
        );
      expect(actualListOfAnalysisObjectSelectionState).toEqual(
        expectedListOfAnalysisObjectSelectionState
      );
    });

    it("should add the new selection state of the analysis object with full selection type if the latter was already partially selected", () => {
      const expectedListOfAnalysisObjectSelectionState = [
        {
          ...getPartiallySelectedAnalysisObjectSelectionState(),
          selectionType: AnalysisObjectSelectionType.FULL,
        },
        getFullySelectedAnalysisObjectSelectionState(),
      ];
      const actualListOfAnalysisObjectSelectionState =
        service.computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection(
          getPartiallySelectedAnalysisObject(),
          getListOfAnalysisObjectSelectionState()
        );
      expect(actualListOfAnalysisObjectSelectionState).toEqual(
        expectedListOfAnalysisObjectSelectionState
      );
    });

    it("should not fail if analysis object in selections is undefined", () => {
      const analysisObjectSelectionStates = [
        {
          analysisObject: undefined,
          selectionType: AnalysisObjectSelectionType.FULL,
        },
      ] as any;
      const result =
        service.computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection(
          getFullySelectedAnalysisObject(),
          analysisObjectSelectionStates
        );
      expect(result).toContainEqual({
        analysisObject: getFullySelectedAnalysisObject(),
        selectionType: AnalysisObjectSelectionType.FULL,
      });
    });

    it("should skip selection states with undefined analysisObject", () => {
      const analysisObject = getPartiallySelectedAnalysisObject();
      const selectionStates: any = [
        {
          analysisObject: undefined,
          selectionType: AnalysisObjectSelectionType.PARTIAL,
        },
        { analysisObject, selectionType: AnalysisObjectSelectionType.PARTIAL },
      ];
      const result =
        service.computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection(
          analysisObject,
          selectionStates
        );
      expect(result).toContainEqual({
        analysisObject,
        selectionType: AnalysisObjectSelectionType.FULL,
      });
    });
  });

  describe("constructFullySelectedAnalysisObjectSelectionStates", () => {
    it("should convert the provided analysis objects to full selection analysis object selection states", () => {
      const expectedAnalysisObjectSelectionState = [
        getFullySelectedAnalysisObjectSelectionState(),
        {
          ...getPartiallySelectedAnalysisObjectSelectionState(),
          selectionType: AnalysisObjectSelectionType.FULL,
        },
      ];
      const listOfAnalysisObjects = [
        getFullySelectedAnalysisObject(),
        getPartiallySelectedAnalysisObject(),
      ];
      const actualAnalysisObjectSelectionState =
        service.constructFullySelectedAnalysisObjectSelectionStates(
          listOfAnalysisObjects
        );

      expect(expectedAnalysisObjectSelectionState).toEqual(
        actualAnalysisObjectSelectionState
      );
    });
  });

  describe("isAnalysisObjectFullySelected", () => {
    it("should return true if the analysis object is initially fully selected and select all toggled is null", () => {
      const actual = service.isAnalysisObjectFullySelected(
        getFullySelectedAnalysisObject(),
        getListOfAnalysisObjectSelectionState()
      );
      expect(actual).toBeTruthy();
    });

    it("should return false if the analysis object is not initially fully selected and select all toggled is null", () => {
      const actual = service.isAnalysisObjectFullySelected(
        getFullySelectedAnalysisObject(),
        [getPartiallySelectedAnalysisObjectSelectionState()]
      );
      expect(actual).toBeFalsy();
    });
  });

  describe("isAnalysisObjectPartiallySelected", () => {
    it("should return true if the analysis object is initially partially selected and select all toggled is null", () => {
      const actual = service.isAnalysisObjectPartiallySelected(
        getPartiallySelectedAnalysisObject(),
        getListOfAnalysisObjectSelectionState()
      );
      expect(actual).toBeTruthy();
    });

    it("should return false if the analysis object is not initially partially selected and select all toggled is null", () => {
      const actual = service.isAnalysisObjectPartiallySelected(
        getPartiallySelectedAnalysisObject(),
        [getFullySelectedAnalysisObjectSelectionState()]
      );
      expect(actual).toBeFalsy();
    });
  });
});

const PARTIALLY_SELECTED_ANALYSIS_OBJECT_ID = "partiallyAnalysisObjectId";
const FULLY_SELECTED_ANALYSIS_OBJECT_ID = "fullyAnalysisObjectId";

function getListOfAnalysisObjectSelectionState() {
  return [
    getPartiallySelectedAnalysisObjectSelectionState(),
    getFullySelectedAnalysisObjectSelectionState(),
  ];
}

function getFullySelectedAnalysisObjectSelectionState() {
  return {
    analysisObject: getFullySelectedAnalysisObject(),
    selectionType: AnalysisObjectSelectionType.FULL,
  };
}

function getPartiallySelectedAnalysisObjectSelectionState() {
  return {
    analysisObject: getPartiallySelectedAnalysisObject(),
    selectionType: AnalysisObjectSelectionType.PARTIAL,
  };
}

function getPartiallySelectedAnalysisObject() {
  return { id: PARTIALLY_SELECTED_ANALYSIS_OBJECT_ID };
}

function getFullySelectedAnalysisObject() {
  return { id: FULLY_SELECTED_ANALYSIS_OBJECT_ID };
}
