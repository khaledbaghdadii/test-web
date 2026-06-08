import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
} from "@angular/core";
import { ArtifactDumpsService, Dump } from "@mxflow/features/artifact-manager";
import { DumpsDataProvider } from "./data-provider/dumps-data-provider";
import {
  BaseMultiselectDropdown,
  MxevolveDropdownBackendStateProvider,
  MxEvolveDropdownState,
  MxevolveMultiselectDropdownComponent,
} from "@mxflow/ui/mxevolve-dropdown";

@Component({
  selector: "mxevolve-dumps-multi-select-dropdown",
  templateUrl: "./dumps-multi-select-dropdown.component.html",
  standalone: true,
  imports: [MxevolveMultiselectDropdownComponent],
  providers: [
    ...BaseMultiselectDropdown.createProviders(
      DumpsMultiSelectDropdownComponent
    ),
  ],
})
export class DumpsMultiSelectDropdownComponent extends BaseMultiselectDropdown<
  Dump,
  unknown
> {
  appendToBody = input<boolean>(true);
  errorEventEmitter = output<string>();
  selectedDumpsChange = output<string[]>();

  protected stateProvider: MxEvolveDropdownState<Dump>;

  readonly dropdownConfig = computed(() => ({
    placeholder: "Select Dumps",
    appendTo: this.appendToBody() ? "body" : null,
    maxSelectedLabels: 2,
    panelStyle: { "min-width": "20rem" },
  }));

  protected readonly dataParams = {};

  constructor() {
    super();
    const destroyRef = inject(DestroyRef);
    const dumpsService = inject(ArtifactDumpsService);
    const dataProvider = new DumpsDataProvider(dumpsService);

    this.stateProvider = new MxevolveDropdownBackendStateProvider(
      dataProvider,
      destroyRef
    );
  }

  override onError(errorMessage: string): void {
    super.onError(errorMessage);
    this.errorEventEmitter.emit(errorMessage);
  }

  override onSelectionChange(selectedDumps: Dump[]): void {
    super.onSelectionChange(selectedDumps);
    this.selectedDumpsChange.emit(selectedDumps.map((dump) => dump.id));
  }
}
