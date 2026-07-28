import { Component, computed, input, ViewEncapsulation } from "@angular/core";
import { Button } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-scenario-details-link-button",
  imports: [Button, TooltipModule, MxevolveIconComponent],
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
      .scenario-details-tooltip {
        white-space: nowrap;
      }
    `,
  ],
  template: `
    <p-button
      [text]="true"
      [rounded]="true"
      size="small"
      severity="primary"
      ariaLabel="Open scenario details"
      pTooltip="Scenario details"
      tooltipPosition="top"
      appendTo="body"
      tooltipStyleClass="scenario-details-tooltip"
      [disabled]="disabled()"
      (click)="openDetails(); $event.stopPropagation()"
      data-testid="scenario-details-link"
    >
      <mxevolve-icon name="description" />
    </p-button>
  `,
  host: {
    class: "inline-flex",
  },
})
export class ScenarioDetailsLinkButtonComponent {
  readonly projectId = input.required<string>();
  readonly scenarioRunId = input.required<string>();
  readonly disabled = input<boolean>(false);

  readonly detailsLink = computed(
    () =>
      `/app/${this.projectId()}/test/execution/details/${this.scenarioRunId()}`
  );

  openDetails(): void {
    if (this.disabled()) {
      return;
    }

    window.open(this.detailsLink(), "_blank", "noopener,noreferrer");
  }
}
