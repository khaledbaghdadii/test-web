import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StageStatus } from "../stage-status";
import { StageStatusColorSelectorPipeModule } from "../../stage-status-color-selector-pipe/stage-status-color-selector-pipe.module";
import { StageStatusIconSelectorPipeModule } from "../../stage-status-icon-selector-pipe/stage-status-icon-selector-pipe.module";

@Component({
  selector: "mxevolve-status-icon",
  imports: [
    CommonModule,
    StageStatusColorSelectorPipeModule,
    StageStatusIconSelectorPipeModule,
  ],
  template: `
    <span
      data-testid="stage-status-icon"
      [ngStyle]="{ color: status | stageStatusColorSelector }"
      [class]="status | stageStatusIconSelector"
      class="text-4xl"
    ></span>
  `,
})
export class StatusIconComponent {
  @Input() status: StageStatus;
}
