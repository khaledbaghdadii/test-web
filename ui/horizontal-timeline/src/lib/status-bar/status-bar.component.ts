import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Stage } from "./stage";
import { StageStatus } from "./stage-status";
import { TooltipModule } from "primeng/tooltip";
import { SkeletonModule } from "primeng/skeleton";
import { CommonModule } from "@angular/common";
import { StatusIconComponent } from "./status-icon/status-icon.component";

@Component({
  imports: [CommonModule, TooltipModule, SkeletonModule, StatusIconComponent],
  selector: "mxflow-status-bar",
  templateUrl: "./status-bar.component.html",
  styleUrls: ["./status-bar.component.scss"],
})
export class StatusBarComponent {
  @Input() stages: Stage[];
  @Input() selectedStage: Stage;
  @Input() isLoading: boolean;
  @Input() numberOfStages: number;
  @Output() onStageSelected: EventEmitter<string> = new EventEmitter<string>();

  isStageFailed(stageStatus: StageStatus): boolean {
    return stageStatus === StageStatus.FAILED;
  }

  selectStage(stage: Stage) {
    if (stage.status !== StageStatus.NOT_STARTED) {
      this.onStageSelected.emit(stage.name);
    }
  }

  getStageClasses(stage: Stage): string[] {
    return [
      "stage",
      this.selectedStage?.name === stage?.name ? "stage-selected" : "",
      stage.status === StageStatus.NOT_STARTED ? "stage-disabled" : "",
    ];
  }
}
