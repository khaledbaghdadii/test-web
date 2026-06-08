import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  ViewChild,
} from "@angular/core";
import { EnvironmentService } from "../service/environment.service";
import { EnvironmentDefinition } from "../environment-definition";
import {
  MxevolveMultiselectDropdownComponent,
  BaseMultiselectDropdown,
  MxevolveMultiselectFrontendStateProvider,
  MxEvolveDropdownState,
} from "@mxflow/ui/mxevolve-dropdown";
import { EnvironmentDefinitionsDataProvider } from "./data-provider/environment-definitions-data-provider";

@Component({
  selector: "mxevolve-environment-multi-select-input",
  imports: [MxevolveMultiselectDropdownComponent],
  providers: [
    ...BaseMultiselectDropdown.createProviders(
      EnvironmentMultiSelectInputComponent
    ),
    EnvironmentService,
  ],
  templateUrl: "./environment-multi-select-input.component.html",
})
export class EnvironmentMultiSelectInputComponent extends BaseMultiselectDropdown<
  EnvironmentDefinition,
  { projectId: string; includeInactive: boolean }
> {
  projectId = input.required<string>();
  includeInactive = input(false);

  selectedEnvironmentsChange = output<EnvironmentDefinition[]>();

  protected stateProvider: MxEvolveDropdownState<
    EnvironmentDefinition,
    { projectId: string; includeInactive: boolean }
  >;

  @ViewChild("dropdown")
  declare dropdownComponent?: MxevolveMultiselectDropdownComponent<
    EnvironmentDefinition,
    { projectId: string; includeInactive: boolean }
  >;

  dropdownConfig = computed(() => ({
    placeholder: "Select Environment Definitions",
    maxSelectedLabels: 3,
  }));

  constructor() {
    super();
    const destroyRef = inject(DestroyRef);
    const environmentService = inject(EnvironmentService);
    const dataProvider = new EnvironmentDefinitionsDataProvider(
      environmentService
    );

    this.stateProvider = new MxevolveMultiselectFrontendStateProvider(
      dataProvider,
      destroyRef
    );
  }

  override onSelectionChange(selectedItems: EnvironmentDefinition[]): void {
    super.onSelectionChange(selectedItems);
    this.selectedEnvironmentsChange.emit(selectedItems);
  }
}
