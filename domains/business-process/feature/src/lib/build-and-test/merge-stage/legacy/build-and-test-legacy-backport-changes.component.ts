import { Component, computed, inject, input } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { FinalProductDetailsComponent } from "@mxevolve/domains/artifact/widget";
import {
  BuildAndTestBackport,
  ExecutionStatus,
} from "@mxevolve/domains/business-process/util";
import { DevelopmentService } from "@mxevolve/domains/scm/data-access";
import { DevelopmentDetailsComponent } from "@mxevolve/domains/scm/composite-widget";
import { MxevolveIconComponent, ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { Message } from "primeng/message";
import { PanelModule } from "primeng/panel";
import { BuildAndTestBackportActionsComponent } from "./build-and-test-backport-actions.component";
import { BuildAndTestBackportCherryPickAndMergeRequestComponent } from "./build-and-test-backport-cherry-pick-and-merge-request.component";

@Component({
  selector: "mxevolve-build-and-test-legacy-backport-changes",
  imports: [
    BuildAndTestBackportActionsComponent,
    BuildAndTestBackportCherryPickAndMergeRequestComponent,
    DevelopmentDetailsComponent,
    FinalProductDetailsComponent,
    Message,
    MxevolveIconComponent,
    PanelModule,
  ],
  providers: [DevelopmentService],
  templateUrl: "./build-and-test-legacy-backport-changes.component.html",
  host: {
    style: "display: contents;",
  },
})
export class BuildAndTestLegacyBackportChangesComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly repositoryId = input.required<string>();
  readonly processStatus = input.required<ExecutionStatus>();
  readonly backport = input.required<BuildAndTestBackport>();

  private readonly developmentService = inject(DevelopmentService);
  private readonly toastMessageService = inject(ToastMessageService);

  readonly developmentResource = rxResource({
    params: () => {
      const developmentId =
        this.backport().initializeDevelopmentState.developmentId;
      if (!developmentId) return undefined;
      return { projectId: this.projectId(), developmentId };
    },
    stream: ({ params }) =>
      this.developmentService.getDevelopment(
        params.projectId,
        params.developmentId
      ),
  });

  readonly shouldShowPublishing = computed(
    () =>
      !!this.backport().finalProductPublishing &&
      !!this.backport().willPublishFinalProduct
  );

  handleFinalProductError(message: string): void {
    this.toastMessageService.showError(message);
  }
}
