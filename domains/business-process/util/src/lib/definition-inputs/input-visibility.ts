/**
 * Defines which definition inputs an executor form exposes for editing.
 * Migrated from the legacy numeric `InputAccessMode` enum to a string union.
 */
export type InputAccessMode =
  | "ACCESS_ALL_INPUTS"
  | "ACCESS_INVALID_INPUTS_ONLY"
  | "ACCESS_EMPTY_OPTIONAL_INPUTS";

/**
 * A provided definition input value carrier (boundary-local shape so this
 * `type:util` library does not depend on a `type:data-access` model).
 */
export interface DefinitionInputValue {
  readonly value: unknown;
}

/**
 * An input is considered empty when it is null/undefined, an empty string, or
 * an empty array (mirrors the legacy `definition-input` `isFormControlEmpty`).
 */
export function isInputEmpty(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * A prefilled input has a non-empty value and is therefore shown read-only on
 * the executor's expand panel rather than as an editable form field.
 */
export function isPrefilled(input: DefinitionInputValue): boolean {
  return !isInputEmpty(input.value);
}

/**
 * A control-like shape (subset of `AbstractControl`) used to decide form-field
 * visibility without depending on `@angular/forms` from this `type:util` lib.
 */
export interface VisibilityControl {
  readonly invalid: boolean;
  readonly value: unknown;
}

/**
 * Decides whether a definition input is rendered as an editable form field.
 *
 * Mirrors the legacy `DefinitionInputComponent.shouldShow` in
 * `web/libs/features/business-process/src/lib/definition-input/definition-input.component.ts`:
 *   forceShow
 *   || mode === ACCESS_ALL_INPUTS
 *   || (mode === ACCESS_INVALID_INPUTS_ONLY && control.invalid)
 *   || (mode === ACCESS_EMPTY_OPTIONAL_INPUTS && isFormControlEmpty()).
 */
export function shouldShowInForm(
  control: VisibilityControl,
  mode: InputAccessMode,
  forceShow = false
): boolean {
  return (
    forceShow ||
    mode === "ACCESS_ALL_INPUTS" ||
    (mode === "ACCESS_INVALID_INPUTS_ONLY" && control.invalid) ||
    (mode === "ACCESS_EMPTY_OPTIONAL_INPUTS" && isInputEmpty(control.value))
  );
}
