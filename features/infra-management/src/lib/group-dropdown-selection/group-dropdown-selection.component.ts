import { Component, computed, DestroyRef, inject, input } from "@angular/core";
import { SelectedGroup } from "../infra-groups/model/selected-group";
import { InfraGroupsService } from "../infra-groups/infra-groups.service";
import { GroupsDataProvider } from "./data-provider/groups-data-provider";
import {
  BaseSingleSelectDropdown,
  MxevolveSingleSelectBackendStateProvider,
  MxevolveSingleSelectDropdownComponent,
  MxEvolveSingleSelectDropdownState,
} from "@mxflow/ui/mxevolve-dropdown";

@Component({
  selector: "mxevolve-group-dropdown-selection",
  templateUrl: "./group-dropdown-selection.component.html",
  standalone: true,
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    ...BaseSingleSelectDropdown.createProviders(
      GroupDropdownSelectionComponent
    ),
    InfraGroupsService,
  ],
})
export class GroupDropdownSelectionComponent extends BaseSingleSelectDropdown<
  SelectedGroup,
  { projectId: string }
> {
  projectId = input.required<string>();

  protected override stateProvider: MxEvolveSingleSelectDropdownState<
    SelectedGroup,
    { projectId: string }
  >;

  private readonly destroyRef = inject(DestroyRef);
  readonly loading = computed(() => this.stateProvider.loading());

  constructor() {
    super();
    const groupService = inject(InfraGroupsService);
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
