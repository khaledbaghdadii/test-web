import { Component, inject, Input, OnDestroy, OnInit } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import {
  FinalProductResponse,
  LatestFinalProductFailureReason,
  LatestFinalProductServiceFetcher,
} from "./final-product-input/latest-final-product-service-fetcher.service";
import {
  BehaviorSubject,
  debounceTime,
  filter,
  from,
  Observable,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from "rxjs";
import { InputTextModule } from "primeng/inputtext";
import { PaginatorModule } from "primeng/paginator";
import { AsyncPipe, NgTemplateOutlet } from "@angular/common";
import { ToastMessageService, WarningAlertModule } from "@mxflow/ui/alert";
import { InputIconModule } from "primeng/inputicon";
import { IconFieldModule } from "primeng/iconfield";
import { DefinitionInputComponent } from "../../../definition-input/definition-input.component";
import { DisplayMode } from "../../../definition-input/display-mode";
import { InputAccessMode } from "../../../definition-input/input-access-mode";
import { BranchInputComponent } from "@mxflow/features/scm";

export enum MQGFromExistingBranchWarnings {
  INVALID_BRANCH_NAME,
  NO_FINAL_PRODUCT_FOUND,
  PRESELECTED_FINAL_PRODUCT_DIFFERENT_FROM_LATEST,
  UNEXPECTED_FAILURE,
  NO_WARNING,
}

@Component({
  selector: "mxevolve-final-product-from-existing-branch",
  templateUrl: "final-product-from-existing-branch.component.html",
  imports: [
    DefinitionInputComponent,
    InputTextModule,
    PaginatorModule,
    ReactiveFormsModule,
    AsyncPipe,
    WarningAlertModule,
    InputIconModule,
    IconFieldModule,
    NgTemplateOutlet,
    BranchInputComponent,
  ],
})
export class FinalProductFromExistingBranchComponent
  implements OnInit, OnDestroy
{
  @Input({ required: true }) repositoryIdFormControl: FormControl;
  @Input({ required: true }) archivalBranchNameFormControl: FormControl;
  @Input({ required: true }) finalProductIdFromControl: FormControl;
  @Input({ required: true }) rtpCommitIdFromControl: FormControl;
  @Input({ required: true }) configCommitIdFromControl: FormControl;
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) repositoryId: string;
  @Input({ required: true }) displayMode: DisplayMode;
  @Input({ required: true }) inputAccessMode: InputAccessMode;
  @Input() prefilledInputsToShow: string[] = [];

  private readonly toastService = inject(ToastMessageService);
  private readonly latestFinalProductService: LatestFinalProductServiceFetcher =
    inject(LatestFinalProductServiceFetcher);

  private archivalBranchNameSet$: Observable<string>;
  private archivalBranchNameNotSet$: Observable<string>;

  private readonly latestFinalProductFetched$ =
    new Subject<FinalProductResponse>();
  private readonly latestFinalProductFetchingFailed$ =
    new Subject<FinalProductResponse>();
  private readonly fetchLatestFinalProduct$ = new Subject<string>();
  forceShowArchivalBranch = false;
  forceShowFinalProductId = false;
  forceShowRtpCommitId = false;

  archivalBranchNameInitialValue: string;

  private readonly destroy$ = new Subject();

  warning$ = new BehaviorSubject(MQGFromExistingBranchWarnings.NO_WARNING);

  ngOnInit(): void {
    this.archivalBranchNameInitialValue =
      this.archivalBranchNameFormControl.value;

    this.initialize();

    this.fetchLatestFinalProduct$
      .pipe(
        switchMap((branchName) => this.fetchLatestFinalProduct(branchName)),
        tap((response) => this.notifyListeners(response)),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.latestFinalProductFetched$
      .pipe(
        tap((response) => this.setFinalProductSelection(response)),
        tap((response) => this.emitWarning(response)),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.latestFinalProductFetchingFailed$
      .pipe(
        tap(() => this.disableFinalProductSelection()),
        tap(() => this.clearFinalProductSelection()),
        tap(() => this.clearRtpCommitIdSelection()),
        tap(() => this.clearConfigCommitIdSelection()),
        tap((response) => this.emitWarning(response)),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.archivalBranchNameSet$
      .pipe(
        tap(() => this.enableFinalProductSelection()),
        tap((value) => this.fetchLatestFinalProduct$.next(value)),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.archivalBranchNameNotSet$
      .pipe(
        tap(() => this.disableFinalProductSelection()),
        tap(() => this.clearFinalProductSelection()),
        tap(() => this.clearRtpCommitIdSelection()),
        tap(() => this.clearConfigCommitIdSelection()),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.forceShowArchivalBranch =
      this.prefilledInputsToShow.includes("archivalBranchName");
    this.forceShowFinalProductId =
      this.prefilledInputsToShow.includes("finalProductId");
    this.forceShowRtpCommitId =
      this.prefilledInputsToShow.includes("rtpCommitId");
  }

  ngOnDestroy(): void {
    this.disableFinalProductSelection();
    this.disableArchivalBranchNameSelection();
    this.clearArchivalBranchNameSelection();
    this.clearFinalProductSelection();
    this.clearRtpCommitIdSelection();
    this.clearConfigCommitIdSelection();
    this.destroy$.next({});
    this.destroy$.complete();
  }

  showArchivalBranchError(): void {
    this.toastService.showError(
      "The branch name available in the BP definition doesn't exist in the repository. Please check the name and try again with an existing branch."
    );
  }

  private initialize() {
    this.enableArchivalBranchNameSelection();
    this.initializeFinalProductId();

    this.archivalBranchNameSet$ =
      this.archivalBranchNameFormControl.valueChanges.pipe(
        filter((value) => !!value),
        debounceTime(500)
      );

    this.archivalBranchNameNotSet$ =
      this.archivalBranchNameFormControl.valueChanges.pipe(
        startWith(this.archivalBranchNameFormControl.value),
        filter((value) => !value)
      );
  }

  private initializeFinalProductId() {
    if (this.archivalBranchNameFormControl.value) {
      this.enableFinalProductSelection();
      this.fetchLatestFinalProduct(
        this.archivalBranchNameFormControl.value
      ).subscribe((response) => {
        if (
          this.preselectedFinalProductIsDifferentFromCurrentLatestFinalProduct(
            response
          )
        ) {
          this.warning$.next(
            MQGFromExistingBranchWarnings.PRESELECTED_FINAL_PRODUCT_DIFFERENT_FROM_LATEST
          );
        } else if (this.failedToFetchLatestFinalProductId(response)) {
          this.disableFinalProductSelection();
          this.clearFinalProductSelection();
          this.clearRtpCommitIdSelection();
          this.clearConfigCommitIdSelection();
          this.warning$.next(this.mapFailureReason(response.failureReason));
        } else if (
          this.finalProductNotPreselectedAndLatestFinalProductIsFetched(
            response
          )
        ) {
          this.setFinalProductSelection(response);
        }
      });
    }
  }

  private finalProductNotPreselectedAndLatestFinalProductIsFetched(
    response: FinalProductResponse
  ) {
    return (
      !!response.optionalFinalProduct && !this.finalProductIdFromControl.value
    );
  }

  private failedToFetchLatestFinalProductId(response: FinalProductResponse) {
    return response.failureReason !== undefined;
  }

  private preselectedFinalProductIsDifferentFromCurrentLatestFinalProduct(
    response: FinalProductResponse
  ) {
    return (
      this.finalProductIdFromControl.value &&
      !!response.optionalFinalProduct &&
      response.optionalFinalProduct?.id !== this.finalProductIdFromControl.value
    );
  }

  private emitWarning(response: FinalProductResponse) {
    this.warning$.next(this.mapFailureReason(response.failureReason));
  }

  private mapFailureReason(
    failureReason: LatestFinalProductFailureReason | undefined
  ) {
    switch (failureReason) {
      case LatestFinalProductFailureReason.INVALID_BRANCH_NAME:
        return MQGFromExistingBranchWarnings.INVALID_BRANCH_NAME;
      case LatestFinalProductFailureReason.NO_FINAL_PRODUCT_FOUND:
        return MQGFromExistingBranchWarnings.NO_FINAL_PRODUCT_FOUND;
      case LatestFinalProductFailureReason.UNEXPECTED_FAILURE:
        return MQGFromExistingBranchWarnings.UNEXPECTED_FAILURE;
      default:
        return MQGFromExistingBranchWarnings.NO_WARNING;
    }
  }

  private enableArchivalBranchNameSelection() {
    this.archivalBranchNameFormControl.enable();
  }

  private enableFinalProductSelection() {
    this.finalProductIdFromControl.enable();
  }

  private setFinalProductSelection(finalProductResponse: FinalProductResponse) {
    this.finalProductIdFromControl.setValue(
      finalProductResponse.optionalFinalProduct?.id
    );
    this.configCommitIdFromControl.setValue(
      finalProductResponse.optionalFinalProduct?.configurationCommitId
    );
    this.rtpCommitIdFromControl.setValue(
      finalProductResponse.optionalFinalProduct?.rtpProduct?.rtpCommitId ??
        finalProductResponse.optionalFinalProduct?.configurationCommitId
    );
  }

  private fetchLatestFinalProduct(archivalBranchName: string) {
    return from(
      this.latestFinalProductService.getLatestFinalProductOnBranch({
        branchName: archivalBranchName,
        projectId: this.projectId,
        repositoryId: this.repositoryId,
      })
    ).pipe(
      filter(
        () => this.archivalBranchNameFormControl.value === archivalBranchName
      )
    );
  }

  private disableFinalProductSelection() {
    this.finalProductIdFromControl.disable();
  }

  private clearConfigCommitIdSelection() {
    this.configCommitIdFromControl.setValue(undefined);
  }

  private clearRtpCommitIdSelection() {
    this.rtpCommitIdFromControl.setValue(undefined);
  }

  private clearFinalProductSelection() {
    this.finalProductIdFromControl.setValue(undefined);
  }

  private clearArchivalBranchNameSelection() {
    this.archivalBranchNameFormControl.setValue(undefined);
  }

  private disableArchivalBranchNameSelection() {
    this.archivalBranchNameFormControl.disable();
  }

  protected readonly DisplayMode = DisplayMode;
  protected readonly MQGFromExistingBranchWarnings =
    MQGFromExistingBranchWarnings;

  private notifyListeners(response: FinalProductResponse) {
    if (response.optionalFinalProduct) {
      this.latestFinalProductFetched$.next(response);
    } else {
      this.latestFinalProductFetchingFailed$.next(response);
    }
  }
}
