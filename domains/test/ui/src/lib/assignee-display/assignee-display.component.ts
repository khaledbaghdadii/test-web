import { Component, input } from "@angular/core";
import { TagModule } from "primeng/tag";
import { Tooltip } from "primeng/tooltip";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-assignee-display",
  standalone: true,
  imports: [TagModule, Tooltip, MxevolveIconComponent],
  template: `
    @if (assigneeDisplayName()) {
    <p-tag
      severity="secondary"
      [pTooltip]="assigneeEmail()"
      tooltipPosition="top"
    >
      <div class="flex gap-2 items-center">
        <mxevolve-icon name="person" size="sm" />
        <span class="text-sm">{{ assigneeDisplayName() }}</span>
      </div>
    </p-tag>
    } @else {
    <span>-</span>
    }
  `,
})
export class AssigneeDisplayComponent {
  assigneeDisplayName = input.required<string>();
  assigneeEmail = input.required<string>();
}
