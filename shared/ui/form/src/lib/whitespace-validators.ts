import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export class WhitespaceValidators {
  private static readonly notBlankValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const value = control.value || "";
    const isWhitespace =
      !Array.isArray(value) && value.length > 0 && value.trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { whitespace: true };
  };

  static notBlank(): ValidatorFn {
    return WhitespaceValidators.notBlankValidator;
  }

  private static readonly noWhitespacesValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const value = control.value || "";
    const containsWhitespaces = value.includes(" ");
    return containsWhitespaces ? { containsWhitespace: true } : null;
  };

  static noWhitespaces(): ValidatorFn {
    return WhitespaceValidators.noWhitespacesValidator;
  }

  static arrayElementMaxLength(maxLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!Array.isArray(value) || value.length === 0) {
        return null;
      }
      const invalidElements = value.filter(
        (element) => element && element.length > maxLength
      );
      return invalidElements.length > 0
        ? { arrayElementMaxLength: { maxLength, invalidElements } }
        : null;
    };
  }
}
