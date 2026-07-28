import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { WhitespaceValidators } from "@mxevolve/shared/ui/form";
import { ProvidedInput } from "@mxevolve/domains/business-process/data-access";
import { UpgradeProcessExecution } from "@mxevolve/domains/business-process/util";

/**
 * Factory-product value held by the `factoryProduct` / `referenceFactoryProduct`
 * controls, seeded from the definition's `providedInputs` and submitted verbatim
 * in the MX / reference-environment parameters. Mirrors the legacy
 * `FactoryProductInput`.
 */
export interface UpgradeFactoryProductValue {
  id: string;
  mxVersion: string;
  mxBuildId: string;
  bipVersion?: string;
  bipBuildId?: string;
}

/**
 * Typed Reactive-Forms model for the Upgrade definition executor
 * (VAL-27132 Step 19). Mirrors the legacy
 * `ExecuteUpgradeProcessDefinitionInputsComponent.initializeForm` field-by-field:
 * every control key, validator and prefilled seed value is reproduced so the
 * submitted payload is identical. Control keys match the legacy form group.
 */
export interface UpgradeExecutorFormControls {
  name: FormControl<string | null>;
  official: FormControl<boolean | null>;
  factoryProduct: FormControl<UpgradeFactoryProductValue | null>;
  parentMxArchivalBranch: FormControl<string | null>;
  upgradeJump: FormControl<string | null>;
  repositoryId: FormControl<string | null>;
  businessProcessQualityLevel: FormControl<string | null>;
  createBranch: FormControl<boolean | null>;
  configurationBranchName: FormControl<string | null>;
  configurationParentBranch: FormControl<string | null>;
  qualityGateExecutionInfraGroupId: FormControl<string | null>;
  binaryConversionInfraGroupId: FormControl<string | null>;
  testScenarioIds: FormControl<string[] | null>;
  technicalUpgradeTestScenarioId: FormControl<string | null>;
  referenceCommitId: FormControl<string | null>;
  referenceFactoryProduct: FormControl<UpgradeFactoryProductValue | null>;
  referenceEnvironmentDefinitionId: FormControl<string | null>;
  referenceEnvironmentInfraGroupId: FormControl<string | null>;
  notificationsRecipients: FormControl<string[] | null>;
}

export type UpgradeExecutorForm = FormGroup<UpgradeExecutorFormControls>;

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
 * string `"true"`/`"false"` or a boolean) to a boolean, copied verbatim from the
 * legacy `mapCreateBranchControlValueToBoolean` (unknown → null).
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
 * Reproduces the legacy `FactoryProductValidator.factoryProductAttributes()`:
 * the factory-product object is invalid unless it carries an `id`.
 */
function factoryProductAttributes(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    control.value?.id ? null : { missingFactoryProductAttributes: true };
}

/**
 * Builds the Upgrade executor form, seeding the prefilled (definition) inputs and
 * applying the legacy validators transcribed from
 * `ExecuteUpgradeProcessDefinitionInputsComponent` (all in
 * `VALIDATE_ALL_FIELDS` mode):
 * - name: required + not blank
 * - official / upgradeJump / repositoryId / businessProcessQualityLevel /
 *   createBranch / infra groups / reference environment definition: required
 * - factoryProduct / referenceFactoryProduct: required + factory-product attributes
 * - parentMxArchivalBranch / referenceCommitId (copiable text): required + not
 *   blank + no whitespaces
 * - configurationBranchName / configurationParentBranch: required
 * - testScenarioIds (multi-select): required + minLength(1)
 * - technicalUpgradeTestScenarioId: required
 * - notificationsRecipients: optional (no validators)
 */
