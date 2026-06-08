import { Component, computed, inject, input, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";

import { Message } from "primeng/message";
import type { BranchCreationDetails } from "@mxevolve/domains/business-process/util";
import { DevelopmentDetailsComponent } from "@mxevolve/domains/scm/composite-widget";
import {
  Development,
  MergeRequestService,
  MergeRequestOverview,
} from "@mxevolve/domains/scm/data-access";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-branch-details",
  imports: [Message, DevelopmentDetailsComponent, MxevolveIconComponent],
  providers: [MergeRequestService],
  templateUrl: "./branch-details.component.html",
})
export class BranchDetailsComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly branchCreation = input.required<BranchCreationDetails>();
  readonly development = input.required<Development>();
  readonly commitsBehindCount = input<number>(0);

  private readonly mergeRequestService = inject(MergeRequestService);

  readonly failureDetailsVisible = signal(false);

  readonly mergeRequestResource = rxResource({
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
      this.mergeRequestService.getFilteredMergeRequests(params.projectId, {
        developmentId: params.developmentId,
        contextId: params.processId,
      }),
  });

  readonly latestMergeRequest = computed<MergeRequestOverview | undefined>(
    () => {
      if (!this.mergeRequestResource.hasValue()) {
        return undefined;
      }
      const mergeRequests = this.mergeRequestResource.value();
      return [...mergeRequests]
        .sort(
          (first, second) =>
            new Date(second.createdOn ?? 0).getTime() -
            new Date(first.createdOn ?? 0).getTime()
        )
        .at(0);
    }
  );

  toggleFailureDetails(): void {
    this.failureDetailsVisible.update((visible) => !visible);
  }
}
