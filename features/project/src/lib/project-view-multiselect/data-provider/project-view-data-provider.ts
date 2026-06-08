import { Observable } from "rxjs";
import { Project } from "../../project";
import { ProjectService } from "../../project.service";
import {
  MxEvolveSingleSelectDataProvider,
  DropdownOption,
} from "@mxflow/ui/mxevolve-dropdown";

export class ProjectViewDataProvider
  implements MxEvolveSingleSelectDataProvider<Project, Record<string, never>>
{
  constructor(private readonly projectService: ProjectService) {}

  fetchData(): Observable<Project[]> {
    return this.projectService.getViewProjects();
  }

  toDropdownOption(project: Project): DropdownOption<Project> {
    return {
      label: project.name,
      value: project,
    };
  }

  getItemId(project: Project): string {
    return project.id;
  }
}
