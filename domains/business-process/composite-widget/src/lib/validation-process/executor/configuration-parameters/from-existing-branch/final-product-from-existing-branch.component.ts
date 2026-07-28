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
  switchMap,
} from "rxjs/operators";
import { InputText } from "primeng/inputtext";
import {
  LatestFinalProductFailureReason,
  LatestFinalProductFetcherService,
  LatestFinalProductResult,
} from "@mxevolve/domains/business-process/data-access";
import { CommitsService } from "@mxevolve/domains/scm/data-access";
import { BranchInputComponent } from "@mxevolve/domains/scm/widget";
import { DefinitionInputComponent } from "@mxevolve/domains/business-process/ui";
import {
  ToastMessageService,
  WarningAlertComponent,
} from "@mxevolve/shared/ui/primitive";
import { injectInputVisibility } from "../../../shared/input-visibility.store";

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
  /** Executor-owned per-field visibility (VAL-27132 W3, finding V2). */
  protected readonly inputVisibility = injectInputVisibility();

  readonly projectId = input.required<string>();
  readonly repositoryId = input.required<string>();
  readonly archivalBranchNameFormControl =
    input.required<FormControl<string | null>>();
  readonly finalProductIdFormControl =
    input.required<FormControl<string | null>>();
  readonly configCommitIdFormControl =
    input.required<FormControl<string | null>>();
  readonly rtpCommitIdFormControl =
    input.required<FormControl<string | null>>();
  /**
   * Final product the definition/repush already points at. When the branch
   * lookup finds a different (newer) one, the user is warned rather than
   * silently switched.
   */
  readonly preselectedFinalProductId = input<string | null>(null);

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

    archivalBranch.valueChanges
      .pipe(
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
        .subscribe((result) => this.applyResult(result));
    }
  }

  ngOnDestroy(): void {
    this.clearFinalProduct();
    const archivalBranch = this.archivalBranchNameFormControl();
    archivalBranch.reset(null, { emitEvent: false });
    archivalBranch.disable({ emitEvent: false });
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

    this.finalProductIdFormControl().setValue(product.id, {
      emitEvent: false,
    });
    this.configCommitIdFormControl().setValue(product.configurationCommitId, {
      emitEvent: false,
    });
    this.rtpCommitIdFormControl().setValue(
      product.rtpProduct?.rtpCommitId ?? product.configurationCommitId,
      { emitEvent: false }
    );

    const preselected = this.preselectedFinalProductId();
    this.warning.set(
      preselected && preselected !== product.id
        ? ExistingBranchWarning.PRESELECTED_DIFFERENT_FROM_LATEST
        : ExistingBranchWarning.NONE
    );
  }

  private clearFinalProduct(): void {
    this.loading.set(false);
    for (const control of [
      this.finalProductIdFormControl(),
      this.configCommitIdFormControl(),
      this.rtpCommitIdFormControl(),
    ]) {
      control.reset(null, { emitEvent: false });
      control.disable({ emitEvent: false });
    }
  }
}
