import {
  Component,
  DestroyRef,
  effect,
  forwardRef,
  inject,
  input,
  OnInit,
  output,
  ViewChild,
} from "@angular/core";
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from "@angular/forms";
import { MultiSelect } from "primeng/multiselect";
import { LazyLoadEvent, PrimeTemplate } from "primeng/api";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MxEvolveDropdownState } from "../models/dropdown-state.interface";
import {
  DEFAULT_DROPDOWN_CONFIG,
  MxEvolveDropdownConfig,
} from "../models/dropdown-config.interface";

/**
 * Generic reusable multiselect dropdown component with lazy loading, search, and ControlValueAccessor support
 * @template T - The type of items in the dropdown
 * @template TParams - The type of parameters needed for data fetching
 */
@Component({
  selector: "mxevolve-multiselect-dropdown",
  templateUrl: "./mxevolve-multiselect-dropdown.component.html",
  imports: [
    MultiSelect,
    FormsModule,
    IconField,
    InputIcon,
    InputText,
    PrimeTemplate,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MxevolveMultiselectDropdownComponent),
      multi: true,
    },
  ],
})
export class MxevolveMultiselectDropdownComponent<T, TParams = unknown>
  implements ControlValueAccessor, OnInit
{
  /**
   * State service instance that manages dropdown state
   */
  stateProvider = input.required<MxEvolveDropdownState<T, TParams>>();

  /**
   * Parameters needed for data fetching (e.g., { projectId: string })
   */
  dataParams = input.required<TParams>();

  /**
   * Configuration options for the dropdown
   */
  config = input<MxEvolveDropdownConfig>({});

  /**
   * Optional id applied to the underlying PrimeNG multiselect control.
   */
  inputId = input<string>();

  /**
   * Emits error messages when data fetching fails
   */
  errorEvent = output<string>();

  /**
   * Emits when selection changes
   */
  selectionChange = output<T[]>();

  @ViewChild("multiSelectRef") multiSelectRef!: MultiSelect;

  mergedConfig: Required<MxEvolveDropdownConfig> = {
    ...DEFAULT_DROPDOWN_CONFIG,
  };

  onTouched: () => void = () => {};

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.setupConfigEffect();
  }

  ngOnInit(): void {
    this.init();
    this.subscribeToFetchFailure();
  }

  private onChange: (selectedItems: T[]) => void = () => {};

  writeValue(selectedItems: T[]): void {
    this.stateProvider().setSelectedItems(selectedItems || []);
  }

  registerOnChange(fn: (value: T[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(): void {
    // This component does not handle disabled events
  }

  onItemsSelected(selectedItems: T[]): void {
    this.onChange(selectedItems);
    this.selectionChange.emit(selectedItems);
  }

  onClear(): void {
    this.onChange([]);
    this.selectionChange.emit([]);
  }

  onScroll(event: LazyLoadEvent): void {
    if ((event?.last ?? 0) >= (this.stateProvider().items()?.length ?? 0)) {
      this.stateProvider().attemptLoadingMoreItems();
    }
  }

  onFilter(filter: string): void {
    this.multiSelectRef.scrollInView(0);
    this.stateProvider().setSearchKey(filter);
    this.stateProvider().setPageIndex(0);
  }

  onFilterCleared(event: { stopPropagation: () => void }): void {
    if (this.stateProvider().searchKey()) {
      event.stopPropagation();
      this.multiSelectRef.scrollInView(0);
      this.stateProvider().setSearchKey("");
      this.stateProvider().setPageIndex(0);
    }
  }

  private init(): void {
    this.mergedConfig = {
      ...DEFAULT_DROPDOWN_CONFIG,
      ...this.config(),
    };

    // Initialize with dataParams
    this.stateProvider().setDataParams(this.dataParams());
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
