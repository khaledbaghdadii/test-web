import { inject, Injectable } from "@angular/core";
import { WorkItemRedirector } from "../../work-item-redirector";
import { WorkItemRedirectionRegistryService } from "../../../../services/work-item-redirection-registry/work-item-redirection-registry.service";
import { WorkItem } from "../../../../model/work-item";
import { IntegrateChangesUriFactoryService } from "@mxflow/features/business-process";

@Injectable({ providedIn: "root" })
export class MergeRequestReviewRedirector extends WorkItemRedirector {
  private readonly integrateChangesUriFactoryService = inject(
    IntegrateChangesUriFactoryService
  );

  constructor() {
    const registry = inject(WorkItemRedirectionRegistryService);
    super(registry, "scm", "merge_request_review");
  }

  redirect(workItem: WorkItem): void {
    const businessProcess = workItem.businessProcesses?.[0];
    if (businessProcess?.familyId) {
      const url =
        this.integrateChangesUriFactoryService.constructIntegrateChangesUri(
          businessProcess.id,
          businessProcess.familyId,
          workItem.projectId
        );
      if (url) {
        window.open(url, "_blank");
      }
    }
  }
}
