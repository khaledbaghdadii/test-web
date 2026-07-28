import { inject, Injectable } from "@angular/core";
import { BusinessProcessGlobalUriFactoryService } from "./business-process-global-uri-factory.service";
import { BusinessProcessType } from "../business-process-type";

@Injectable({
  providedIn: "root",
})
export class IntegrateChangesUriFactoryService {
  private readonly businessProcessGlobalUriFactoryService = inject(
    BusinessProcessGlobalUriFactoryService
  );

  constructIntegrateChangesUri(
    id: string,
    familyId: string,
    projectId: string
  ): string | null {
    let step: string;
    switch (familyId) {
      case BusinessProcessType.CI_PROCESS:
        step = "merge";
        break;
      case BusinessProcessType.MASTER_VALIDATION:
        step = "integrate-fixes";
        break;
      case BusinessProcessType.BINARY_UPGRADE:
        step = "merge";
        break;
      default:
        return null;
    }
    const baseUrl =
      this.businessProcessGlobalUriFactoryService.constructBusinessProcessExecutionUri(
        id,
        projectId
      );
    return `${baseUrl}?step=${step}`;
  }
}
