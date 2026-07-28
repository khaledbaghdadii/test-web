import { Component, computed, DestroyRef, inject, input } from "@angular/core";
import {
  InfraGroupService,
  SelectedGroup,
} from "@mxevolve/domains/infra/data-access";
import {
  BaseSingleSelectDropdown,
  MxevolveSingleSelectBackendStateProvider,
  MxevolveSingleSelectDropdownComponent,
  MxEvolveSingleSelectDropdownState,
} from "@mxflow/ui/mxevolve-dropdown";
import { GroupsDataProvider } from "./groups-data-provider";

/**
 * New-architecture migration (copied verbatim, import paths adapted to the
 * migrated new-arch data-access) of the legacy
 * `web/libs/features/infra-management/src/lib/group-dropdown-selection/group-dropdown-selection.component.ts`.
 */
@Component({
  selector: "mxevolve-group-dropdown-selection",
  templateUrl: "./group-dropdown-selection.component.html",
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    ...BaseSingleSelectDropdown.createProviders(
      GroupDropdownSelectionComponent
    ),
    InfraGroupService,
  ],
})
export class GroupDropdownSelectionComponent extends BaseSingleSelectDropdown<
  SelectedGroup,
  { projectId: string }
> {
  projectId = input.required<string>();
  inputId = input<string>();

  protected override stateProvider: MxEvolveSingleSelectDropdownState<
    SelectedGroup,
    { projectId: string }
  >;

  private readonly destroyRef = inject(DestroyRef);
  readonly loading = computed(() => this.stateProvider.loading());

  constructor() {
    super();
    const groupService = inject(InfraGroupService);
    const dataProvider = new GroupsDataProvider(groupService);

    this.stateProvider = new MxevolveSingleSelectBackendStateProvider(
      dataProvider,
      this.destroyRef
    );
  }

  override writeValue(value: SelectedGroup | null): void {
    this.stateProvider.setSelectedItem(value);
  }
}
