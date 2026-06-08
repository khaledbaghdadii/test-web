import { Component, inject, Input, OnDestroy, OnInit } from "@angular/core";
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import {
  filter,
  map,
  Observable,
  pairwise,
  startWith,
  Subject,
  takeUntil,
  tap,
} from "rxjs";
import {
  BusinessProcessFinalProductInput,
  BusinessProcessFinalProductSelectorComponent,
} from "@mxflow/ui/inputs";
import { InputTextModule } from "primeng/inputtext";
import { DefinitionInputComponent } from "../../../../definition-input/definition-input.component";
import { DisplayMode } from "../../../../definition-input/display-mode";
import { InputAccessMode } from "../../../../definition-input/input-access-mode";
import { BranchInputComponent } from "@mxflow/features/scm";
import { ToastMessageService } from "@mxflow/ui/alert";

@Component({
  selector: "mxevolve-mqg-from-new-branch-parameters",
  templateUrl: "mqg-from-new-branch-parameters.component.html",
  imports: [
    BusinessProcessFinalProductSelectorComponent,
    DefinitionInputComponent,
    FormsModule,
    InputTextModule,
    ReactiveFormsModule,
    BranchInputComponent,
  ],
})
export class MqgFromNewBranchParametersComponent implements OnInit, OnDestroy {
  private readonly toastService = inject(ToastMessageService);

