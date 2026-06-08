import { AnalysisObject } from "../analysis-object";
import { AnalysisObjectSelectionType } from "./analysis-object-selection-type.enum";

export interface AnalysisObjectSelectionState<T extends AnalysisObject> {
  analysisObject: T;
  selectionType: AnalysisObjectSelectionType;
  selectionMessage?: string;
}
