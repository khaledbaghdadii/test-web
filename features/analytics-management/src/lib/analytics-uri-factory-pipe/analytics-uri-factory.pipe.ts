import { inject, Pipe, PipeTransform } from "@angular/core";
import { ANALYTICS_MFE_PATH } from "@mxflow/config";
import { ProjectUrlPipe } from "@mxflow/features/project";

@Pipe({
  name: "analyticsUriFactory",
  standalone: true,
})
export class AnalyticsUriFactoryPipe implements PipeTransform {
  private readonly projectUrlPipe = inject(ProjectUrlPipe);

  transform(resource: string, projectId: string): string {
    const projectUrl = this.projectUrlPipe.transform(projectId);
    return `${projectUrl}/${ANALYTICS_MFE_PATH}/${resource}`;
  }
}
