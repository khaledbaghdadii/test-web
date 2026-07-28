import { Component, computed, inject, input } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { EMPTY } from "rxjs";
import { Divider } from "primeng/divider";
import { ValidationProcessExecution } from "@mxevolve/domains/business-process/data-access";
import { RepositoryNameComponent } from "@mxevolve/domains/scm/widget";
import { InfraGroupNameComponent } from "@mxevolve/domains/infra/widget";
import { FinalProductApiService } from "@mxevolve/domains/artifact/data-access";
import { ShowMoreLessTextComponent } from "@mxflow/ui/utils";
import { CommitIdDisplayComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-validation-process-activity-run-details",
  host: { style: "display: contents;" },
  imports: [
    Divider,
    RepositoryNameComponent,
    InfraGroupNameComponent,
    ShowMoreLessTextComponent,
    CommitIdDisplayComponent,
  ],
  templateUrl: "./activity-run-details.component.html",
})
export class ValidationProcessActivityRunDetailsComponent {
  readonly execution = input.required<ValidationProcessExecution>();

  private readonly finalProductApiService = inject(FinalProductApiService);

  readonly description = computed(() => {
    const description = this.execution().description;
    return description?.trim() ? description : undefined;
  });

  private readonly finalProductResource = rxResource({
    params: () => ({
      projectId: this.execution().projectId,
      finalProductId: this.execution().input.finalProductId,
    }),
    stream: ({ params }) =>
      params.finalProductId
        ? this.finalProductApiService.getFinalProductById(
            params.projectId,
            params.finalProductId
          )
        : EMPTY,
  });

  readonly finalProductCommitId = computed(() =>
    this.finalProductResource.hasValue()
      ? this.finalProductResource.value().configurationCommitId
      : undefined
  );

  readonly showParentBranchName = computed(() => {
    const { businessProcessQualityLevel, createBranch } =
      this.execution().input;
    return businessProcessQualityLevel === "MQG" && createBranch;
  });
}
