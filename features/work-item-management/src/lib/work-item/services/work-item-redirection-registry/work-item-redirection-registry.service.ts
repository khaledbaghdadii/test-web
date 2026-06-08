import { Injectable } from "@angular/core";
import { WorkItemRedirector } from "../../handler/redirect/work-item-redirector";

@Injectable({
  providedIn: "root",
})
export class WorkItemRedirectionRegistryService {
  private registry = new Map<string, WorkItemRedirector>();

  registerHandler(
    domain: string,
    workItemCategory: string,
    handler: WorkItemRedirector
  ): void {
    this.registry.set(`${domain}:${workItemCategory}`, handler);
  }

  getHandler(
    domain: string,
    workItemCategory: string
  ): WorkItemRedirector | undefined {
    return this.registry.get(`${domain}:${workItemCategory}`);
  }
}
