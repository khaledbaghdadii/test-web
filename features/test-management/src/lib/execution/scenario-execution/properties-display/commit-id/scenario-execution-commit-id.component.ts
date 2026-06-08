import { Component, Input } from "@angular/core";
import { CommitIdPipeModule } from "@mxflow/pipe";
import { Tooltip } from "primeng/tooltip";

@Component({
  selector: "mxevolve-scenario-execution-commit-id",
  imports: [CommitIdPipeModule, Tooltip],
  template: `
    <span
      id="scenario-execution-commit-id"
      class="truncate"
      [pTooltip]="commitId | commitIdShortner"
      tooltipPosition="top"
      [showDelay]="1000"
    >
      {{ commitId | commitIdShortner }}
    </span>
  `,
})
export class ScenarioExecutionCommitIdComponent {
  @Input({ required: true }) commitId?: string;
}
