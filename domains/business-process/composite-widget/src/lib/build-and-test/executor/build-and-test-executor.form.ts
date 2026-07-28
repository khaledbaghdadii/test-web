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
import { BuildAndTestProcessExecution } from "@mxevolve/domains/business-process/util";

/**
 * Typed Reactive-Forms model for the Build & Test definition executor
 * (VAL-27132 Step 9). Mirrors the legacy
 * `ExecuteBuildAndTestProcessInputComponent.initializeForm` field-by-field:
 * every control, validator and prefilled seed value is reproduced so the
 * submitted payload is identical.
 */
export interface BuildAndTestExecutorFormControls {
  name: FormControl<string | null>;
  repositoryId: FormControl<string | null>;
  configurationBranchName: FormControl<string | null>;
  configurationParentBranch: FormControl<string | null>;
  skipEnvironmentDeployment: FormControl<boolean>;
  buildScenarioDefinitionId: FormControl<string | null>;
  userStoryIds: FormControl<string[] | null>;
  buildEnvironmentInfraGroup: FormControl<string | null>;
  buildAndTestInfraGroup: FormControl<string | null>;
  notificationsRecipients: FormControl<string[] | null>;
}

export type BuildAndTestExecutorForm =
  FormGroup<BuildAndTestExecutorFormControls>;

/**
 * Branch-name character rule copied verbatim from the legacy
 * `BranchNameValidators.validCharacters()` (`web/libs/ui/inputs`). Replicated
 * here (rather than imported) so the new-arch executor carries no legacy
 * `libs/ui/inputs` dependency (VAL-27132 change #7).
 */
const BRANCH_NAME_INVALID_CHARACTERS =
  /([\s?*~^:\\]+)|(.lock$)|(\/\.)|(\.\.)|([/.]$)|(\/\/)|(^\/)|(@\{)/;

export function branchNameValidCharacters(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    BRANCH_NAME_INVALID_CHARACTERS.test(control.value ?? "")
      ? { containsInvalidCharacters: true }
      : null;
}

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
 * Builds the Build & Test executor form, seeding the prefilled (definition)
 * inputs and applying the legacy validators (branch validators on the
 * configuration branches, required on selectables, required + minLength on the
 * user-story ids; notifications stay optional).
 */
export function buildBuildAndTestExecutorForm(
  providedInputs: readonly ProvidedInput[]
): BuildAndTestExecutorForm {
  const branchValidators: ValidatorFn[] = [
    Validators.required,
    branchNameValidCharacters(),
    WhitespaceValidators.notBlank(),
  ];

  return new FormGroup<BuildAndTestExecutorFormControls>({
    name: new FormControl<string | null>(null, [
      Validators.required,
      WhitespaceValidators.notBlank(),
    ]),
    repositoryId: new FormControl<string | null>(
      providedValue(providedInputs, "repositoryId"),
      [Validators.required]
    ),
    configurationBranchName: new FormControl<string | null>(
      providedValue(providedInputs, "configurationBranchName"),
      branchValidators
    ),
    configurationParentBranch: new FormControl<string | null>(
      providedValue(providedInputs, "configurationParentBranch"),
      branchValidators
    ),
    skipEnvironmentDeployment: new FormControl<boolean>(false, {
      nonNullable: true,
    }),
    buildScenarioDefinitionId: new FormControl<string | null>(
      providedValue(providedInputs, "buildScenarioDefinitionId"),
      [Validators.required]
    ),
    userStoryIds: new FormControl<string[] | null>(null, [
      Validators.required,
      Validators.minLength(1),
    ]),
    buildEnvironmentInfraGroup: new FormControl<string | null>(
      providedValue(providedInputs, "buildEnvironmentInfraGroup"),
      [Validators.required]
    ),
    buildAndTestInfraGroup: new FormControl<string | null>(
      providedValue(providedInputs, "buildAndTestInfraGroup"),
      [Validators.required]
    ),
    notificationsRecipients: new FormControl<string[] | null>(
      providedValue<string[]>(providedInputs, "notificationsRecipients")
    ),
  });
}

/**
 * Starting values used to pre-fill the editable executor fields when a run is
 * repushed. Only the editable controls are seeded; the definition-provided
 * (locked) fields keep coming from the definition itself.
 */
export type BuildAndTestExecutorSeed = Partial<{
  name: string;
  repositoryId: string;
  configurationBranchName: string;
  configurationParentBranch: string;
  skipEnvironmentDeployment: boolean;
  buildScenarioDefinitionId: string;
  userStoryIds: string[];
  buildEnvironmentInfraGroup: string;
  buildAndTestInfraGroup: string;
  notificationsRecipients: string[];
}>;

/**
 * Maps a previously-run Build & Test execution to the executor seed so a repush
 * opens the form pre-filled with the original run's inputs (legacy parity with
 * `RepushBuildAndTestProcessInputComponent`).
 */
export function toBuildAndTestExecutorSeed(
  execution: BuildAndTestProcessExecution
): BuildAndTestExecutorSeed {
  const input = execution.input;
  return {
    name: execution.name,
    repositoryId: input?.repositoryId,
    configurationBranchName: input?.configurationBranchName,
    configurationParentBranch: input?.configurationParentBranch,
    skipEnvironmentDeployment:
      input?.buildEnvironment?.skipEnvironmentDeployment,
    buildScenarioDefinitionId: input?.buildEnvironment?.scenarioDefinitionId,
    userStoryIds: input?.userStoryIds,
    buildEnvironmentInfraGroup: input?.buildEnvironmentInfraGroup,
    buildAndTestInfraGroup: input?.buildAndTestInfraGroup,
    notificationsRecipients: execution.notificationsRecipients,
  };
}
