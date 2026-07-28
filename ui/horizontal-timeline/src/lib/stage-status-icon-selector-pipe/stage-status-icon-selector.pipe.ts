import { Pipe, PipeTransform } from "@angular/core";
import { StageStatus } from "../status-bar/stage-status";

@Pipe({
  name: "stageStatusIconSelector",
  standalone: false,
})
export class StageStatusIconSelectorPipe implements PipeTransform {
  transform(status: StageStatus): string {
    switch (status) {
      case StageStatus.FAILED:
        return "pi pi-times-circle";
      case StageStatus.FAILED_TO_START:
        return "pi pi-times-circle";
      case StageStatus.PASSED:
        return "pi pi-check-circle";
      case StageStatus.RUNNING:
        return "pi pi-spin pi-spinner";
      case StageStatus.NOT_STARTED:
        return "pi pi-clock";
      case StageStatus.ON_HOLD:
        return "pi pi-pause-circle";
      case StageStatus.PENDING_INPUT:
        return "pi pi-exclamation-triangle";
      case StageStatus.SKIPPED:
        return "pi pi-chevron-circle-right";
      case StageStatus.STOPPED:
        return "pi pi-ban";
      case StageStatus.CANCELED:
        return "pi pi-minus-circle";
      default:
        return "pi pi-clock";
    }
  }
}
