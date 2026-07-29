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
  BranchService,
  CommitsService,
} from "@mxevolve/domains/scm/data-access";
import { EMPTY } from "rxjs";
import { catchError, map } from "rxjs/operators";
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
    CommitsService,
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
  /**
   * Repository the branch and commits belong to. Required to label options with
   * their commit message and to resolve the branch's head commit; without it the
   * dropdown falls back to a truncated commit id, as it always did before this
   * lookup moved in here.
   */
  readonly repositoryId = input<string>();
  readonly branch = input<string>();
  readonly initialFinalProductId = input<string>();
  readonly inputId = input<string>();
  readonly placeholder = input("Select a Final Product");
  /** How each option is labelled (commit id, tag, or tag + commit id). */
  readonly labelMode = input<FinalProductLabelMode>(
    FinalProductLabelMode.COMMIT_ID
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
  readonly selectedFinalProductChange = output<FinalProduct | undefined>();
  /** Legacy `errorMessageChange`: surfaced when the list cannot be loaded. */
  readonly errorMessage = output<string>();
  /**
   * Legacy `selectedFinalProductExpiryDateNotification`: emitted when the
   * selected final product carries an expiry date.
   */
  readonly expiryDateNotification = output<string>();

  readonly stateProvider: FinalProductDropdownStateProvider;

  private readonly finalProductService = inject(FinalProductApiService);
  private readonly commitsService = inject(CommitsService);
  private readonly branchService = inject(BranchService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly value = signal<string | null | undefined>(undefined);
  protected readonly disabled = signal(false);
  /**
   * Head commit of the scoped branch. The option whose `configurationCommitId`
   * matches is labelled with a `"HEAD-"` prefix (legacy
   * `final-product-dropdown-state.service.ts:189`). Resolved here rather than
   * supplied by the consumer.
   */
  private readonly headCommitId = signal<string | undefined>(undefined);
  private resolvedInitialId: string | undefined;
  private resolvedCommitIds = "";
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

    // Label the visible options with their commit message. This used to be
    // inverted — the component emitted `loadedCommitIds` and expected the
    // consumer to fetch and hand back `commitMessages` — and not one of the four
    // consumers closed that round trip, so `commitsInfo` stayed empty and no
    // commit message appeared anywhere in the app (VAL-27132 W6).
    effect(() => {
      const commitIds = this.stateProvider.visibleCommitIds();
      const repositoryId = this.repositoryId();
      const key = commitIds.join(",");
      if (!repositoryId || commitIds.length === 0 || key === this.resolvedCommitIds) {
        return;
      }
      this.resolvedCommitIds = key;
      this.loadCommitsInfo(repositoryId, commitIds);
    });

    // Resolve the scoped branch's head commit, which drives the `HEAD-` prefix.
    effect(() => {
      const repositoryId = this.repositoryId();
      const branch = this.branch();
      if (!repositoryId || !branch) {
        this.headCommitId.set(undefined);
        return;
      }
      this.loadHeadCommitId(repositoryId, branch);
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

  /**
   * Fetches the messages for the commits currently on screen and pushes them
   * into the state provider, which rebuilds the option labels in place.
   */
  private loadCommitsInfo(repositoryId: string, commitIds: string[]): void {
    this.commitsService
      .getCommitsInfo({ projectId: this.projectId(), repositoryId, commitIds })
      .pipe(
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((commits) => {
        const info = new Map<string, CommitLabelInfo>(
          commits.map((commit) => [
            commit.id,
            { displayId: commit.displayId, message: commit.message },
          ])
        );
        this.stateProvider.setCommitsInfo(info);
      });
  }

  /** Legacy `final-product-dropdown-state.service.ts:189`. */
  private loadHeadCommitId(repositoryId: string, branch: string): void {
    this.branchService
      .getBranchDetails({
        projectId: this.projectId(),
        repositoryId,
        branchName: branch,
      })
      .pipe(
        map((details) => details.latestCommitId),
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((commitId) => this.headCommitId.set(commitId));
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
