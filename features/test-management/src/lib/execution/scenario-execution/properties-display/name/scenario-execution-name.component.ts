import { Component, Input } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "mxevolve-scenario-execution-name",
  template: `
    <a
      id="scenario-execution-name"
      class="p-button-link"
      routerLink="/app/{{ projectId }}/test/execution/details/{{
        scenarioExecutionId
      }}"
    >
      {{ scenarioExecutionName }}
    </a>
  `,
  imports: [RouterLink],
})
export class ScenarioExecutionNameComponent {
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) scenarioExecutionId: string;
  @Input({ required: true }) scenarioExecutionName: string;
}
