import { inject, Injectable } from "@angular/core";
import { TEST_MFE_PATH } from "../../../../../../../config/src/lib/mfe-urls";
import { ProjectUriFactoryService } from "../../../../../../project/src/lib/project-uri-factory.service";

@Injectable({
  providedIn: "root",
})
export class ScenarioExecutionUriFactoryService {
  private readonly projectUriFactoryService = inject(ProjectUriFactoryService);

  constructScenarioExecutionUrl(id: string, projectId: string): string {
    const projectUrl =
      this.projectUriFactoryService.constructProjectBaseUri(projectId);
    return `${projectUrl}/${TEST_MFE_PATH}/execution/details/${id}`;
  }
}
