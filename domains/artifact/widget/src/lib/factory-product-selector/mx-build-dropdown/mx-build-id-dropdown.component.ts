import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  MxevolveSingleSelectDropdownComponent,
  BaseSingleSelectDropdown,
  MxevolveSingleSelectBackendStateProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  SoftwareProductBuild,
  FactoryProductApiService,
} from "@mxevolve/domains/artifact/data-access";
import { FactoryProductSelectionStateService } from "../factory-product-selection-state.service";
import {
  MxBuildIdDataProvider,
  MxBuildIdDataProviderParams,
} from "./mx-build-id-data-provider";

@Component({
  selector: "mxevolve-mx-build-id-dropdown",
  template: `<mxevolve-single-select-dropdown
    [stateProvider]="stateProvider"
    [inputId]="inputId()"
    [dataParams]="dataParams()"
    [config]="{
      placeholder: placeholder(),
      lazyLoad: true,
      showClear: true,
      disabled: state.mxBuildIdDisabled()
    }"
    (selectionChange)="onSelectionChange($event)"
    (errorEvent)="onError($event)"
  />`,
  standalone: true,
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    ...BaseSingleSelectDropdown.createProviders(MxBuildIdDropdownComponent),
  ],
})
export class MxBuildIdDropdownComponent extends BaseSingleSelectDropdown<
  SoftwareProductBuild,
  MxBuildIdDataProviderParams
> {
  /** Legacy wording, restored: the "Select " prefix was dropped in the port. */
  readonly placeholder = input<string>("Select MX Build ID");
  /** Forwarded to the inner select so a `<label for>` can address it. */
  readonly inputId = input<string>();

  protected override readonly stateProvider: MxevolveSingleSelectBackendStateProvider<
    SoftwareProductBuild,
    MxBuildIdDataProviderParams
  >;

  readonly state = inject(FactoryProductSelectionStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly factoryProductApiService = inject(FactoryProductApiService);

  readonly dataParams = computed<MxBuildIdDataProviderParams>(() => ({
    projectId: this.state.projectId() ?? "",
    softwareProductVersion: this.state.mxVersion()?.version ?? "",
  }));

  constructor() {
    super();
    const dataProvider = new MxBuildIdDataProvider(
      this.factoryProductApiService
    );

    this.stateProvider = new MxevolveSingleSelectBackendStateProvider(
      dataProvider,
      this.destroyRef
    );

    effect(() => {
      const mxBuild = this.state.mxBuildId();
      this.stateProvider.setSelectedItem(mxBuild);
      super.onSelectionChange(mxBuild);
    });

    this.stateProvider.items$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        const page = this.stateProvider.itemsPage();
        this.state.applyMxBuildAutoSelection(
          items,
          page?.last === true,
          this.stateProvider.searchKey().trim().length > 0
        );
      });
  }

  override onSelectionChange(selectedItem: SoftwareProductBuild | null): void {
    super.onSelectionChange(selectedItem);
    this.state.selectMxBuildId(selectedItem);
  }
}
