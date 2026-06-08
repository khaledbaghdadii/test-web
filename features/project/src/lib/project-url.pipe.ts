import { inject, Injectable, Pipe, PipeTransform } from "@angular/core";
import { ProjectUriFactoryService } from "./project-uri-factory.service";

@Injectable({ providedIn: "root" })
@Pipe({
  name: "projectUrl",
  standalone: true,
  pure: true,
})
export class ProjectUrlPipe implements PipeTransform {
  private readonly service = inject(ProjectUriFactoryService);

  transform(projectId: string): string {
    return this.service.constructProjectBaseUri(projectId);
  }
}
