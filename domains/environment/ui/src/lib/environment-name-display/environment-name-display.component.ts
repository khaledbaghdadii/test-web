import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "mxevolve-environment-name-display",
  imports: [RouterLink],
  template: `
    @if (environmentLink()) {
    <a [routerLink]="environmentLink()" target="_blank" class="p-button-link">
      {{ environmentId() }}
    </a>
    } @else {
    {{ environmentId() }}
    }
  `,
})
export class EnvironmentNameDisplayComponent {
  readonly environmentId = input.required<string>();
  readonly projectId = input.required<string>();

  readonly environmentLink = computed(() => {
    const projectId = this.projectId();
    const environmentId = this.environmentId();
    return projectId && environmentId
      ? `/app/${projectId}/environments/${environmentId}`
      : null;
  });
}
