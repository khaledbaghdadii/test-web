import { Component, input } from "@angular/core";
import { AbstractControl, Validators } from "@angular/forms";
import { TooltipModule } from "primeng/tooltip";

/**
 * Known validation-error keys mapped to the message shown under the field.
 *
 * The first five entries are transcribed verbatim (message and priority order)
 * from the legacy `DefinitionInputErrorPipe`
 * (`web/libs/features/business-process/src/lib/definition-input/definition-input-error-pipe`).
 * Any other error carrying a string payload - such as the branch input's
 * `branchInvalid` / `branchApiError` - is surfaced as-is.
 */
const ERROR_MESSAGES: Record<string, string> = {
  required: "Field is required",
  whitespace: "Field cannot be whitespaces",
  containsInvalidCharacters: "Field contains invalid characters",
  missingFactoryProductAttributes:
    "All attributes are required when selecting a factory product",
  containsWhitespace: "Field cannot contain whitespaces",
  minlength: "Select at least one value",
};

/**
 * Labelled form-field wrapper: renders the label (with a required marker and an
 * optional tooltip), projects the actual control, and shows either the field
 * description or the validation error underneath.
 *
 * New-architecture rebuild of the legacy `mxevolve-definition-input`
 * (`web/libs/features/business-process/src/lib/definition-input`). Unlike the
 * legacy component this one does **not** decide whether the field is shown -
 * that stays with the executor, which gates each field on `shouldShowInForm`.
 *
 * Uses default change detection on purpose: the bound control's validators,
 * status and dirty flag all change outside of signal-land (dynamic
 * `setValidators`, async branch validation), so the label marker and the
 * description/error swap must be re-evaluated on every check - exactly as the
 * legacy template did.
 */
@Component({
  selector: "mxevolve-definition-input",
  templateUrl: "./definition-input.component.html",
  standalone: true,
  imports: [TooltipModule],
})
export class DefinitionInputComponent {
  readonly inputId = input.required<string>();
  readonly control = input.required<AbstractControl>();
  readonly label = input("");
  readonly description = input("");
  readonly tooltip = input("");
  readonly showValidationErrors = input(true);

  protected isRequired(): boolean {
    return this.control().hasValidator(Validators.required);
  }

  /**
   * Legacy rule: the description stays visible while the field is valid, still
   * pristine, or being asynchronously validated; the error replaces it only once
   * the user has actually touched a now-invalid field.
   */
  protected showDescription(): boolean {
    const control = this.control();
    return (
      control.valid ||
      (this.showValidationErrors() && !control.dirty) ||
      control.pending
    );
  }

  protected errorMessage(): string {
    const errors = this.control().errors;
    if (!errors) {
      return "";
    }
    for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
      if (errors[key]) {
        return message;
      }
    }
    const stringError = Object.values(errors).find(
      (value) => typeof value === "string"
    );
    return typeof stringError === "string" ? stringError : "";
  }
}
