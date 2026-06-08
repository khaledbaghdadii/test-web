import { inject, Pipe, PipeTransform } from "@angular/core";
import { ListUtils } from "../../../utils/list-utils";
import { AnalysisObjectSelectionStateService } from "../analysis-object-linking/analysis-object-selection-state.service";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
} from "@mxflow/features/analysis-objects";

@Pipe({
  name: "analysisObjectLinksChanged",
  standalone: true,
})
export class AnalysisObjectLinksChangedPipe implements PipeTransform {
  private analysisObjectSelectionStateService = inject(
    AnalysisObjectSelectionStateService
  );

  transform<T extends AnalysisObject>(
    initialAnalysisObjectSelectionState: AnalysisObjectSelectionState<T>[],
    currentAnalysisObjectsSelectionState: AnalysisObjectSelectionState<T>[]
  ): boolean {
    const initialAnalysisObjectIdsSelection =
      initialAnalysisObjectSelectionState.map(
        (initialSelectionState) => initialSelectionState.analysisObject?.id
      );

    const currentAnalysisObjectIdsSelection =
      currentAnalysisObjectsSelectionState.map(
        (currentSelectionState) => currentSelectionState.analysisObject?.id
      );

    const analysisObjectIdsWithPartialToFullSelectionChange =
      this.analysisObjectSelectionStateService.getIdsWithPartialToFullSelectionChange(
        initialAnalysisObjectSelectionState,
        currentAnalysisObjectsSelectionState
      );

    return (
      !ListUtils.arePermutations(
        initialAnalysisObjectIdsSelection,
        currentAnalysisObjectIdsSelection
      ) || analysisObjectIdsWithPartialToFullSelectionChange.length > 0
    );
  }
}
