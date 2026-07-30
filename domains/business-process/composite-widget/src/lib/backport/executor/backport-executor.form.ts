import {
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { WhitespaceValidators } from "@mxevolve/shared/ui/form";
import { ProvidedInput } from "@mxevolve/domains/business-process/data-access";
import { Reviewer } from "@mxevolve/domains/scm/data-access";

/**
 * Typed Reactive-Forms model for the Backport definition executor
 * (VAL-27132 Step 10). Mirrors the legacy
 * `ExecuteBackportProcessInputComponent.initializeForm` field-by-field so the
 * submitted payload is identical.
 */
export interface BackportExecutorFormControls {
  name: FormControl<string | null>;
  pullRequestId: FormControl<string | null>;
  userStoryIds: FormControl<string[] | null>;
  pullRequestTitle: FormControl<string | null>;
  pullRequestReviewers: FormControl<Reviewer[] | null>;
  notificationsRecipients: FormControl<string[] | null>;
  /**
   * Pre-filled by the definition and never rendered as an editable field, but
   * held as real controls so the executor can mark the merge configuration
   * invalid when it points at something that no longer exists. Previously these
   * were read straight off `providedInputs` at submit time, so a stale id was
   * posted with nothing to stop it.
   */
  repositoryId: FormControl<string | null>;
  mergeConfigurationId: FormControl<string | null>;
  buildAndTestInfraGroup: FormControl<string | null>;
}

export type BackportExecutorForm = FormGroup<BackportExecutorFormControls>;

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
 * Builds the Backport executor form. All editable fields are user-entered (the
 * repository, destination merge configuration and infra group come prefilled
 * from the definition and are shown read-only, not in the form). Validators
 * reproduce the legacy `standardSelectableInputValidators` (required) and
 * `standardMultiSelectInputValidators` (required + minLength) per field. The
 * optional notifications recipients are seeded from the definition's prefilled
 * inputs, mirroring the legacy form.
 */
export function buildBackportExecutorForm(
  providedInputs: readonly ProvidedInput[]
): BackportExecutorForm {
  const requiredSelectable: ValidatorFn[] = [Validators.required];
  const requiredMultiSelect: ValidatorFn[] = [
    Validators.required,
    Validators.minLength(1),
  ];

  return new FormGroup<BackportExecutorFormControls>({
    name: new FormControl<string | null>(null, [
      Validators.required,
      WhitespaceValidators.notBlank(),
    ]),
    pullRequestId: new FormControl<string | null>(null, requiredSelectable),
    userStoryIds: new FormControl<string[] | null>(null, requiredMultiSelect),
    pullRequestTitle: new FormControl<string | null>(null, requiredSelectable),
    pullRequestReviewers: new FormControl<Reviewer[] | null>(
      null,
      requiredMultiSelect
    ),
    notificationsRecipients: new FormControl<string[] | null>(
      providedValue<string[]>(providedInputs, "notificationsRecipients")
    ),
    repositoryId: new FormControl<string | null>(
      providedValue(providedInputs, "repositoryId"),
      requiredSelectable
    ),
    mergeConfigurationId: new FormControl<string | null>(
      providedValue(providedInputs, "mergeConfigurationId"),
      requiredSelectable
    ),
    buildAndTestInfraGroup: new FormControl<string | null>(
      providedValue(providedInputs, "buildAndTestInfraGroup"),
      requiredSelectable
    ),
  });
}
