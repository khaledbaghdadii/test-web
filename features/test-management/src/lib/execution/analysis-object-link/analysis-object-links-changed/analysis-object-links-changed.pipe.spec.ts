import {
  ANALYSIS_OBJECT_1,
  ANALYSIS_OBJECT_2,
  analysisObjectId1,
  analysisObjectId2,
  getFullySelectedAnalysisObject,
  getInitiallyFullyLinkedAnalysisObject,
  getInitiallyPartiallyLinkedAnalysisObject,
} from "../analysis-object-link-test-utils";
import { AnalysisObjectSelectionStateService } from "../analysis-object-linking/analysis-object-selection-state.service";
import { AnalysisObjectLinksChangedPipe } from "./analysis-object-links-changed.pipe";
import { TestBed } from "@angular/core/testing";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
} from "@mxflow/features/analysis-objects";

describe("AnalysisObjectLinksChangedPipe", () => {
  let analysisObjectSelectionStateService: AnalysisObjectSelectionStateService;
  let pipe: AnalysisObjectLinksChangedPipe;

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
        AnalysisObjectLinksChangedPipe,
      ],
    });

    pipe = TestBed.inject(AnalysisObjectLinksChangedPipe);
  });

  it("create an instance", () => {
    expect(pipe).toBeTruthy();
  });

  it("should return false if no analysis objects were selected or unselected", () => {
    const initialSelection = [
      getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
    ];
    const currentSelection = [
      getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
    ];
    expect(pipe.transform(initialSelection, currentSelection)).toBeFalsy();
  });

  it("should return true if user selected a new analysis object", () => {
    const initialSelection = [
      getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
    ];
    const currentSelection = [
      getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
      getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
    ];
    expect(pipe.transform(initialSelection, currentSelection)).toBeTruthy();
  });

  it("should return true if a user unselected a analysis object", () => {
    const initialSelection = [
      getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
    ];
    const currentSelection: AnalysisObjectSelectionState<AnalysisObject>[] = [];
    expect(pipe.transform(initialSelection, currentSelection)).toBeTruthy();
  });

  it("should return true if a user unselected an existing analysis object and selected a different one", () => {
    const initialSelection = [
      getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
    ];
    const currentSelection = [
      getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
    ];
    expect(pipe.transform(initialSelection, currentSelection)).toBeTruthy();
  });

  it("should return false if initial and current selections are empty", () => {
    expect(pipe.transform([], [])).toBeFalsy();
  });

  it("should return true if initial selection is empty and current selection is not", () => {
    expect(
      pipe.transform([], [getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1)])
    ).toBeTruthy();
  });

  it("should return true if current selection is empty and initial selection is not", () => {
    expect(
      pipe.transform(
        [getInitiallyFullyLinkedAnalysisObject(analysisObjectId1)],
        []
      )
    ).toBeTruthy();
  });

  it("should return true if initially partially selected analysis objects are fully selected", () => {
    jest
      .spyOn(
        analysisObjectSelectionStateService,
        "getIdsWithPartialToFullSelectionChange"
      )
      .mockReturnValue([analysisObjectId1]);
    const initialSelection = [
      getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
    ];
    const currentSelection = [
      getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
    ];
    expect(pipe.transform(initialSelection, currentSelection)).toBeTruthy();
  });

  it("should return true if a user unselects an analysis object and fully selects another that was initially partially linked", () => {
    jest
      .spyOn(
        analysisObjectSelectionStateService,
        "getIdsWithPartialToFullSelectionChange"
      )
      .mockReturnValue([analysisObjectId2]);
    const initialSelection = [
      getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
      getInitiallyPartiallyLinkedAnalysisObject(analysisObjectId2),
    ];
    const currentSelection = [
      getFullySelectedAnalysisObject(ANALYSIS_OBJECT_2),
    ];
    expect(pipe.transform(initialSelection, currentSelection)).toBeTruthy();
  });

  it("returns true if initial selection contains undefined analysisObject and current selection is valid", () => {
    const initialSelection = [
      {
        analysisObject: undefined,
      } as unknown as AnalysisObjectSelectionState<AnalysisObject>,
    ];
    const currentSelection = [
      getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
    ];
    expect(pipe.transform(initialSelection, currentSelection)).toBeTruthy();
  });

  it("returns true if current selection contains undefined analysisObject and initial selection is valid", () => {
    const initialSelection = [
      getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
    ];
    const currentSelection = [
      {
        analysisObject: undefined,
      } as unknown as AnalysisObjectSelectionState<AnalysisObject>,
    ];
    expect(pipe.transform(initialSelection, currentSelection)).toBeTruthy();
  });

  it("returns false if both initial and current selections only contain undefined analysisObject", () => {
    const initialSelection = [
      {
        analysisObject: undefined,
      } as unknown as AnalysisObjectSelectionState<AnalysisObject>,
    ];
    const currentSelection = [
      {
        analysisObject: undefined,
      } as unknown as AnalysisObjectSelectionState<AnalysisObject>,
    ];
    expect(pipe.transform(initialSelection, currentSelection)).toBeFalsy();
  });
});
