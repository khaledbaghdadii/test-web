import { inject, Injectable } from "@angular/core";
import { ProjectUriFactoryService } from "../../../../project/src/lib/project-uri-factory.service";

@Injectable({
  providedIn: "root",
})
export class EnvironmentExecutionUriFactoryService {
  private readonly projectUriFactory = inject(ProjectUriFactoryService);

  constructEnvironmentExecutionUri(
    environmentId: string,
    projectId: string
  ): string {
    const projectUrl =
      this.projectUriFactory.constructProjectBaseUri(projectId);
    return `${projectUrl}/environments/${environmentId}`;
  }
}
