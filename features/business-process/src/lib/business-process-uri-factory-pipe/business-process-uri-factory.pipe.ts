import { Pipe, PipeTransform } from "@angular/core";
import { BusinessProcessType } from "../business-process-type";
import {
  BINARY_UPGRADE_MFE_PATH,
  CI_PROCESS_MFE_PATH,
  MASTER_VALIDATION_MFE_PATH,
} from "@mxflow/config";

@Pipe({
  name: "businessProcessUriFactory",
  standalone: false,
})
export class BusinessProcessUriFactoryPipe implements PipeTransform {
  transform(id: string, ...args: unknown[]): string {
    const idParts = id.split("__");
    if (this.separatorExists(idParts)) {
      return this.constructBusinessProcessExecutionUri(idParts, id);
    }
    return this.getDefaultUri(id);
  }

  private constructBusinessProcessExecutionUri(idParts: string[], id: string) {
    switch (idParts[0]) {
      case BusinessProcessType.BINARY_UPGRADE:
        return `/${BINARY_UPGRADE_MFE_PATH}/execution/${id}`;
      case BusinessProcessType.CI_PROCESS:
        return `/${CI_PROCESS_MFE_PATH}/execution/${id}`;
      case BusinessProcessType.MASTER_VALIDATION:
        return `/${MASTER_VALIDATION_MFE_PATH}/execution/${id}`;
      default:
        return this.getDefaultUri(id);
    }
  }

  private getDefaultUri(id: string) {
    return `/execution/details/${id}`;
  }

  private separatorExists(idParts: string[]) {
    return idParts.length > 1;
  }
}
