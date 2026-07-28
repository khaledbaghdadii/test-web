import { Observable } from "rxjs";
import { CrmProject } from "../../crm-project";
import { ProjectService } from "../../project.service";
import {
  MxEvolveSingleSelectDataProvider,
  DropdownOption,
} from "@mxflow/ui/mxevolve-dropdown";

export class CrmProjectDataProvider
  implements
    MxEvolveSingleSelectDataProvider<CrmProject, { projectId: string }>
{
  constructor(private readonly projectService: ProjectService) {}

  fetchData(params: { projectId: string }): Observable<CrmProject[]> {
    return this.projectService.getCrmProjects(params.projectId);
  }

  toDropdownOption(crmProject: CrmProject): DropdownOption<CrmProject> {
    return {
      label: crmProject.name,
      value: crmProject,
    };
  }

  getItemId(crmProject: CrmProject): string {
    return crmProject.id;
  }
}
