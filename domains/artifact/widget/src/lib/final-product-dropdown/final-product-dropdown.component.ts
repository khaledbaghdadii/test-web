import {
  Component,
  computed,
  DestroyRef,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MxevolveSingleSelectDropdownComponent } from "@mxflow/ui/mxevolve-dropdown";
import type {
  FinalProduct,
  FinalProductState,
} from "@mxevolve/domains/artifact/data-access";
import { FinalProductApiService } from "@mxevolve/domains/artifact/data-access";
import {
  CommitLabelInfo,
  FinalProductDataProvider,
  FinalProductParams,
} from "./final-product-data-provider";
import { FinalProductDropdownStateProvider } from "./final-product-dropdown-state-provider";
import { FinalProductLabelMode } from "./final-product-label-mode";

@Component({
  selector: "mxevolve-final-product-dropdown",
  imports: [MxevolveSingleSelectDropdownComponent],
  standalone: true,
  providers: [
    FinalProductApiService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FinalProductDropdownComponent),
      multi: true,
    },
  ],
  templateUrl: "./final-product-dropdown.component.html",
})
export class FinalProductDropdownComponent implements ControlValueAccessor {
  readonly projectId = input.required<string>();
  readonly branch = input<string>();
  readonly initialFinalProductId = input<string>();
  readonly inputId = input<string>();
  readonly placeholder = input("Select a Final Product");
  /** How each option is labelled (commit id, tag, or tag + commit id). */
  readonly labelMode = input<FinalProductLabelMode>(
    FinalProductLabelMode.COMMIT_ID
  );
  /**
   * Commit descriptions keyed by commit id, used to label each option with its
   * commit message. Supplied by the consumer (the SCM lookups cannot live here:
   * `artifact/widget` -> `scm/data-access` would close a dependency cycle
   * through the legacy libraries), driven by {@link loadedCommitIds}.
   */
  readonly commitMessages = input<ReadonlyMap<string, CommitLabelInfo>>(
    new Map()
  );
  /** Restricts the list to final products at the given validation level(s) (e.g. `["CQG"]`). */
  readonly validationLevelFilter = input<string[]>();
  /** Restricts the list to final products in the given state(s) (e.g. `AVAILABLE`). */
  readonly stateFilter = input<FinalProductState[]>();
  /** Backend sort expression (e.g. `"createdOn,desc"`). */
  readonly sort = input<string>();
  /**
   * Also include the final product at the root of the branch (inherited from
   * the parent branch). Defaults to `true` to preserve today's behavior for
   * existing consumers (e.g. the rerun dialog) that don't set this explicitly.
   */
  readonly fetchParent = input<boolean | undefined>(true);
  /**
   * The scoped branch's head commit id. When set, the option whose
   * `configurationCommitId` matches is labeled with a `"HEAD-"` prefix
   * (legacy `final-product-dropdown-state.service.ts` behavior).
   */
  readonly headCommitId = input<string>();

  readonly selectedFinalProductChange = output<FinalProduct | undefined>();
  /** Commit ids currently shown, so the consumer can resolve their messages. */
  readonly loadedCommitIds = output<string[]>();
  /** Legacy `errorMessageChange`: surfaced when the list cannot be loaded. */
  readonly errorMessage = output<string>();
  /**
   * Legacy `selectedFinalProductExpiryDateNotification`: emitted when the
   * selected final product carries an expiry date.
   */
  readonly expiryDateNotification = output<string>();

  readonly stateProvider: FinalProductDropdownStateProvider;

  private readonly finalProductService = inject(FinalProductApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly value = signal<string | null | undefined>(undefined);
  protected readonly disabled = signal(false);
  private resolvedInitialId: string | undefined;
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  readonly dataParams = computed<FinalProductParams>(() => ({
    projectId: this.projectId(),
    branch: this.branch(),
    validationLevelFilter: this.validationLevelFilter(),
    stateFilter: this.stateFilter(),
    sort: this.sort(),
    fetchParent: this.fetchParent(),
    headCommitId: this.headCommitId(),
    labelMode: this.labelMode(),
  }));

  constructor() {
    const dataProvider = new FinalProductDataProvider(this.finalProductService);
    this.stateProvider = new FinalProductDropdownStateProvider(
      dataProvider,
      this.destroyRef
    );

    // Keep the backend list scoped to the current project + branch. The shared
    // dropdown only applies the data params once on init, so drive the provider
    // here to react to branch changes coming from the parent.
    effect(() => {
      this.stateProvider.setDataParams(this.dataParams());
    });

    // Fetch the pre-selected final product by id so it is always selectable,
    // even before the corresponding page of the list is loaded.
    effect(() => {
      const writtenValue = this.value();
      const initialId =
        writtenValue === undefined
          ? this.initialFinalProductId()
          : writtenValue ?? undefined;
      if (initialId && initialId !== this.resolvedInitialId) {
        this.resolvedInitialId = initialId;
        this.loadInitialSelection(initialId);
      } else if (!initialId) {
        this.resolvedInitialId = undefined;
        this.stateProvider.setSelectedItem(null);
      }
    });

    // Push the consumer-supplied commit descriptions into the state provider so
    // the option labels are rebuilt in place once they arrive.
    effect(() => {
      this.stateProvider.setCommitsInfo(this.commitMessages());
    });

    // Tell the consumer which commits are on screen so it can resolve them.
    effect(() => {
      const commitIds = this.stateProvider.visibleCommitIds();
      if (commitIds.length > 0) {
        this.loadedCommitIds.emit(commitIds);
      }
    });
  }

  writeValue(value: string | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  onSelectionChange(selectedProduct: FinalProduct | null): void {
    const selectedId = selectedProduct?.id ?? null;
    // The inner dropdown already resolved the full product (this is a live
    // user selection, not a prefill-by-id), so mark it as resolved to skip the
    // redundant `loadInitialSelection` re-fetch the value-changed effect below
    // would otherwise trigger — that extra async round-trip could momentarily
    // overwrite the already-correct selection and require a second click to
    // "fix" the displayed label.
    this.resolvedInitialId = selectedId ?? undefined;
    this.value.set(selectedId);
    this.onChange(selectedId);
    this.onTouched();
    this.notifyExpiryDate(selectedProduct);
    this.selectedFinalProductChange.emit(selectedProduct ?? undefined);
  }

  onError(message: string): void {
    this.errorMessage.emit(message);
  }

  private notifyExpiryDate(product: FinalProduct | null): void {
    if (product?.expiryDate) {
      this.expiryDateNotification.emit(
        `The selected final product will expire on ${product.expiryDate}`
      );
    }
  }

  private loadInitialSelection(initialId: string): void {
    this.finalProductService
      .getFinalProductById(this.projectId(), initialId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (product) => {
          this.stateProvider.setSelectedItem(product);
          this.stateProvider.setPinnedItem(product);
          this.notifyExpiryDate(product);
          this.selectedFinalProductChange.emit(product);
        },
        error: () => {
          // Leave the dropdown unselected if the product cannot be fetched.
        },
      });
  }
}
