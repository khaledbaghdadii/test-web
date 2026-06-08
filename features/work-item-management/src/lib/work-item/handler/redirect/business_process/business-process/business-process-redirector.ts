import {
  createNgModule,
  EnvironmentInjector,
  inject,
  Injectable,
  Injector,
} from "@angular/core";
import { WorkItem } from "../../../../model/work-item";
import { WorkItemRedirectionRegistryService } from "../../../../services/work-item-redirection-registry/work-item-redirection-registry.service";
import { WorkItemRedirector } from "../../work-item-redirector";
import { ProjectUrlPipe } from "@mxflow/features/project";

interface UriPipe {
  transform(bpId: string, projectId: string): string;
}

@Injectable({ providedIn: "root" })
export class BusinessProcessRedirector extends WorkItemRedirector {
  private pipePromise?: Promise<UriPipe>;
  private injector = inject(Injector);

  constructor() {
    const registry = inject(WorkItemRedirectionRegistryService);
    super(registry, "business_process", "business_process");
  }

  redirect(workItem: WorkItem): void {
    const bpId = workItem.businessProcesses?.[0]?.id;
    if (!bpId) return;
    this.getPipe().then((pipe) => {
      const url = pipe.transform(bpId, workItem.projectId);
      window.open(url, "_blank");
    });
  }

  private getPipe(): Promise<UriPipe> {
    if (!this.pipePromise) {
      this.pipePromise = this.loadPipe();
    }
    return this.pipePromise;
  }

  private async loadPipe(): Promise<UriPipe> {
    const module = await import("@mxflow/features/business-process");

    const BusinessProcessUriFactoryPipeModule =
      module.BusinessProcessUriFactoryPipeModule;
    const BusinessProcessGlobalUriFactoryPipe =
      module.BusinessProcessGlobalUriFactoryPipe;

    const envInjector = this.injector.get(EnvironmentInjector);

    const customInjector = Injector.create({
      providers: [{ provide: ProjectUrlPipe, useClass: ProjectUrlPipe }],
      parent: envInjector,
    });

    const bpModuleRef = createNgModule(
      BusinessProcessUriFactoryPipeModule,
      customInjector
    );

    return bpModuleRef.injector.get(BusinessProcessGlobalUriFactoryPipe);
  }
}
