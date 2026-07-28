import { Component, DestroyRef, inject, input } from "@angular/core";
import { CrmProject } from "../crm-project";
import { ProjectService } from "../project.service";
import { CrmProjectDataProvider } from "./data-provider/crm-project-data-provider";
import {
  MxevolveSingleSelectDropdownComponent,
  BaseSingleSelectDropdown,
  MxevolveSingleSelectFrontendStateProvider,
  MxEvolveSingleSelectDropdownState,
} from "@mxflow/ui/mxevolve-dropdown";

@Component({
  selector: "mxevolve-crm-project-single-select",
  standalone: true,
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    ...BaseSingleSelectDropdown.createProviders(
      CrmProjectSingleSelectComponent
    ),
  ],
  templateUrl: "./crm-project-single-select.component.html",
})
export class CrmProjectSingleSelectComponent extends BaseSingleSelectDropdown<
  CrmProject,
  { projectId: string }
> {
  projectId = input.required<string>();

  protected override stateProvider: MxEvolveSingleSelectDropdownState<
    CrmProject,
    { projectId: string }
  >;

  constructor() {
    super();
    const destroyRef = inject(DestroyRef);
    const projectService = inject(ProjectService);
    const dataProvider = new CrmProjectDataProvider(projectService);

    this.stateProvider = new MxevolveSingleSelectFrontendStateProvider(
      dataProvider,
      destroyRef
    );
  }
}
