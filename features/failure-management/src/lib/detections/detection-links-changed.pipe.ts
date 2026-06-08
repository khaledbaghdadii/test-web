import { Pipe, PipeTransform } from "@angular/core";
import { ListUtils } from "../utils/list-utils";
import { AnalysisObject } from "@mxflow/features/analysis-objects";

@Pipe({
  name: "detectionLinksChanged",
  standalone: true,
})
export class DetectionLinksChangedPipe implements PipeTransform {
  transform(
    initialDetectionIdsSelection: string[],
    currentDetectionsSelection: AnalysisObject[]
  ): boolean {
    const currentDetectionsSelectionIds = currentDetectionsSelection.map(
      (detection) => detection.id
    );
    return !ListUtils.arePermutations(
      initialDetectionIdsSelection,
      currentDetectionsSelectionIds
    );
  }
}
