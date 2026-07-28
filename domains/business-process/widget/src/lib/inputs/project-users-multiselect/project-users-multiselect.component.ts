import { Component, DestroyRef, inject, input } from "@angular/core";
import {
  ProjectUsersService,
  User,
} from "@mxevolve/domains/business-process/data-access";
import {
  MxevolveMultiselectDropdownComponent,
  BaseMultiselectDropdown,
  MxevolveDropdownBackendStateProvider,
  MxEvolveDropdownState,
} from "@mxflow/ui/mxevolve-dropdown";
import { ProjectUsersDataProvider } from "./project-users-data-provider";

/**
 * New-architecture migration (copied verbatim, adapted to the migrated new-arch
 * data-access) of the legacy
 * `web/libs/features/user-management/src/lib/project-users-multiselect/project-users-multiselect.component.ts`.
 */
@Component({
  selector: "mxevolve-project-users-multiselect",
  templateUrl: "./project-users-multiselect.component.html",
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
  inputId = input<string>();

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
