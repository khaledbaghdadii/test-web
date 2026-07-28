import {
  Component,
  computed,
  DestroyRef,
  effect,
  forwardRef,
  inject,
  input,
  NgZone,
  OnInit,
  output,
  ViewChild,
} from "@angular/core";
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from "@angular/forms";
import { Select } from "primeng/select";
import { LazyLoadEvent, PrimeTemplate } from "primeng/api";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { TooltipModule } from "primeng/tooltip";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MxEvolveSingleSelectDropdownState } from "../models/single-select-dropdown-state.interface";
import {
  DEFAULT_SINGLE_SELECT_DROPDOWN_CONFIG,
  MxEvolveSingleSelectDropdownConfig,
  MxEvolveSingleSelectDropdownResolvedConfig,
} from "../models/single-select-dropdown-config.interface";

/**
 * Generic reusable single-select dropdown component with search and ControlValueAccessor support
 * @template T - The type of items in the dropdown
 * @template TParams - The type of parameters needed for data fetching
 */
@Component({
  selector: "mxevolve-single-select-dropdown",
  templateUrl: "./mxevolve-single-select-dropdown.component.html",
  imports: [
    Select,
    FormsModule,
    IconField,
    InputIcon,
    InputText,
    PrimeTemplate,
    TooltipModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MxevolveSingleSelectDropdownComponent),
      multi: true,
    },
  ],
})
export class MxevolveSingleSelectDropdownComponent<T, TParams = unknown>
  implements ControlValueAccessor, OnInit
{
  /**
   * State service instance that manages dropdown state
   */
  stateProvider =
    input.required<MxEvolveSingleSelectDropdownState<T, TParams>>();

  /**
   * Parameters needed for data fetching (e.g., { projectId: string })
   */
  dataParams = input.required<TParams>();

  /**
   * Configuration options for the dropdown
   */
  config = input<MxEvolveSingleSelectDropdownConfig>({});

  /**
   * Optional id applied to the underlying PrimeNG select control.
   */
  inputId = input<string>();

  /**
   * Merged configuration signal that reacts to config changes
   */
  mergedConfig = computed<MxEvolveSingleSelectDropdownResolvedConfig>(() => ({
    ...DEFAULT_SINGLE_SELECT_DROPDOWN_CONFIG,
    ...this.config(),
  }));

  /**
   * Emits error messages when data fetching fails
   */
  errorEvent = output<string>();

  /**
   * Emits when selection changes
   */
  selectionChange = output<T | null>();

  private static readonly MAX_SCROLL_HEIGHT = 200;

  @ViewChild("selectRef") selectRef!: Select;

  /**
   * Dynamically calculates the scroll height based on the number of items.
   * For lazy-loaded dropdowns, uses a fixed max height to ensure the PrimeNG
   * virtual scroller initializes with correct dimensions (matching PrimeNG's
   * own lazy virtual scroll example).
   * For non-lazy dropdowns, shows a compact panel when there are few items,
   * up to a max of 200px.
   */
  scrollHeight = computed(() => {
    if (this.mergedConfig().lazyLoad) {
      return MxevolveSingleSelectDropdownComponent.MAX_SCROLL_HEIGHT + "px";
    }
    const itemCount = this.stateProvider().dropdownOptions()?.length ?? 0;
    const itemSize = this.mergedConfig().virtualScrollItemSize;
    const contentHeight = itemCount * itemSize;
    return (
      Math.min(
        contentHeight,
        MxevolveSingleSelectDropdownComponent.MAX_SCROLL_HEIGHT
      ) + "px"
    );
  });

  onTouched: () => void = () => {};

  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  constructor() {
    this.setupConfigEffect();
  }

  ngOnInit(): void {
    this.stateProvider().setDataParams(this.dataParams());
    this.subscribeToFetchFailure();
  }

  private onChange: (selectedItem: T | null) => void = () => {};

  writeValue(selectedItem: T | null): void {
    this.stateProvider().setSelectedItem(selectedItem);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(): void {
    // This component does not handle disabled events
  }

  onItemSelected(selectedItem: T | null): void {
    this.onChange(selectedItem);
    this.selectionChange.emit(selectedItem);
  }

  onClear(): void {
    this.stateProvider().setSearchKey("");
    this.stateProvider().setPageIndex(0);
    this.onChange(null);
    this.selectionChange.emit(null);
  }

  onFilter(filter: string): void {
    this.selectRef?.scrollInView(0);
    this.stateProvider().setSearchKey(filter);
    this.stateProvider().setPageIndex(0);
  }

  onScroll(event: LazyLoadEvent): void {
    if ((event?.last ?? 0) >= (this.stateProvider().items()?.length ?? 0)) {
      this.stateProvider().attemptLoadingMoreItems();
    }
  }

  onFilterCleared(event: { stopPropagation: () => void }): void {
    if (this.stateProvider().searchKey()) {
      event.stopPropagation();
      this.selectRef?.scrollInView(0);
      this.stateProvider().setSearchKey("");
      this.stateProvider().setPageIndex(0);
    }
  }

  /**
   * Forces the PrimeNG virtual scroller to reinitialize after the overlay
   * panel is shown. Works around a PrimeNG v21 bug where the scroller's
   * viewInit() fails because the overlay element is not yet visible
   * (display:none during motion animation), causing items to not render
   * until a user interaction triggers change detection.
   */
  onPanelShow(): void {
    if (!this.mergedConfig().lazyLoad) {
      return;
    }
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          const scroller = this.selectRef?.scroller;
          if (scroller) {
            if (!scroller.initialized) {
              scroller.viewInit();
            } else {
              scroller.init();
            }
          }
        });
      });
    });
  }

  private setupConfigEffect(): void {
    // Effect to handle dataParams changes
    effect(() => {
      const params = this.dataParams();
      if (params) {
        this.stateProvider().setDataParams(params);
      }
    });
  }

  private subscribeToFetchFailure(): void {
    this.stateProvider()
      .errorMessageSubject.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((errorMessage: string) => {
        this.errorEvent.emit(errorMessage);
      });
  }
}
