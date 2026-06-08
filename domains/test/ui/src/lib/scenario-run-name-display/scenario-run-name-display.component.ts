import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "mxevolve-scenario-run-name-display",
  imports: [RouterLink],
  template: `
    @if (scenarioRunLink()) {
    <a [routerLink]="scenarioRunLink()" target="_blank" class="p-button-link">
      {{ name() }}
    </a>
    } @else {
    {{ name() }}
    }
  `,
})
export class ScenarioRunNameDisplayComponent {
  scenarioRunId = input.required<string>();
  name = input.required<string>();
  projectId = input.required<string>();

  scenarioRunLink = computed(() => {
    const projectId = this.projectId();
    const scenarioRunId = this.scenarioRunId();
    return projectId && scenarioRunId
      ? `/app/${projectId}/test/execution/details/${scenarioRunId}`
      : null;
  });
}