  @Input({ required: true }) repositoryIdFormControl: FormControl;
  @Input({ required: true }) archivalBranchNameFormControl: FormControl;
  @Input({ required: true }) parentBranchFormControl: FormControl;
  @Input({ required: true }) finalProductIdFromControl: FormControl;
  @Input({ required: true }) rtpCommitIdFromControl: FormControl;
  @Input({ required: true }) configCommitIdFromControl: FormControl;
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) displayMode: DisplayMode;
  @Input({ required: true }) inputAccessMode: InputAccessMode;
  @Input() prefilledInputsToShow: string[] = [];

  protected parentBranchNameSet$: Observable<string>;
  protected parentBranchNameNotSet$: Observable<string>;
  protected finalProductSet$: Observable<BusinessProcessFinalProductInput>;
  protected finalProductNotSet$: Observable<BusinessProcessFinalProductInput>;
  protected parentBranchNameChanged$: Observable<string>;

  finalProductSelectionControl: FormControl<BusinessProcessFinalProductInput>;
  forceShowParentBranch = false;
  forceShowArchivalBranch = false;
  forceShowFinalProductId = false;
  forceShowRtpCommitId = false;

  parentBranchNameInitialValue: string;
  archivalBranchNameInitialValue: string;

  private readonly destroy$ = new Subject();

  ngOnInit(): void {
    this.parentBranchNameInitialValue = this.parentBranchFormControl.value;
    this.archivalBranchNameInitialValue =
      this.archivalBranchNameFormControl.value;

    this.initialize();

    this.parentBranchNameSet$
      .pipe(
        tap(() => this.enableFinalProductSelection()),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.parentBranchNameNotSet$
      .pipe(
        tap(() => this.disableFinalProductSelection()),
        tap(() => this.clearFinalProductSelection()),
        tap(() => this.clearConfigCommitIdSelection()),
        tap(() => this.clearRtpCommitIdSelection()),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.parentBranchNameChanged$
      .pipe(
        tap(() => this.clearFinalProductSelection()),
        tap(() => this.clearConfigCommitIdSelection()),
        tap(() => this.clearRtpCommitIdSelection()),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.finalProductSet$
      .pipe(
        tap((finalProduct) => this.setFinalProductId(finalProduct)),
        tap((finalProduct) => this.setConfigCommitId(finalProduct)),
        tap((finalProduct) => this.setRtpCommitId(finalProduct)),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.finalProductNotSet$
      .pipe(
        tap(() => this.clearFinalProductSelection()),
        tap(() => this.clearConfigCommitIdSelection()),
        tap(() => this.clearRtpCommitIdSelection()),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.forceShowParentBranch =
      this.prefilledInputsToShow.includes("parentBranch");
    this.forceShowArchivalBranch =
      this.prefilledInputsToShow.includes("archivalBranchName");
    this.forceShowFinalProductId =
      this.prefilledInputsToShow.includes("finalProductId");
    this.forceShowRtpCommitId =
      this.prefilledInputsToShow.includes("rtpCommitId");
  }

  ngOnDestroy(): void {
    this.markParentBranchSelectionAsNotRequired();
    this.disableArchivalBranchNameSelection();
    this.disableParentBranchSelection();
    this.disableFinalProductIdSelection();
    this.clearArchivalBranchNameSelection();
    this.clearParentBranchSelection();
    this.clearFinalProductSelection();
    this.clearConfigCommitIdSelection();
    this.clearRtpCommitIdSelection();
    this.destroy$.next({});
    this.destroy$.complete();
  }

  showParentBranchError(): void {
    this.toastService.showError(
      "The branch name available in the BP definition doesn't exist in the repository. Please check the name and try again with an existing branch."
    );
  }

  showArchivalBranchError(): void {
    this.toastService.showError(
      "The branch name available in the BP definition already exists in the repository. Please update the definition with a unique name to create a new branch."
    );
  }

  private initialize() {
    this.markParentBranchSelectionAsRequired();
    this.enableArchivalBranchNameSelection();
    this.enableParentBranchNameSelection();
    this.initializeFinalProductSelectionCriteriaSelection();
    this.initializeFinalProductSelection();
  }

  private initializeFinalProductSelection() {
    this.finalProductSelectionControl =
      new FormControl<BusinessProcessFinalProductInput>(
        {
          id: this.finalProductIdFromControl.value,
          configurationCommitId: this.configCommitIdFromControl.value,
          rtpCommitId: this.rtpCommitIdFromControl.value,
        },
        { nonNullable: true }
      );

    this.finalProductSet$ = this.finalProductSelectionControl.valueChanges.pipe(
      filter((finalProduct) => !!finalProduct)
    );

    this.finalProductNotSet$ =
      this.finalProductSelectionControl.valueChanges.pipe(
        filter((finalProduct) => !finalProduct)
      );
  }

  private initializeFinalProductSelectionCriteriaSelection() {
    this.parentBranchNameSet$ = this.parentBranchFormControl.valueChanges.pipe(
      startWith(this.parentBranchFormControl.value),
      filter((parentBranch) => !!parentBranch)
    );

    this.parentBranchNameNotSet$ =
      this.parentBranchFormControl.valueChanges.pipe(
        startWith(this.parentBranchFormControl.value),
        filter((parentBranch) => !parentBranch)
      );

    this.parentBranchNameChanged$ = this.parentBranchNameSet$.pipe(
      pairwise(),
      filter(([previous, current]) => previous !== current),
      map(([, current]) => current)
    );
  }

  private markParentBranchSelectionAsRequired() {
    if (this.finalProductIdFromControl.hasValidator(Validators.required)) {
      this.parentBranchFormControl.addValidators(Validators.required);
    }
  }

  private disableFinalProductIdSelection() {
    this.finalProductIdFromControl.disable({
      onlySelf: true,
      emitEvent: true,
    });
  }

  private clearRtpCommitIdSelection() {
    this.rtpCommitIdFromControl.setValue(undefined);
  }

  private enableFinalProductSelection() {
    this.finalProductIdFromControl.enable();
  }

  private setFinalProductId(
    finalProductInput: BusinessProcessFinalProductInput
  ) {
    this.finalProductIdFromControl.setValue(finalProductInput.id);
  }

  private setConfigCommitId(
    finalProductInput: BusinessProcessFinalProductInput
  ) {
    this.configCommitIdFromControl.setValue(
      finalProductInput.configurationCommitId
    );
  }

  private setRtpCommitId(finalProductInput: BusinessProcessFinalProductInput) {
    this.rtpCommitIdFromControl.setValue(finalProductInput.rtpCommitId);
  }

  private disableFinalProductSelection() {
    this.finalProductIdFromControl.disable();
  }

  private clearFinalProductSelection() {
    this.finalProductIdFromControl.setValue(undefined);
  }

  private clearConfigCommitIdSelection() {
    this.configCommitIdFromControl.setValue(undefined);
  }

  private disableParentBranchSelection() {
    this.parentBranchFormControl.disable({
      onlySelf: true,
      emitEvent: true,
    });
  }

  private clearParentBranchSelection() {
    this.parentBranchFormControl.setValue(undefined);
  }

  private markParentBranchSelectionAsNotRequired() {
    this.parentBranchFormControl.removeValidators(Validators.required);
  }

  private disableArchivalBranchNameSelection() {
    return this.archivalBranchNameFormControl.disable();
  }

  private clearArchivalBranchNameSelection() {
    this.archivalBranchNameFormControl.setValue(undefined);
  }

  private enableArchivalBranchNameSelection() {
    this.archivalBranchNameFormControl.enable();
  }

  private enableParentBranchNameSelection() {
    this.parentBranchFormControl.enable();
  }

  protected readonly DisplayMode = DisplayMode;
}
