import { Component, computed, input } from "@angular/core";
import { Tooltip } from "primeng/tooltip";

@Component({
  selector: "mxevolve-commit-id-display",
  imports: [Tooltip],
  template: `<span [pTooltip]="commitId()" tooltipPosition="top">{{
    displayValue()
  }}</span>`,
})
export class CommitIdDisplayComponent {
  commitId = input<string | undefined>(undefined);

  displayValue = computed(() => {
    const value = this.commitId();
    return value ? value.substring(0, 10) : "-";
  });
}
