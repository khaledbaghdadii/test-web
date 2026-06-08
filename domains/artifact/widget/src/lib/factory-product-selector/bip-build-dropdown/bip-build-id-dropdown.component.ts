import { Component, DestroyRef, effect, inject, input } from "@angular/core";
import {
  MxevolveSingleSelectDropdownComponent,
  BaseSingleSelectDropdown,
  MxevolveSingleSelectFrontendStateProvider,
  MxEvolveSingleSelectDropdownState,
  DropdownOption,
} from "@mxflow/ui/mxevolve-dropdown";
import { Observable, of } from "rxjs";
import {
  BipBuildOption,
  FactoryProductSelectionStateService,
} from "../factory-product-selection-state.service";

class BipBuildIdFrontendDataProvider {
  private readonly state: FactoryProductSelectionStateService;

  constructor(state: FactoryProductSelectionStateService) {
    this.state = state;
  }

  fetchData(): Observable<BipBuildOption[]> {
    return of(this.state.bipBuildOptions().map((option) => option.value));
  }

  toDropdownOption(item: BipBuildOption): DropdownOption<BipBuildOption> {
    return {
      label: item.buildId,
      value: item,
    };
  }

  getItemId(item: BipBuildOption): string {
    return item.buildId;
  }
}

@Component({
  selector: "mxevolve-bip-build-id-dropdown",
  template: `<mxevolve-single-select-dropdown
    [stateProvider]="stateProvider"
    [dataParams]="triggerRefresh()"
    [config]="{
      placeholder: placeholder(),
      showClear: true,
      disabled: state.bipBuildIdDisabled()
    }"
    (selectionChange)="onSelectionChange($event)"
    (errorEvent)="onError($event)"
  />`,
  standalone: true,
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    ...BaseSingleSelectDropdown.createProviders(BipBuildIdDropdownComponent),
  ],
})
export class BipBuildIdDropdownComponent extends BaseSingleSelectDropdown<
  BipBuildOption,
  unknown
> {
  readonly placeholder = input<string>("BIP Build ID");

  protected override readonly stateProvider: MxEvolveSingleSelectDropdownState<
    BipBuildOption,
    unknown
  >;

  readonly state = inject(FactoryProductSelectionStateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly triggerRefresh = this.state.bipVersion;

  constructor() {
    super();
    const dataProvider = new BipBuildIdFrontendDataProvider(this.state);

    this.stateProvider = new MxevolveSingleSelectFrontendStateProvider(
      dataProvider,
      this.destroyRef
    );

    effect(() => {
      const bipBuild = this.state.bipBuildId();
      this.stateProvider.setSelectedItem(bipBuild);
      super.onSelectionChange(bipBuild);
    });
  }

  override onSelectionChange(selectedItem: BipBuildOption | null): void {
    super.onSelectionChange(selectedItem);
    this.state.selectBipBuildId(selectedItem);
  }
}
