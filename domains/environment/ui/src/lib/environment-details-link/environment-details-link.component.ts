import { Component, computed, input } from "@angular/core";
import { ButtonModule } from "primeng/button";

@Component({
  selector: "mxevolve-environment-details-link",
  standalone: true,
  imports: [ButtonModule],
  template: `
    <a [href]="detailsLink()" target="_blank" rel="noopener noreferrer">
      <p-button
        [text]="true"
        severity="primary"
        label="Details"
        data-testid="environment-details-button"
      >
      </p-button>
    </a>
  `,
  styles: [
    `
      a {
        text-decoration: none;
      }
    `,
  ],
})
export class EnvironmentDetailsLinkComponent {
  readonly projectId = input.required<string>();
  readonly environmentId = input.required<string>();

  readonly detailsLink = computed(() => {
    return `/app/${this.projectId()}/environments/${this.environmentId()}`;
  });
}
