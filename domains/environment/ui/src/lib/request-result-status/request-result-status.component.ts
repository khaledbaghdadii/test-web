import { Component, computed, input } from "@angular/core";
import { Tag } from "primeng/tag";
import { Tooltip } from "primeng/tooltip";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { getManagementRequestResultProperties } from "@mxevolve/domains/environment/util";

@Component({
  selector: "mxevolve-request-result-status",
  standalone: true,
  imports: [Tag, MxevolveIconComponent, Tooltip],
  template: `
    @if (properties(); as props) {
    <span class="inline-flex items-center gap-1">
      <p-tag
        class="text-sm"
        [severity]="props.color"
        value="{{ props.title }}"
      />
      @if (props.hasPopover) {
      <mxevolve-icon
        name="info"
        size="sm"
        class="cursor-pointer ml-4"
        [color]="'#007bff'"
        [pTooltip]="resultMessage() ? 'Click to see more details' : ''"
        tooltipStyleClass="min-w-max"
        tooltipPosition="top"
      />
      }
    </span>
    }
  `,
})
export class RequestResultStatusComponent {
  readonly status = input.required<string>();
  readonly resultStatus = input<string>();
  readonly resultMessage = input<string>();

  readonly properties = computed(() =>
    getManagementRequestResultProperties(this.status(), this.resultStatus())
  );
}
