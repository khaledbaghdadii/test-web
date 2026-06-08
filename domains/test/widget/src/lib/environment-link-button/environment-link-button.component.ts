import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Button } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-environment-link-button",
  standalone: true,
  imports: [Button, TooltipModule, MxevolveIconComponent, RouterLink],
  template: `
    <a [routerLink]="environmentLink()">
      <p-button
        [rounded]="true"
        [text]="true"
        size="small"
        ariaLabel="View environment details"
        pTooltip="Environment Details"
        tooltipPosition="top"
        tooltipStyleClass="whitespace-nowrap max-w-none"
      >
        <mxevolve-icon name="storage" />
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
export class EnvironmentLinkButtonComponent {
  readonly projectId = input.required<string>();
  readonly environmentId = input.required<string>();

  environmentLink(): string {
    return `/app/${this.projectId()}/environments/${this.environmentId()}`;
  }
}
