import { inject, Injectable } from "@angular/core";
import { WorkItemRedirector } from "../../work-item-redirector";
import { WorkItemRedirectionRegistryService } from "../../../../services/work-item-redirection-registry/work-item-redirection-registry.service";
import { WorkItem } from "../../../../model/work-item";

@Injectable({ providedIn: "root" })
export class MergeRequestReviewRedirector extends WorkItemRedirector {
  constructor() {
    const registry = inject(WorkItemRedirectionRegistryService);
    super(registry, "scm", "merge_request_review");
  }

  redirect(workItem: WorkItem): void {
    const url = workItem.metadata?.["pullRequestUrl"];
    if (url && typeof url === "string") {
      window.open(url, "_blank");
    }
  }
}
