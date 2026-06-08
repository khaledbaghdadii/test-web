import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from "@angular/core";
import { SelectedGroup } from "../infra-groups/model/selected-group";
import { GroupsDataProvider } from "./data-provider/groups-data-provider";
import { InfraGroupsService } from "../infra-groups/infra-groups.service";
import {
  BaseMultiselectDropdown,
  MxevolveDropdownBackendStateProvider,
  MxEvolveDropdownState,
  MxevolveMultiselectDropdownComponent,
} from "@mxflow/ui/mxevolve-dropdown";

@Component({
  selector: "mxevolve-groups-multi-selection-filter",
  templateUrl: "./groups-multi-selection-filter.component.html",
  styleUrl: "./groups-multi-selection-filter.component.css",
  standalone: true,
  imports: [MxevolveMultiselectDropdownComponent],
  providers: [
    ...BaseMultiselectDropdown.createProviders(
      GroupsMultiSelectionFilterComponent
    ),
    InfraGroupsService,
  ],
})
export class GroupsMultiSelectionFilterComponent
  extends BaseMultiselectDropdown<SelectedGroup, { projectId: string }>
  implements AfterViewInit
{
  projectId = input.required<string>();
  selectedGroupsLimit = input<number>();
  selectFirstNGroups = input<number>();
  appendToBody = input<boolean>(true);
  errorEventEmitter = output<string>();
  selectedGroupsListChange = output<SelectedGroup[]>();

  protected stateProvider: MxEvolveDropdownState<
    SelectedGroup,
    { projectId: string }
  >;

  @ViewChild("dropdown")
  declare dropdownComponent?: MxevolveMultiselectDropdownComponent<
    SelectedGroup,
    { projectId: string }
  >;

  private readonly hasAutoSelected = signal(false);

  private readonly viewLoaded = signal(false);

  dropdownConfig = computed(() => ({
    placeholder: "Select Groups",
    selectionLimit: this.selectedGroupsLimit(),
    maxSelectedLabels: 4,
    appendTo: this.appendToBody() ? "body" : null,
  }));

  constructor() {
    super();
    const destroyRef = inject(DestroyRef);
    const infraGroupsService = inject(InfraGroupsService);
    const dataProvider = new GroupsDataProvider(infraGroupsService);

    this.stateProvider = new MxevolveDropdownBackendStateProvider(
      dataProvider,
      destroyRef
    );

    this.setupAutoSelection();
  }

  ngAfterViewInit(): void {
    this.viewLoaded.set(true);
  }

  /**
   * Override to emit through both base class output and backward-compatible output
   */
  override onError(errorMessage: string): void {
    super.onError(errorMessage);
  }

  /**
   * Override to emit through both base class callback and backward-compatible output
   */
  override onSelectionChange(selectedGroups: SelectedGroup[]): void {
    super.onSelectionChange(selectedGroups); // Handles ControlValueAccessor
    this.selectedGroupsListChange.emit(selectedGroups); // Backward compatibility
  }

  /**
   * Auto-select first N groups if configured
   */
  private setupAutoSelection(): void {
    effect(() => {
      const autoSelectedGroupsNumber = this.selectFirstNGroups();
      if (!autoSelectedGroupsNumber) {
        return;
      }
      if (this.hasAutoSelected()) {
        return;
      }

      if (!this.viewLoaded()) {
        return;
      }

      const dropdown = this.dropdownComponent;
      if (!dropdown) {
        return;
      }

      // Access items through the state service
      const items = this.stateProvider.items();
      if (!items || items.length === 0) {
        return;
      }
      const firstNGroups = items.slice(0, autoSelectedGroupsNumber);
      dropdown.writeValue(firstNGroups);
      this.onSelectionChange(firstNGroups);
      this.hasAutoSelected.set(true);
    });
  }
}
