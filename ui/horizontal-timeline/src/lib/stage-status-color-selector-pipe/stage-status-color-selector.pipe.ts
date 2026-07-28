import { Pipe, PipeTransform } from "@angular/core";
import { StageStatus } from "../status-bar/stage-status";

@Pipe({
  name: "stageStatusColorSelector",
  standalone: false,
})
export class StageStatusColorSelectorPipe implements PipeTransform {
  transform(status: StageStatus) {
    switch (status) {
      case StageStatus.FAILED:
      case StageStatus.FAILED_TO_START:
        return "#dc3545";

      case StageStatus.PASSED:
        return "#28a745";

      case StageStatus.RUNNING:
        return "#007bff";

      case StageStatus.NOT_STARTED:
        return "#9fa5aa";

      case StageStatus.PENDING_INPUT:
        return "#ffc107";

      case StageStatus.SKIPPED:
        return "#007bff";
      case StageStatus.STOPPED:
        return "#000000";
      default:
        return "#9fa5aa";
    }
  }
}
