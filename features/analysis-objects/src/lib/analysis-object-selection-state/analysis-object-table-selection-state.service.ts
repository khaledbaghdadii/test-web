import { Injectable } from "@angular/core";
import { AnalysisObject } from "../analysis-object";
import { AnalysisObjectSelectionState } from "./analysis-object-link-state";
import { AnalysisObjectSelectionType } from "./analysis-object-selection-type.enum";

@Injectable({
  providedIn: "root",
})
export class AnalysisObjectTableSelectionStateService {
  computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection<
    T extends AnalysisObject
  >(
    analysisObject: T,
    analysisObjectSelectionStates: AnalysisObjectSelectionState<T>[]
  ): AnalysisObjectSelectionState<T>[] {
    if (
      this.isAnalysisObjectSelected(
        analysisObjectSelectionStates,
        analysisObject.id
      )
    ) {
      return this.replaceExistingAnalysisObjectSelectionStateWithFullSelection(
        analysisObjectSelectionStates,
        analysisObject
      );
    } else {
      return this.appendFullySelectedAnalysisObjectSelectionState(
        analysisObjectSelectionStates,
        analysisObject
      );
    }
  }

  private isAnalysisObjectSelected<T extends AnalysisObject>(
    analysisObjectSelectionStates: AnalysisObjectSelectionState<T>[],
    analysisObjectId: string
  ) {
    return analysisObjectSelectionStates.some(
      (analysisObjectSelectionState) =>
        analysisObjectSelectionState.analysisObject?.id === analysisObjectId
    );
  }

  private replaceExistingAnalysisObjectSelectionStateWithFullSelection<
    T extends AnalysisObject
  >(
    analysisObjectSelectionStates: AnalysisObjectSelectionState<T>[],
    analysisObject: T
  ): AnalysisObjectSelectionState<T>[] {
    return analysisObjectSelectionStates.map((analysisObjectSelectionState) =>
      analysisObjectSelectionState.analysisObject?.id === analysisObject.id
        ? this.constructFullySelectedAnalysisObjectSelectionState(
            analysisObject
          )
        : analysisObjectSelectionState
    );
  }

  private appendFullySelectedAnalysisObjectSelectionState<
    T extends AnalysisObject
  >(
    analysisObjectSelectionStates: AnalysisObjectSelectionState<T>[],
    analysisObject: T
  ): AnalysisObjectSelectionState<T>[] {
    return [
      ...analysisObjectSelectionStates,
      this.constructFullySelectedAnalysisObjectSelectionState(analysisObject),
    ];
  }

  constructFullySelectedAnalysisObjectSelectionStates<T extends AnalysisObject>(
    analysisObjects: T[]
  ): AnalysisObjectSelectionState<T>[] {
    return analysisObjects.map((analysisObject) =>
      this.constructFullySelectedAnalysisObjectSelectionState(analysisObject)
    );
  }

  isAnalysisObjectFullySelected<T extends AnalysisObject>(
    analysisObject: T,
    selectedAnalysisObjects: AnalysisObjectSelectionState<T>[]
  ): boolean {
    const initiallySelectedAnalysisObject =
      this.findAnalysisObjectSelectionState(
        selectedAnalysisObjects,
        analysisObject.id
      );
    return (
      initiallySelectedAnalysisObject?.selectionType ===
        AnalysisObjectSelectionType.FULL || false
    );
  }

  isAnalysisObjectPartiallySelected<T extends AnalysisObject>(
    analysisObject: T,
    selectedAnalysisObjects: AnalysisObjectSelectionState<T>[]
  ): boolean {
    const initiallySelectedAnalysisObject =
      this.findAnalysisObjectSelectionState(
        selectedAnalysisObjects,
        analysisObject.id
      );
    return (
      initiallySelectedAnalysisObject?.selectionType ===
        AnalysisObjectSelectionType.PARTIAL || false
    );
  }

  private findAnalysisObjectSelectionState<T extends AnalysisObject>(
    analysisObjectSelectionStates: AnalysisObjectSelectionState<T>[],
    analysisObjectId: string
  ) {
    return analysisObjectSelectionStates.find(
      (selectionState) => selectionState.analysisObject.id === analysisObjectId
    );
  }

  private constructFullySelectedAnalysisObjectSelectionState<
    T extends AnalysisObject
  >(analysisObject: T): AnalysisObjectSelectionState<T> {
    return {
      analysisObject: analysisObject,
      selectionType: AnalysisObjectSelectionType.FULL,
    };
  }
}
