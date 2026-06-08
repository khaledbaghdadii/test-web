import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
} from "@angular/core";
import {
  MxevolveSingleSelectDropdownComponent,
  BaseSingleSelectDropdown,
  MxevolveSingleSelectBackendStateProvider,
  MxEvolveSingleSelectDropdownState,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  BipVersion,
  FactoryProductApiService,
  FactoryProduct,
} from "@mxevolve/domains/artifact/data-access";
import { FactoryProductSelectionStateService } from "../factory-product-selection-state.service";
import {
  BipVersionDataProvider,
  BipVersionDataProviderParams,
} from "./bip-version-data-provider";

@Component({
  selector: "mxevolve-bip-version-dropdown",
  template: `<mxevolve-single-select-dropdown
    [stateProvider]="stateProvider"
    [dataParams]="dataParams()"
    [config]="{
      placeholder: placeholder(),
      lazyLoad: true,
      showClear: true,
      disabled: state.bipVersionDisabled()
    }"
    (selectionChange)="onSelectionChange($event)"
    (errorEvent)="onError($event)"
  />`,
  standalone: true,
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    ...BaseSingleSelectDropdown.createProviders(BipVersionDropdownComponent),
  ],
})
export class BipVersionDropdownComponent extends BaseSingleSelectDropdown<
  BipVersion,
  BipVersionDataProviderParams
> {
  readonly placeholder = input<string>("BIP Version");

  protected override readonly stateProvider: MxEvolveSingleSelectDropdownState<
    BipVersion,
    BipVersionDataProviderParams
  >;

  readonly state = inject(FactoryProductSelectionStateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly dataParams = computed<BipVersionDataProviderParams>(() => ({
    projectId: this.state.projectId() ?? "",
    softwareProductVersion: this.state.mxVersion()?.version ?? "",
    softwareProductBuildId: this.state.mxBuildId()?.buildId ?? "",
    isCustomBuild: this.state.isCustomBuild(),
    onFactoryProductsFetched: (
      factoryProducts: FactoryProduct[],
      isLastPage: boolean
    ): void => {
      this.state.accumulateFactoryProducts(factoryProducts, isLastPage);
    },
  }));

  constructor() {
    super();
    const factoryProductApiService = inject(FactoryProductApiService);
    const dataProvider = new BipVersionDataProvider(factoryProductApiService);

    this.stateProvider = new MxevolveSingleSelectBackendStateProvider(
      dataProvider,
      this.destroyRef
    );

    effect(() => {
      const bipVersion = this.state.bipVersion();
      this.stateProvider.setSelectedItem(bipVersion);
      super.onSelectionChange(bipVersion);
    });
  }

  override onSelectionChange(selectedItem: BipVersion | null): void {
    super.onSelectionChange(selectedItem);
    this.state.selectBipVersion(selectedItem);
  }
}
