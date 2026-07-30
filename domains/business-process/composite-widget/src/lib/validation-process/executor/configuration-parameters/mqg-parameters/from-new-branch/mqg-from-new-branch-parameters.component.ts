import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
  input,
} from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { InputText } from "primeng/inputtext";
import { FinalProduct } from "@mxevolve/domains/artifact/data-access";
import {
  DropdownDefaultSelectionMode,
  FinalProductDropdownInputComponent,
  FinalProductDropdownInputLabelMode,
} from "@mxevolve/domains/artifact/widget";
import { BranchInputComponent } from "@mxevolve/domains/scm/widget";
import {
  ProvidedDefinitionInput,
  isProvidedByDefinition,
} from "@mxevolve/domains/business-process/util";
import { DefinitionInputComponent } from "@mxevolve/domains/business-process/ui";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import {
  FinalProductControls,
  applyFinalProductSelection,
  releaseControl,
  resetFinalProductSelection,
} from "../../parameter-controls";

/**
 * MQG + "Create Branch = Yes" configuration parameters: a parent branch to
 * branch off, a brand-new archival branch, and a final product picked from the
 * parent branch by commit id.
 *
 * New-architecture rebuild of the legacy `MqgFromNewBranchParametersComponent`,
 * including its enable/clear cascade: the final product only becomes selectable
 * once a parent branch is supplied, and changing that branch drops any product
 * already chosen so a stale commit is never carried over.
 */
@Component({
  selector: "mxevolve-mqg-from-new-branch-parameters",
  templateUrl: "./mqg-from-new-branch-parameters.component.html",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputText,
    BranchInputComponent,
    DefinitionInputComponent,
    FinalProductDropdownInputComponent,
  ],
})
export class MqgFromNewBranchParametersComponent implements OnInit, OnDestroy {
  readonly projectId = input.required<string>();
  readonly providedInputs = input.required<readonly ProvidedDefinitionInput[]>();
  readonly repositoryId = input.required<string>();
  readonly parentBranchNameFormControl =
    input.required<FormControl<string | null>>();
  readonly archivalBranchNameFormControl =
    input.required<FormControl<string | null>>();
  readonly finalProductIdFormControl =
    input.required<FormControl<string | null>>();
  readonly configCommitIdFormControl =
    input.required<FormControl<string | null>>();
  readonly rtpCommitIdFormControl =
    input.required<FormControl<string | null>>();

  private readonly toast = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  //TODO: check whgat to do wiht input repository id and commit message
  /** Legacy MQG new-branch picker lists CQG products available on the parent branch. */
  protected readonly FinalProductDropdownInputLabelMode =
    FinalProductDropdownInputLabelMode;
  protected readonly DropdownDefaultSelectionMode = DropdownDefaultSelectionMode;
  protected readonly validationLevelFilter = ["CQG"];
  protected parentBranchNameInitialValue = "";
  protected archivalBranchNameInitialValue = "";
  /**
   * Final product the form arrived with, snapshotted once so it survives the
   * parent-branch cascade that clears the live control. Legacy read the same
   * value off the selector control's `defaultValue`, which was seeded from the
   * definition (or repush) input at init and never re-read.
   */
  protected customFinalProductId = "";

  private finalProductControls(): FinalProductControls {
    return {
      finalProductId: this.finalProductIdFormControl(),
      configCommitId: this.configCommitIdFormControl(),
      rtpCommitId: this.rtpCommitIdFormControl(),
    };
  }

  ngOnInit(): void {
    const parentBranch = this.parentBranchNameFormControl();
    const archivalBranch = this.archivalBranchNameFormControl();
    this.parentBranchNameInitialValue = parentBranch.value ?? "";
    this.archivalBranchNameInitialValue = archivalBranch.value ?? "";
    this.customFinalProductId = this.finalProductIdFormControl().value ?? "";

    parentBranch.enable({ emitEvent: false });
    archivalBranch.enable({ emitEvent: false });

    // Legacy: the parent branch is mandatory whenever a final product must be
    // chosen, because it is what scopes the list of selectable products.
    if (this.finalProductIdFormControl().hasValidator(Validators.required)) {
      parentBranch.addValidators(Validators.required);
      parentBranch.updateValueAndValidity({ emitEvent: false });
    }

    if (parentBranch.value) {
      this.finalProductIdFormControl().enable({ emitEvent: false });
    } else {
      this.clearFinalProduct();
    }

    parentBranch.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((branchName) => {
        if (branchName) {
          this.finalProductIdFormControl().enable({ emitEvent: false });
          resetFinalProductSelection(this.finalProductControls());
        } else {
          this.clearFinalProduct();
        }
      });
  }

  ngOnDestroy(): void {
    const parentBranch = this.parentBranchNameFormControl();
    parentBranch.removeValidators(Validators.required);
    releaseControl(parentBranch);
    parentBranch.updateValueAndValidity({ emitEvent: false });

    releaseControl(this.archivalBranchNameFormControl());

    this.clearFinalProduct();
  }

  protected onFinalProductSelected(product: FinalProduct | undefined): void {
    applyFinalProductSelection(this.finalProductControls(), product);
  }

  protected showParentBranchError(): void {
    this.toast.showError(
      "The branch name available in the Process Template doesn't exist in the repository. Please check the name and try again with an existing branch."
    );
  }

  protected showArchivalBranchError(): void {
    this.toast.showError(
      "The branch name available in the Process Template already exists in the repository. Please update the Process Template with a unique name to create a new branch."
    );
  }

  private clearFinalProduct(): void {
    resetFinalProductSelection(this.finalProductControls());
    this.finalProductIdFormControl().disable({ emitEvent: false });
  }

  protected notProvided(inputId: string): boolean {
    return !isProvidedByDefinition(this.providedInputs(), inputId);
  }
}
