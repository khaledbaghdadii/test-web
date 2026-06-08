import { Injectable } from "@angular/core";
import { WorkItem } from "../../model/work-item";
import { WorkItemRedirectionRegistryService } from "../work-item-redirection-registry/work-item-redirection-registry.service";
@Injectable({
  providedIn: "root",
})
export class WorkItemRedirectorService {
  constructor(private registry: WorkItemRedirectionRegistryService) {}

  redirect(workItem: WorkItem): void {
    const handler = this.registry.getHandler(
      workItem.domain,
      workItem.workItemCategory
    );
    if (handler) {
      handler.redirect(workItem);
    } else {
      console.error("No redirection handler found for", workItem);
    }
  }
}
