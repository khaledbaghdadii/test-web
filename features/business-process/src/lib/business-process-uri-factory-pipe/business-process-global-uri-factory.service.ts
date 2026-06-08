import { inject, Injectable } from "@angular/core";
import { BusinessProcessType } from "../business-process-type";
import {
  BINARY_UPGRADE_MFE_PATH,
  CI_PROCESS_MFE_PATH,
  MASTER_VALIDATION_MFE_PATH,
} from "../../../../../config/src/lib/mfe-urls";
import { ProjectUriFactoryService } from "../../../../project/src/lib/project-uri-factory.service";

@Injectable({
  providedIn: "root",
})
export class BusinessProcessGlobalUriFactoryService {
  private readonly projectUriFactoryService = inject(ProjectUriFactoryService);

  constructBusinessProcessExecutionUri(id: string, projectId: string) {
    const idParts = id.split("__");
    const projectUrl =
      this.projectUriFactoryService.constructProjectBaseUri(projectId);
    const prefix = `${projectUrl}/business-process`;
    switch (idParts[0]) {
      case BusinessProcessType.BINARY_UPGRADE:
        return `${prefix}/${BINARY_UPGRADE_MFE_PATH}/execution/${id}`;
      case BusinessProcessType.CI_PROCESS:
        return `${prefix}/${CI_PROCESS_MFE_PATH}/execution/${id}`;
      case BusinessProcessType.MASTER_VALIDATION:
        return `${prefix}/${MASTER_VALIDATION_MFE_PATH}/execution/${id}`;
      default:
        throw new Error("Invalid process execution ID");
    }
  }
}
