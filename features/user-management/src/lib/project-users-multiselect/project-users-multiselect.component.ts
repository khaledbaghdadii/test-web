import { Component, DestroyRef, inject, input } from "@angular/core";
import { User } from "@mxflow/features/user";
import { ProjectUsersService } from "./service/project-users.service";
import { ProjectUsersDataProvider } from "./data-provider/project-users-data-provider";
import {
  MxevolveMultiselectDropdownComponent,
  BaseMultiselectDropdown,
  MxevolveDropdownBackendStateProvider,
  MxEvolveDropdownState,
} from "@mxflow/ui/mxevolve-dropdown";

@Component({
  selector: "mxevolve-project-users-multiselect",
  templateUrl: "./project-users-multiselect.component.html",
  standalone: true,
  imports: [MxevolveMultiselectDropdownComponent],
  providers: [
    ...BaseMultiselectDropdown.createProviders(
      ProjectUsersMultiselectComponent
    ),
    ProjectUsersService,
  ],
})
export class ProjectUsersMultiselectComponent extends BaseMultiselectDropdown<
  User,
  { projectId: string }
> {
  projectId = input.required<string>();

  protected override stateProvider: MxEvolveDropdownState<
    User,
    { projectId: string }
  >;

  constructor() {
    super();
    const destroyRef = inject(DestroyRef);
    const projectUsersService = inject(ProjectUsersService);
    const dataProvider = new ProjectUsersDataProvider(projectUsersService);

    this.stateProvider = new MxevolveDropdownBackendStateProvider(
      dataProvider,
      destroyRef
    );
  }
}
