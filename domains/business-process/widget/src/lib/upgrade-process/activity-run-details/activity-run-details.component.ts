import { Component, computed, input } from "@angular/core";
import { Divider } from "primeng/divider";
import { UpgradeProcessExecution } from "@mxevolve/domains/business-process/util";
import { RepositoryNameComponent } from "@mxevolve/domains/scm/widget";
import { InfraGroupNameComponent } from "@mxevolve/domains/infra/widget";
import { ShowMoreLessTextComponent } from "@mxflow/ui/utils";

@Component({
  selector: "mxevolve-upgrade-process-activity-run-details",
  imports: [
    Divider,
    RepositoryNameComponent,
    InfraGroupNameComponent,
    ShowMoreLessTextComponent,
  ],
  templateUrl: "./activity-run-details.component.html",
})
export class ActivityRunDetailsComponent {
  readonly execution = input.required<UpgradeProcessExecution>();
  readonly description = computed(() => {
    const description = this.execution().description;
    return description?.trim() ? description : undefined;
  });
}
