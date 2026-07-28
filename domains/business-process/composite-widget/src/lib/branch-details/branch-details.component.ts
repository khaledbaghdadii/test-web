import { Component, computed, inject, input, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";

import { Message } from "primeng/message";
import type { BranchCreationDetails } from "@mxevolve/domains/business-process/util";
import {
  BranchDetailsFacadeService,
  DevelopmentDetailsComponent,
} from "@mxevolve/domains/scm/composite-widget";
import {
  CommitsService,
  Development,
  MergeRequestOverview,
  MergeRequestService,
} from "@mxevolve/domains/scm/data-access";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-branch-details",
  imports: [Message, DevelopmentDetailsComponent, MxevolveIconComponent],
  providers: [BranchDetailsFacadeService, MergeRequestService, CommitsService],
  templateUrl: "./branch-details.component.html",
})
export class BranchDetailsComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly branchCreation = input.required<BranchCreationDetails>();
  readonly development = input.required<Development>();

  private readonly branchDetailsFacade = inject(BranchDetailsFacadeService);

  readonly failureDetailsVisible = signal(false);

  private readonly mergeRequestResource = rxResource({
    params: () => {
      const developmentId = this.branchCreation().developmentId;
      if (!developmentId || this.branchCreation().failed) {
        return undefined;
      }
      return {
        projectId: this.projectId(),
        developmentId,
        processId: this.processId(),
      };
    },
    stream: ({ params }) =>
      this.branchDetailsFacade.getLatestMergeRequest(
        params.projectId,
        params.developmentId,
        params.processId
      ),
  });

  readonly latestMergeRequest = computed<MergeRequestOverview | undefined>(() =>
    this.mergeRequestResource.value()
  );

  toggleFailureDetails(): void {
    this.failureDetailsVisible.update((visible) => !visible);
  }
}
