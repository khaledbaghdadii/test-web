import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Observable } from "rxjs";
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  startWith,
  switchMap,
} from "rxjs/operators";
import { InputText } from "primeng/inputtext";
import { FinalProduct } from "@mxevolve/domains/artifact/data-access";
import {
  LatestFinalProductFailureReason,
  LatestFinalProductFetcherService,
  LatestFinalProductResult,
} from "@mxevolve/domains/business-process/data-access";
import { CommitsService } from "@mxevolve/domains/scm/data-access";
import { BranchInputComponent } from "@mxevolve/domains/scm/widget";
import {
  ProvidedDefinitionInput,
  isProvidedByDefinition,
} from "@mxevolve/domains/business-process/util";
import { DefinitionInputComponent } from "@mxevolve/domains/business-process/ui";
import {
  ToastMessageService,
  WarningAlertComponent,
} from "@mxevolve/shared/ui/primitive";
import { releaseControl } from "../parameter-controls";

/** Debounce applied before looking a typed archival branch up (legacy 500ms). */
const BRANCH_DEBOUNCE_MS = 500;

/**
 * Why the final product could not be shown, or why the one that was found
 * deserves a caveat. Transcribed from the legacy
 * `MQGFromExistingBranchWarnings`.
 */
export enum ExistingBranchWarning {
  NONE = "NONE",
  INVALID_BRANCH_NAME = "INVALID_BRANCH_NAME",
  NO_FINAL_PRODUCT_FOUND = "NO_FINAL_PRODUCT_FOUND",
  UNEXPECTED_FAILURE = "UNEXPECTED_FAILURE",
  PRESELECTED_DIFFERENT_FROM_LATEST = "PRESELECTED_DIFFERENT_FROM_LATEST",
}

const WARNING_MESSAGES: Record<ExistingBranchWarning, string> = {
  [ExistingBranchWarning.NONE]: "",
  [ExistingBranchWarning.INVALID_BRANCH_NAME]:
    "Could not validate the selected archival branch. Please ensure the branch is valid and exists.",
  [ExistingBranchWarning.NO_FINAL_PRODUCT_FOUND]:
    "Could not find a final product on the selected archival branch.",
  [ExistingBranchWarning.UNEXPECTED_FAILURE]:
    "Something went wrong while fetching the latest final product on the archival branch.",
  [ExistingBranchWarning.PRESELECTED_DIFFERENT_FROM_LATEST]:
    "Please ensure that you have validated all tests on the latest final product on the branch and the head commit ID. Once you validate the quality gate and proceed, the process will tag and promote the latest final product on the branch associating it with the head commit ID as the  RTP commit.",
};

const FAILURE_WARNINGS: Record<
  LatestFinalProductFailureReason,
  ExistingBranchWarning
> = {
  [LatestFinalProductFailureReason.INVALID_BRANCH_NAME]:
    ExistingBranchWarning.INVALID_BRANCH_NAME,
  [LatestFinalProductFailureReason.NO_FINAL_PRODUCT_FOUND]:
    ExistingBranchWarning.NO_FINAL_PRODUCT_FOUND,
  [LatestFinalProductFailureReason.UNEXPECTED_FAILURE]:
    ExistingBranchWarning.UNEXPECTED_FAILURE,
};

/**
 * "Create Branch = No" configuration parameters: the user picks an archival
 * branch that already exists and the newest final product reachable from it is
 * looked up and shown read-only.
 *
 * New-architecture rebuild of the legacy
 * `FinalProductFromExistingBranchComponent`. The branch must **exist** here -
 * the opposite of the create-branch paths - and a branch that exists but
 * carries no final product is reported through an inline warning rather than a
 * branch validation error.
 */
