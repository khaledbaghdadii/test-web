import { FormControl, FormGroup, Validators } from "@angular/forms";
import { WhitespaceValidators } from "@mxevolve/shared/ui/form";
import {
  ProvidedInput,
  ValidationProcessExecution,
} from "@mxevolve/domains/business-process/data-access";

/**
 * Typed Reactive-Forms model for the Validation definition executor
 * (VAL-27132 Step 15). Mirrors the legacy
 * `ExecuteValidationProcessInputComponent.initializeForm` field-by-field:
 * every control, validator and prefilled seed value is reproduced so the
 * submitted payload is identical. Control keys match the legacy
 * `ExecuteValidationProcessDefinitionInputControls`.
 */
export interface ValidationExecutorFormControls {
  name: FormControl<string | null>;
  official: FormControl<boolean | null>;
  notificationsRecipients: FormControl<string[] | null>;
  qualityGateInfraGroupId: FormControl<string | null>;
  qualityGateScenarioDefinitionIds: FormControl<string[] | null>;
  nightlyRepusherEnabled: FormControl<boolean | null>;
  repositoryId: FormControl<string | null>;
  createBranch: FormControl<boolean | null>;
  archivalBranchName: FormControl<string | null>;
  parentBranchName: FormControl<string | null>;
  businessProcessQualityLevel: FormControl<string | null>;
  finalProductId: FormControl<string | null>;
  configCommitId: FormControl<string | null>;
  rtpCommitId: FormControl<string | null>;
  validationScopeStartCommitId: FormControl<string | null>;
}

export type ValidationExecutorForm = FormGroup<ValidationExecutorFormControls>;

function providedValue<T>(
  providedInputs: readonly ProvidedInput[],
  inputId: string
): T | null {
  return (
    (providedInputs.find((input) => input.inputId === inputId)?.value as T) ??
    null
  );
}

/**
 * Maps the prefilled `createBranch` provided-input (which may arrive as the
 * string `"true"`/`"false"` or a boolean) to a boolean, copied verbatim from
 * the legacy `mapCreateBranchControlValueToBoolean` (unknown → null).
 */
function mapCreateBranchToBoolean(createBranch: unknown): boolean | null {
  if (createBranch === true || createBranch === "true") {
    return true;
  }
  if (createBranch === false || createBranch === "false") {
    return false;
  }
  return null;
}

/**
 * Builds the Validation executor form, seeding the prefilled (definition) inputs
 * and applying the legacy validators: name (required + not blank), official /
 * selectables (required), test scenarios (required + minLength), archival branch
 * (required); parent branch, notifications and the scope start-commit stay
 * optional (the scope start-commit's required validator is toggled at runtime by
 * its conditional visibility).
 */
export function buildValidationExecutorForm(
  providedInputs: readonly ProvidedInput[]
): ValidationExecutorForm {
  return new FormGroup<ValidationExecutorFormControls>({
    name: new FormControl<string | null>(null, [
      Validators.required,
      WhitespaceValidators.notBlank(),
    ]),
    official: new FormControl<boolean | null>(null, [Validators.required]),
    notificationsRecipients: new FormControl<string[] | null>(
      providedValue<string[]>(providedInputs, "notificationsRecipients")
    ),
    qualityGateInfraGroupId: new FormControl<string | null>(
      providedValue(providedInputs, "qualityGateExecutionInfraGroupId"),
      [Validators.required]
    ),
    qualityGateScenarioDefinitionIds: new FormControl<string[] | null>(
      providedValue<string[]>(providedInputs, "testScenarioIds"),
      [Validators.required, Validators.minLength(1)]
    ),
    nightlyRepusherEnabled: new FormControl<boolean | null>(
      providedValue(providedInputs, "nightlyRepusherEnabled"),
      [Validators.required]
    ),
    repositoryId: new FormControl<string | null>(
      providedValue(providedInputs, "repositoryId"),
      [Validators.required]
    ),
    createBranch: new FormControl<boolean | null>(
      mapCreateBranchToBoolean(providedValue(providedInputs, "createBranch")),
      [Validators.required]
    ),
    archivalBranchName: new FormControl<string | null>(
      providedValue(providedInputs, "archivalBranchName"),
      [Validators.required]
    ),
    parentBranchName: new FormControl<string | null>(
      providedValue(providedInputs, "parentBranch")
    ),
    businessProcessQualityLevel: new FormControl<string | null>(
      providedValue(providedInputs, "businessProcessQualityLevel"),
      [Validators.required]
    ),
    finalProductId: new FormControl<string | null>(
      providedValue(providedInputs, "finalProductId"),
      [Validators.required]
    ),
    configCommitId: new FormControl<string | null>(
      providedValue(providedInputs, "configCommitId"),
      [Validators.required]
    ),
    rtpCommitId: new FormControl<string | null>(
      providedValue(providedInputs, "rtpCommitId"),
      [Validators.required]
    ),
    validationScopeStartCommitId: new FormControl<string | null>(null),
  });
}

/**
 * Starting values used to pre-fill the editable Validation executor fields when
 * a run is repushed. Only the editable controls are seeded; definition-provided
 * (locked) fields keep coming from the definition itself.
 */
export type ValidationExecutorSeed = Partial<{
  name: string;
  official: boolean;
  notificationsRecipients: string[];
  qualityGateInfraGroupId: string;
  qualityGateScenarioDefinitionIds: string[];
  nightlyRepusherEnabled: boolean;
  repositoryId: string;
  createBranch: boolean;
  archivalBranchName: string;
  parentBranchName: string;
  businessProcessQualityLevel: string;
  finalProductId: string;
  configCommitId: string;
  rtpCommitId: string;
  validationScopeStartCommitId: string | null;
}>;

/**
 * Maps a previously-run Validation execution to the executor seed so a repush
 * opens the form pre-filled with the original run's inputs.
 */
export function toValidationExecutorSeed(
  execution: ValidationProcessExecution
): ValidationExecutorSeed {
  const input = execution.input;
  return {
    name: execution.name,
    official: execution.officiality?.toUpperCase() === "OFFICIAL",
    notificationsRecipients: execution.notificationsRecipients,
    qualityGateInfraGroupId: input?.qualityGateExecutionInfraGroupId,
    qualityGateScenarioDefinitionIds: input?.scenarioDefinitionIds,
    nightlyRepusherEnabled: input?.nightlyRepusherEnabled,
    repositoryId: input?.repositoryId,
    createBranch: input?.createBranch,
    archivalBranchName: input?.archivalBranchName,
    parentBranchName: input?.parentBranch,
    businessProcessQualityLevel: input?.businessProcessQualityLevel,
    finalProductId: input?.finalProductId,
    configCommitId: input?.configCommitId,
    rtpCommitId: input?.rtpCommitId,
    validationScopeStartCommitId: input?.validationScopeStartCommitId ?? null,
  };
}
