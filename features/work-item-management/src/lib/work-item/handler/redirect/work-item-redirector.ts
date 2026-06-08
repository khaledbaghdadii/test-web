import { WorkItemRedirectionRegistryService } from "../../services/work-item-redirection-registry/work-item-redirection-registry.service";
import { WorkItem } from "../../model/work-item";

export abstract class WorkItemRedirector {
  constructor(
    registry: WorkItemRedirectionRegistryService,
    domain: string,
    workItemCategory: string
  ) {
    registry.registerHandler(domain, workItemCategory, this);
  }
  abstract redirect(workItem: WorkItem): void;
}
