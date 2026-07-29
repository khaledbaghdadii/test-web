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
import {
  FinalProduct,
  FinalProductState,
} from "@mxevolve/domains/artifact/data-access";
import {
  FinalProductDropdownComponent,
  FinalProductLabelMode,
} from "@mxevolve/domains/artifact/widget";
import { BranchInputComponent } from "@mxevolve/domains/scm/widget";
import { DefinitionInputComponent } from "@mxevolve/domains/business-process/ui";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { injectInputVisibility } from "../../../../../shared/input-visibility.store";

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
    FinalProductDropdownComponent,
  ],
})
export class MqgFromNewBranchParametersComponent implements OnInit, OnDestroy {
  /** Executor-owned per-field visibility (VAL-27132 W3, finding V2). */
  protected readonly inputVisibility = injectInputVisibility();

  readonly projectId = input.required<string>();
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
  protected readonly FinalProductLabelMode = FinalProductLabelMode;
  protected readonly validationLevelFilter = ["CQG"];
  protected readonly stateFilter = [FinalProductState.AVAILABLE];
  protected parentBranchNameInitialValue = "";
  protected archivalBranchNameInitialValue = "";

  ngOnInit(): void {
    const parentBranch = this.parentBranchNameFormControl();
    const archivalBranch = this.archivalBranchNameFormControl();
    this.parentBranchNameInitialValue = parentBranch.value ?? "";
    this.archivalBranchNameInitialValue = archivalBranch.value ?? "";

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
          this.resetFinalProductSelection();
        } else {
          this.clearFinalProduct();
        }
      });
  }

  ngOnDestroy(): void {
    const parentBranch = this.parentBranchNameFormControl();
    parentBranch.removeValidators(Validators.required);
    parentBranch.reset(null, { emitEvent: false });
    parentBranch.disable({ emitEvent: false });
    parentBranch.updateValueAndValidity({ emitEvent: false });

    const archivalBranch = this.archivalBranchNameFormControl();
    archivalBranch.reset(null, { emitEvent: false });
    archivalBranch.disable({ emitEvent: false });

    this.clearFinalProduct();
  }

  /** Legacy `handleSelectedFinalProduct`: the commits follow the product. */
  protected onFinalProductSelected(product: FinalProduct | undefined): void {
    if (!product) {
      this.resetFinalProductSelection();
      return;
    }
    this.configCommitIdFormControl().setValue(product.configurationCommitId, {
      emitEvent: false,
    });
    this.rtpCommitIdFormControl().setValue(
      product.rtpProduct?.rtpCommitId ?? product.configurationCommitId,
      { emitEvent: false }
    );
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

  private resetFinalProductSelection(): void {
    this.finalProductIdFormControl().reset(null, { emitEvent: false });
    this.configCommitIdFormControl().reset(null, { emitEvent: false });
    this.rtpCommitIdFormControl().reset(null, { emitEvent: false });
  }

  private clearFinalProduct(): void {
    this.resetFinalProductSelection();
    this.finalProductIdFormControl().disable({ emitEvent: false });
  }
}
