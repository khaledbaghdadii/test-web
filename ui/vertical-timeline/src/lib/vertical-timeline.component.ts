import { Component, Input } from "@angular/core";
import {
  VerticalTimelineStage,
  VerticalTimelineStageStatus,
} from "./stage/vertical-timeline-stage";
import { CommonModule } from "@angular/common";
import { TimelineModule } from "primeng/timeline";

@Component({
  selector: "mxevolve-vertical-timeline",
  templateUrl: "./vertical-timeline.component.html",
  styleUrls: ["./vertical-timeline.component.scss"],
  imports: [CommonModule, TimelineModule],
})
export class VerticalTimelineComponent {
  @Input() stages: VerticalTimelineStage[];

  getStageSeparatorStyleClass(status: VerticalTimelineStageStatus): {
    [key: string]: boolean;
  } {
    return {
      "stage-running": status === VerticalTimelineStageStatus.RUNNING,
      "stage-passed": status === VerticalTimelineStageStatus.PASSED,
      "stage-failed": status === VerticalTimelineStageStatus.FAILED,
    };
  }
}
