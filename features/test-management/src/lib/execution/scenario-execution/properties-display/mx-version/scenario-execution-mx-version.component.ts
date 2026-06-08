import { Component, Input } from "@angular/core";
import { Tooltip } from "primeng/tooltip";

@Component({
  selector: "mxevolve-scenario-execution-mx-version",
  imports: [Tooltip],
  template: `
    <span
      id="mx-version"
      class="truncate"
      pTooltip="{{ mxVersion ?? 'Empty' }}"
      tooltipPosition="top"
      [showDelay]="1000"
    >
      {{ mxVersion ?? "-" }}
    </span>
  `,
})
export class ScenarioExecutionMxVersionComponent {
  @Input({ required: true }) mxVersion?: string;
}
