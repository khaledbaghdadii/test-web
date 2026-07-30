import { Component, DestroyRef, OnInit, inject, input } from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Select } from "primeng/select";
import { RepositorySelectorComponent } from "@mxevolve/domains/scm/widget";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import {
  ProvidedDefinitionInput,
  isProvidedByDefinition,
} from "@mxevolve/domains/business-process/util";
import { DefinitionInputComponent } from "@mxevolve/domains/business-process/ui";
import { ValidationDqgParametersComponent } from "./dqg-parameters/validation-dqg-parameters.component";
import { ValidationMqgParametersComponent } from "./mqg-parameters/validation-mqg-parameters.component";

/**
 * Configuration Parameters group of the validation executor: the repository,
 * the BP quality level it unlocks, and the MQG/DQG sub-form that follows.
 *
 * New-architecture rebuild of the legacy
 * `ValidationProcessConfigurationParametersComponent`, including its repo-first
 * gating: the quality level stays disabled (and hidden) until a repository is
 * chosen, and clearing or changing the repository resets it - which in turn
 * unmounts the quality-level sub-form and clears every branch, final product
 * and commit it owned.
 */
@Component({
  selector: "mxevolve-validation-configuration-parameters",
  templateUrl: "./validation-configuration-parameters.component.html",
  imports: [
    ReactiveFormsModule,
    Select,
    RepositorySelectorComponent,
    DefinitionInputComponent,
    ValidationMqgParametersComponent,
    ValidationDqgParametersComponent,
  ],
})
export class ValidationConfigurationParametersComponent implements OnInit {
  readonly projectId = input.required<string>();
  readonly providedInputs = input.required<readonly ProvidedDefinitionInput[]>();
  readonly repositoryIdFormControl =
    input.required<FormControl<string | null>>();
  readonly businessProcessQualityLevelFormControl =
    input.required<FormControl<string | null>>();
  readonly createBranchFormControl =
    input.required<FormControl<boolean | null>>();
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

  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastMessageService);

  protected readonly Validators = Validators;
  protected readonly qualityLevelOptions = [
    { label: "MQG", value: "MQG" },
    { label: "DQG", value: "DQG" },
  ];

  ngOnInit(): void {
    const repository = this.repositoryIdFormControl();
    this.applyQualityLevelAvailability(repository.value);

    repository.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((repositoryId) =>
        this.applyQualityLevelAvailability(repositoryId)
      );
  }

  /**
   * Surfaces the repository selector's fetch failure, which was previously bound
   * by nobody and therefore swallowed entirely.
   */
  protected showSelectorError(message: string): void {
    this.toast.showError(message);
  }

  /**
   * Legacy `repositoryValueNotSet$`: the quality level is cleared and locked
   * only when the repository becomes *empty*, never on a plain change. Legacy
   * validation never bound `repositoryChanged` at all, so a definition-prefilled
   * quality level survived the user re-picking a repository.
   *
   * The clear emits deliberately (legacy `setValue(undefined)` did too):
   * `businessProcessQualityLevel` feeds the executor's scope-visibility
   * snapshot, which is recomputed only from `valueChanges`. A silent write there
   * strands the snapshot on the old quality level and can leave the
   * Validation-Scope-Start-Commit field visible and `required` with its
   * preconditions gone — an unsubmittable form. `{ emitEvent: false }` is only
   * for writes nothing subscribes to; the `disable` below is one, since the
   * template reads `.enabled` directly on every change-detection pass.
   */
  private applyQualityLevelAvailability(repositoryId: string | null): void {
    const qualityLevel = this.businessProcessQualityLevelFormControl();
    if (repositoryId) {
      qualityLevel.enable({ emitEvent: false });
      return;
    }
    qualityLevel.reset(null);
    qualityLevel.disable({ emitEvent: false });
  }

  protected notProvided(inputId: string): boolean {
    return !isProvidedByDefinition(this.providedInputs(), inputId);
  }
}
