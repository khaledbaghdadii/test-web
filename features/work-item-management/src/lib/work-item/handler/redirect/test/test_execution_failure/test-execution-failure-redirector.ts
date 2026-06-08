import { inject, Injectable } from "@angular/core";
import { WorkItemRedirector } from "../../work-item-redirector";
import { WorkItem } from "../../../../model/work-item";
import { WorkItemRedirectionRegistryService } from "../../../../services/work-item-redirection-registry/work-item-redirection-registry.service";
import { TestUnitUriFactoryPipe } from "@mxflow/test-management";

@Injectable({ providedIn: "root" })
export class TestExecutionFailureRedirector extends WorkItemRedirector {
  private readonly testUnitUriFactoryPipe = inject(TestUnitUriFactoryPipe);

  constructor() {
    const registry = inject(WorkItemRedirectionRegistryService);
    super(registry, "test", "test_execution_failure");
  }

  redirect(workItem: WorkItem): void {
    const testUnitId = workItem.metadata?.["testUnitId"] as string;
    window.open(
      this.testUnitUriFactoryPipe.transform(testUnitId, workItem.projectId),
      "_blank"
    );
  }
}
