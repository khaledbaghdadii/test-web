import { Component, Input } from "@angular/core";
import { Tooltip } from "primeng/tooltip";

@Component({
  selector: "mxevolve-scenario-execution-mx-build-id",
  imports: [Tooltip],
  template: `
    <span
      class="truncate"
      [pTooltip]="mxBuildId ?? 'Empty'"
      tooltipPosition="top"
      [showDelay]="1000"
    >
      {{ mxBuildId ?? "-" }}
    </span>
  `,
})
export class ScenarioExecutionMxBuildIdComponent {
  @Input({ required: true }) mxBuildId?: string;
}
