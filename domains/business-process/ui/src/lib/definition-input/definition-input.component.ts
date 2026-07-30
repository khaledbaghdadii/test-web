import { Component, OnInit, input } from "@angular/core";
import { AbstractControl, Validators } from "@angular/forms";
import { TooltipModule } from "primeng/tooltip";
import {
  InputAccessMode,
  shouldShowInForm,
} from "@mxevolve/domains/business-process/util";

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
 * `shouldShow` is decided once, on creation, from the control as it stands at
 * that moment. It must never be re-evaluated: a field shown because its control
 * was invalid has to stay on screen once the user fixes it. Projected content is
 * instantiated either way, so a field the form hides still runs its own
 * lookups.
 */
@Component({
  selector: "mxevolve-definition-input",
  templateUrl: "./definition-input.component.html",
  standalone: true,
  imports: [TooltipModule],
  styles: [":host { display: contents; }"],
})
export class DefinitionInputComponent implements OnInit {
  readonly inputId = input.required<string>();
  readonly control = input.required<AbstractControl>();
  readonly inputAccessMode = input.required<InputAccessMode>();
  readonly forceShow = input(false);
  readonly label = input("");
  readonly description = input("");
  readonly tooltip = input("");
  readonly showValidationErrors = input(true);
  /** Placement of the field within the grid its consumer lays out. */
  readonly fieldClass = input("");

  protected shouldShow = false;

  ngOnInit(): void {
    this.shouldShow = shouldShowInForm(
      this.control(),
      this.inputAccessMode(),
      this.forceShow()
    );
  }

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