export function buildUpgradeExecutorForm(
  providedInputs: readonly ProvidedInput[]
): UpgradeExecutorForm {
  return new FormGroup<UpgradeExecutorFormControls>({
    name: new FormControl<string | null>(null, [
      Validators.required,
      WhitespaceValidators.notBlank(),
    ]),
    official: new FormControl<boolean | null>(null, [Validators.required]),
    factoryProduct: new FormControl<UpgradeFactoryProductValue | null>(
      providedValue<UpgradeFactoryProductValue>(
        providedInputs,
        "factoryProduct"
      ),
      [Validators.required, factoryProductAttributes()]
    ),
    parentMxArchivalBranch: new FormControl<string | null>(
      providedValue(providedInputs, "parentMxArchivalBranch"),
      [
        Validators.required,
        WhitespaceValidators.notBlank(),
        WhitespaceValidators.noWhitespaces(),
      ]
    ),
    upgradeJump: new FormControl<string | null>(
      providedValue(providedInputs, "upgradeJump"),
      [Validators.required]
    ),
    repositoryId: new FormControl<string | null>(
      providedValue(providedInputs, "repositoryId"),
      [Validators.required]
    ),
    businessProcessQualityLevel: new FormControl<string | null>(
      providedValue(providedInputs, "businessProcessQualityLevel"),
      [Validators.required]
    ),
    createBranch: new FormControl<boolean | null>(
      mapCreateBranchToBoolean(providedValue(providedInputs, "createBranch")),
      [Validators.required]
    ),
    configurationBranchName: new FormControl<string | null>(
      providedValue(providedInputs, "configurationBranchName"),
      [Validators.required]
    ),
    configurationParentBranch: new FormControl<string | null>(
      providedValue(providedInputs, "configurationParentBranch"),
      [Validators.required]
    ),
    qualityGateExecutionInfraGroupId: new FormControl<string | null>(
      providedValue(providedInputs, "qualityGateExecutionInfraGroupId"),
      [Validators.required]
    ),
    binaryConversionInfraGroupId: new FormControl<string | null>(
      providedValue(providedInputs, "binaryConversionInfraGroupId"),
      [Validators.required]
    ),
    testScenarioIds: new FormControl<string[] | null>(
      providedValue<string[]>(providedInputs, "testScenarioIds"),
      [Validators.required, Validators.minLength(1)]
    ),
    technicalUpgradeTestScenarioId: new FormControl<string | null>(
      providedValue(providedInputs, "technicalUpgradeTestScenarioId"),
      [Validators.required]
    ),
    referenceCommitId: new FormControl<string | null>(
      providedValue(providedInputs, "referenceCommitId"),
      [
        Validators.required,
        WhitespaceValidators.notBlank(),
        WhitespaceValidators.noWhitespaces(),
      ]
    ),
    referenceFactoryProduct: new FormControl<UpgradeFactoryProductValue | null>(
      providedValue<UpgradeFactoryProductValue>(
        providedInputs,
        "referenceFactoryProduct"
      ),
      [Validators.required, factoryProductAttributes()]
    ),
    referenceEnvironmentDefinitionId: new FormControl<string | null>(
      providedValue(providedInputs, "referenceEnvironmentDefinitionId"),
      [Validators.required]
    ),
    referenceEnvironmentInfraGroupId: new FormControl<string | null>(
      providedValue(providedInputs, "referenceEnvironmentInfraGroupId"),
      [Validators.required]
    ),
    notificationsRecipients: new FormControl<string[] | null>(
      providedValue<string[]>(providedInputs, "notificationsRecipients")
    ),
  });
}

/**
 * Starting values used to pre-fill the editable Upgrade executor fields when a
 * run is repushed. Only the editable controls whose values the execution input
 * carries are seeded; the reference-environment fields are not part of the
 * persisted upgrade input, so they fall back to the definition/empty defaults.
 */
export type UpgradeExecutorSeed = Partial<{
  name: string;
  official: boolean;
  factoryProduct: UpgradeFactoryProductValue;
  parentMxArchivalBranch: string;
  upgradeJump: string;
  repositoryId: string;
  businessProcessQualityLevel: string;
  createBranch: boolean;
  configurationBranchName: string;
  configurationParentBranch: string;
  qualityGateExecutionInfraGroupId: string;
  binaryConversionInfraGroupId: string;
  technicalUpgradeTestScenarioId: string;
  notificationsRecipients: string[];
}>;

/**
 * Maps a previously-run Upgrade execution to the executor seed so a repush opens
 * the form pre-filled with the original run's inputs.
 */
export function toUpgradeExecutorSeed(
  execution: UpgradeProcessExecution
): UpgradeExecutorSeed {
  const input = execution.input;
  const factoryProduct: UpgradeFactoryProductValue | undefined =
    input?.factoryProductId
      ? {
          id: input.factoryProductId,
          mxVersion: input.mxVersion,
          mxBuildId: input.mxBuildId,
          bipVersion: input.bipVersion,
          bipBuildId: input.bipBuildId,
        }
      : undefined;
  return {
    name: execution.name,
    official: execution.officiality?.toUpperCase() === "OFFICIAL",
    factoryProduct,
    parentMxArchivalBranch: input?.parentMxArchivalBranch,
    upgradeJump: input?.upgradeJump,
    repositoryId: input?.repositoryId,
    businessProcessQualityLevel: input?.businessProcessQualityLevel,
    createBranch: input?.createBranch,
    configurationBranchName: input?.configurationBranchName,
    configurationParentBranch: input?.configurationParentBranch,
    qualityGateExecutionInfraGroupId: input?.qualityGateExecutionInfraGroupId,
    binaryConversionInfraGroupId: input?.binaryConversionInfraGroupId,
    technicalUpgradeTestScenarioId: input?.binaryConversionTestScenarioId,
    notificationsRecipients: execution.notificationsRecipients,
  };
}
