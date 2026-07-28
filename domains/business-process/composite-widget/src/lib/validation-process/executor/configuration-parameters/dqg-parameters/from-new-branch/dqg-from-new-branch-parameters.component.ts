import { Component, OnDestroy, OnInit, inject, input } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { InputText } from "primeng/inputtext";
import {FinalProduct, FinalProductState} from "@mxevolve/domains/artifact/data-access";
import {
  FinalProductDropdownComponent,
  FinalProductLabelMode,
} from "@mxevolve/domains/artifact/widget";
import { BranchInputComponent } from "@mxevolve/domains/scm/widget";
import { DefinitionInputComponent } from "@mxevolve/domains/business-process/ui";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { injectInputVisibility } from "../../../../shared/input-visibility.store";

/**
 * DQG + "Create Branch = Yes" configuration parameters: a brand-new archival
 * branch and a final product picked by tag.
 *
 * New-architecture rebuild of the legacy `DqgFromNewBranchParametersComponent`.
 * Unlike the MQG path there is no parent branch, the picker is not scoped to a
 * branch and lists MQG-level products labelled `tag-commitId`, and the RTP
 * commit only appears once it has actually been populated.
 */
@Component({
  selector: "mxevolve-dqg-from-new-branch-parameters",
  templateUrl: "./dqg-from-new-branch-parameters.component.html",
  imports: [
    ReactiveFormsModule,
    InputText,
    BranchInputComponent,
    DefinitionInputComponent,
    FinalProductDropdownComponent,
  ],
})
export class DqgFromNewBranchParametersComponent implements OnInit, OnDestroy {
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

  private readonly toast = inject(ToastMessageService);

  protected readonly FinalProductLabelMode = FinalProductLabelMode;
  protected readonly validationLevelFilter = ["MQG"];
  protected archivalBranchNameInitialValue = "";

  ngOnInit(): void {
    const archivalBranch = this.archivalBranchNameFormControl();
    this.archivalBranchNameInitialValue = archivalBranch.value ?? "";
    archivalBranch.enable({ emitEvent: false });
    this.finalProductIdFormControl().enable({ emitEvent: false });
  }

  ngOnDestroy(): void {
    const archivalBranch = this.archivalBranchNameFormControl();
    archivalBranch.reset(null, { emitEvent: false });
    archivalBranch.disable({ emitEvent: false });

    this.resetFinalProductSelection();
    this.finalProductIdFormControl().disable({ emitEvent: false });
  }

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

    protected readonly FinalProductState = FinalProductState;
}
