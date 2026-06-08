import { Component, Input } from "@angular/core";
import { DurationPipeModule } from "@mxflow/pipe";

@Component({
  selector: "mxevolve-scenario-execution-duration",
  template: `
    <span id="duration" class="truncate">
      {{ endTime ? (startTime | duration : endTime) : "-" }}
    </span>
  `,
  imports: [DurationPipeModule],
})
export class ScenarioExecutionDurationComponent {
  @Input({ required: true }) startTime: string;
  @Input({ required: true }) endTime?: string | null;
}