@Component({
  selector: "mxevolve-final-product-from-existing-branch",
  templateUrl: "./final-product-from-existing-branch.component.html",
  imports: [
    ReactiveFormsModule,
    InputText,
    BranchInputComponent,
    DefinitionInputComponent,
    WarningAlertComponent,
  ],
  providers: [LatestFinalProductFetcherService, CommitsService],
})
export class FinalProductFromExistingBranchComponent
  implements OnInit, OnDestroy
{

  readonly projectId = input.required<string>();
  readonly providedInputs = input.required<readonly ProvidedDefinitionInput[]>();
  readonly repositoryId = input.required<string>();
  readonly archivalBranchNameFormControl =
    input.required<FormControl<string | null>>();
  readonly finalProductIdFormControl =
    input.required<FormControl<string | null>>();
  readonly configCommitIdFormControl =
    input.required<FormControl<string | null>>();
  readonly rtpCommitIdFormControl =
    input.required<FormControl<string | null>>();

  private readonly fetcher = inject(LatestFinalProductFetcherService);
  private readonly toast = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(false);
  protected readonly warning = signal(ExistingBranchWarning.NONE);
  protected readonly warningMessage = computed(
    () => WARNING_MESSAGES[this.warning()]
  );
  protected archivalBranchNameInitialValue = "";

  ngOnInit(): void {
    const archivalBranch = this.archivalBranchNameFormControl();
    this.archivalBranchNameInitialValue = archivalBranch.value ?? "";
    archivalBranch.enable({ emitEvent: false });

    // `startWith` matters at t0: with no branch there is nothing to look a
    // product up on, and legacy disabled and cleared the three read-only boxes
    // straight away rather than rendering them empty until the user typed.
    archivalBranch.valueChanges
      .pipe(
        startWith(archivalBranch.value),
        filter((branchName) => !branchName),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.clearFinalProduct());

    archivalBranch.valueChanges
      .pipe(
        filter((branchName): branchName is string => !!branchName),
        debounceTime(BRANCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        switchMap((branchName) => this.startLookup(branchName)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((result) => this.applyResult(result));

    if (archivalBranch.value) {
      this.startLookup(archivalBranch.value)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((result) => this.applyInitialResult(result));
    }
  }

  ngOnDestroy(): void {
    this.clearFinalProduct();
    releaseControl(this.archivalBranchNameFormControl());
  }

  /**
   * Legacy `showArchivalBranchError` on the existing-branch path: here the
   * branch is expected to already exist, so a rejected prefilled value means it
   * is missing - not that it is already taken.
   */
  protected showArchivalBranchError(): void {
    this.toast.showError(
      "The branch name available in the Process Template doesn't exist in the repository. Please check the name and try again with an existing branch."
    );
  }

  private startLookup(
    branchName: string
  ): Observable<LatestFinalProductResult> {
    this.finalProductIdFormControl().enable({ emitEvent: false });
    this.warning.set(ExistingBranchWarning.NONE);
    this.loading.set(true);
    return this.fetcher.getLatestFinalProductOnBranch({
      projectId: this.projectId(),
      repositoryId: this.repositoryId(),
      branchName,
    });
  }

  /**
   * A lookup the user caused by changing the archival branch. They picked a new
   * branch, so whatever product was selected for the old one is replaced.
   */
  private applyResult(result: LatestFinalProductResult): void {
    this.loading.set(false);
    const product = result.finalProduct;
    if (!product) {
      this.clearFinalProduct();
      this.warning.set(
        result.failureReason
          ? FAILURE_WARNINGS[result.failureReason]
          : ExistingBranchWarning.NO_FINAL_PRODUCT_FOUND
      );
      return;
    }

    this.writeFinalProduct(product);
    this.warning.set(ExistingBranchWarning.NONE);
  }

  /**
   * The lookup for the branch the form arrived with. This one must not overwrite
   * a product the definition (or a repush) already chose: legacy wrote only when
   * the control was empty, and when the branch's newest product differed from
   * the selected one it warned and left the selection alone.
   *
   * The comparison is against the live control, not the repush seed: a product
   * the *definition* pre-filled sits in the control too, and comparing against
   * the seed meant the warning could never fire for one.
   */
  private applyInitialResult(result: LatestFinalProductResult): void {
    this.loading.set(false);
    const product = result.finalProduct;
    const preselected = this.finalProductIdFormControl().value;

    if (preselected && product && product.id !== preselected) {
      this.warning.set(ExistingBranchWarning.PRESELECTED_DIFFERENT_FROM_LATEST);
      return;
    }
    if (!product) {
      this.clearFinalProduct();
      this.warning.set(
        result.failureReason
          ? FAILURE_WARNINGS[result.failureReason]
          : ExistingBranchWarning.NO_FINAL_PRODUCT_FOUND
      );
      return;
    }
    if (!preselected) {
      this.writeFinalProduct(product);
    }
    this.warning.set(ExistingBranchWarning.NONE);
  }

  private writeFinalProduct(product: FinalProduct): void {
    this.finalProductIdFormControl().setValue(product.id);
    this.configCommitIdFormControl().setValue(product.configurationCommitId);
    this.rtpCommitIdFormControl().setValue(
      product.rtpProduct?.rtpCommitId ?? product.configurationCommitId
    );
  }

  /**
   * Drops the product and its two commits, and takes the product picker out of
   * play.
   *
   * Only `finalProductId` is disabled — the two commits stay enabled, empty and
   * `required`, which is what keeps the run unsubmittable while the branch has
   * no final product to send. Angular excludes disabled controls from
   * `form.valid`, so disabling all three removed every `required` this section
   * contributes and left the Run button live behind the "no final product"
   * warning. Legacy disabled only the product itself
   * (`disableFinalProductSelection`) and merely cleared the commits.
   */
  private clearFinalProduct(): void {
    this.loading.set(false);
    for (const control of [
      this.finalProductIdFormControl(),
      this.configCommitIdFormControl(),
      this.rtpCommitIdFormControl(),
    ]) {
      // Emits: `rtpCommitId` feeds the executor's scope-visibility snapshot,
      // which is recomputed only from `valueChanges` (legacy emitted too).
      control.reset(null);
    }
    this.finalProductIdFormControl().disable({ emitEvent: false });
  }

  protected notProvided(inputId: string): boolean {
    return !isProvidedByDefinition(this.providedInputs(), inputId);
  }
}
