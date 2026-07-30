import { Component, DestroyRef, effect, inject, input } from "@angular/core";
import {
  MxevolveSingleSelectDropdownComponent,
  BaseSingleSelectDropdown,
  MxevolveSingleSelectBackendStateProvider,
  MxEvolveSingleSelectDropdownState,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  SoftwareProductVersion,
  FactoryProductApiService,
} from "@mxevolve/domains/artifact/data-access";
import { FactoryProductSelectionStateService } from "../factory-product-selection-state.service";
import { MxVersionDataProvider } from "./mx-version-data-provider";

@Component({
  selector: "mxevolve-mx-version-dropdown",
  template: `<mxevolve-single-select-dropdown
    [stateProvider]="stateProvider"
    [inputId]="inputId()"
    [dataParams]="{ projectId: state.projectId() ?? '' }"
    [config]="{
      placeholder: placeholder(),
      lazyLoad: true,
      showClear: true
    }"
    (selectionChange)="onSelectionChange($event)"
    (errorEvent)="onError($event)"
  />`,
  standalone: true,
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    ...BaseSingleSelectDropdown.createProviders(MxVersionDropdownComponent),
  ],
})
export class MxVersionDropdownComponent extends BaseSingleSelectDropdown<
  SoftwareProductVersion,
  { projectId: string }
> {
  /** Legacy wording, restored: the "Select " prefix was dropped in the port. */
  readonly placeholder = input<string>("Select MX Version");
  /** Forwarded to the inner select so a `<label for>` can address it. */
  readonly inputId = input<string>();

  protected override readonly stateProvider: MxEvolveSingleSelectDropdownState<
    SoftwareProductVersion,
    { projectId: string }
  >;

  readonly state = inject(FactoryProductSelectionStateService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    super();
    const factoryProductApiService = inject(FactoryProductApiService);
    const dataProvider = new MxVersionDataProvider(factoryProductApiService);

    this.stateProvider = new MxevolveSingleSelectBackendStateProvider(
      dataProvider,
      this.destroyRef
    );

    effect(() => {
      const mxVersion = this.state.mxVersion();
      this.stateProvider.setSelectedItem(mxVersion);
      super.onSelectionChange(mxVersion);
    });
  }

  override onSelectionChange(
    selectedItem: SoftwareProductVersion | null
  ): void {
    super.onSelectionChange(selectedItem);
    this.state.selectMxVersion(selectedItem);
  }
}
