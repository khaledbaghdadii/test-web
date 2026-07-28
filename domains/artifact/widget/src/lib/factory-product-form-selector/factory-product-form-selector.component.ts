import {
  Component,
  DestroyRef,
  effect,
  forwardRef,
  inject,
  input,
  output,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import {
  MxevolveSingleSelectDropdownComponent,
  MxEvolveSingleSelectDropdownState,
  MxevolveSingleSelectFrontendStateProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  FactoryProduct,
  FactoryProductApiService,
} from "@mxevolve/domains/artifact/data-access";
import {
  FactoryProductDataProvider,
  FactoryProductSelectorParams,
  FactoryProductValue,
  mapFactoryProductToValue,
} from "./factory-product-data-provider";

/**
 * New-architecture factory-product selector built on the shared
 * `mxevolve-single-select-dropdown`, rebuilding the legacy
 * `factory-product-input` picker. Lists the project's factory products and, on
 * selection, maps the chosen product to the submitted `FactoryProductValue`
 * (id + MX/BIP version + build ids). Implements `ControlValueAccessor` binding
 * to the Upgrade executor's factory-product controls.
 */
@Component({
  selector: "mxevolve-factory-product-selector",
  template: `
    <mxevolve-single-select-dropdown
      [stateProvider]="stateProvider"
      [dataParams]="{ projectId: projectId() }"
      [inputId]="inputId()"
      [config]="{
        placeholder: 'Select a factory product',
        filter: true,
        disabled: disabled()
      }"
      (selectionChange)="onSelectionChange($event)"
      (errorEvent)="onError($event)"
    />
  `,
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FactoryProductSelectorComponent),
      multi: true,
    },
  ],
})
export class FactoryProductSelectorComponent implements ControlValueAccessor {
  readonly projectId = input.required<string>();
  readonly disabled = input(false);
  readonly inputId = input<string>();

  readonly failureEvent = output<string>();

  readonly stateProvider: MxEvolveSingleSelectDropdownState<
    FactoryProduct,
    FactoryProductSelectorParams
  >;

  private readonly factoryProductService = inject(FactoryProductApiService);
  private prefilledId: string | null = null;
  private onChange: (value: FactoryProductValue | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const destroyRef = inject(DestroyRef);
    const dataProvider = new FactoryProductDataProvider(
      this.factoryProductService
    );
    this.stateProvider = new MxevolveSingleSelectFrontendStateProvider(
      dataProvider,
      destroyRef
    );

    effect(() => {
      const products = this.stateProvider.items();
      if (products?.length && this.prefilledId) {
        this.resolvePrefilledId(products);
      }
    });
  }

  writeValue(value: FactoryProductValue | null): void {
    this.prefilledId = value?.id ?? null;

    if (!value?.id) {
      this.stateProvider.setSelectedItem(null);
      return;
    }

    const products = this.stateProvider.items();
    if (products?.length) {
      this.resolvePrefilledId(products);
    }
  }

  registerOnChange(fn: (value: FactoryProductValue | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onSelectionChange(product: FactoryProduct | null): void {
    this.onChange(product ? mapFactoryProductToValue(product) : null);
    this.onTouched();
  }

  onError(errorMessage: string): void {
    this.failureEvent.emit(errorMessage);
  }

  private resolvePrefilledId(products: FactoryProduct[]): void {
    const id = this.prefilledId;
    this.prefilledId = null;

    if (!id) {
      this.stateProvider.setSelectedItem(null);
      return;
    }

    const match = products.find((product) => product.id === id);
    this.stateProvider.setSelectedItem(match ?? null);
    if (!match) {
      // The pre-filled factory product no longer exists. Report the miss to the
      // form instead of leaving the control holding a dead object that still
      // satisfies `Validators.required` (VAL-27132 R3).
      this.onChange(null);
    }
  }
}
