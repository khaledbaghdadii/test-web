import { Component, OnDestroy, OnInit, inject, input } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { InputText } from "primeng/inputtext";
import { FinalProduct } from "@mxevolve/domains/artifact/data-access";
import {
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
    FinalProductDropdownInputComponent,
  ],
})
export class DqgFromNewBranchParametersComponent implements OnInit, OnDestroy {
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

  private readonly toast = inject(ToastMessageService);

  protected readonly FinalProductDropdownInputLabelMode =
    FinalProductDropdownInputLabelMode;
  protected readonly validationLevelFilter = ["MQG"];
  protected archivalBranchNameInitialValue = "";

  private finalProductControls(): FinalProductControls {
    return {
      finalProductId: this.finalProductIdFormControl(),
      configCommitId: this.configCommitIdFormControl(),
      rtpCommitId: this.rtpCommitIdFormControl(),
    };
  }

  ngOnInit(): void {
    const archivalBranch = this.archivalBranchNameFormControl();
    this.archivalBranchNameInitialValue = archivalBranch.value ?? "";
    archivalBranch.enable({ emitEvent: false });
    this.finalProductIdFormControl().enable({ emitEvent: false });
  }

  ngOnDestroy(): void {
    releaseControl(this.archivalBranchNameFormControl());

    resetFinalProductSelection(this.finalProductControls());
    this.finalProductIdFormControl().disable({ emitEvent: false });
  }

  protected onFinalProductSelected(product: FinalProduct | undefined): void {
    applyFinalProductSelection(this.finalProductControls(), product);
  }

  protected showArchivalBranchError(): void {
    this.toast.showError(
      "The branch name available in the Process Template already exists in the repository. Please update the Process Template with a unique name to create a new branch."
    );
  }

  protected notProvided(inputId: string): boolean {
    return !isProvidedByDefinition(this.providedInputs(), inputId);
  }
}
