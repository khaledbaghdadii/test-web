import { inject, Injectable, Pipe, PipeTransform } from "@angular/core";
import { ProjectUrlPipe } from "@mxflow/features/project";

@Injectable({ providedIn: "root" })
@Pipe({
  name: "testUnitUriFactory",
  standalone: true,
})
export class TestUnitUriFactoryPipe implements PipeTransform {
  private readonly projectUrlPipe = inject(ProjectUrlPipe);

  transform(id: string, projectId: string): string {
    const projectUrl = this.projectUrlPipe.transform(projectId);
    return `${projectUrl}/test-unit/${id}`;
  }
}
