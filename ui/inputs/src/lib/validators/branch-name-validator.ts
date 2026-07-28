import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export class BranchNameValidators {
  private static branchNameCharactersValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const value = control.value || "";
    const nameRegexp: RegExp =
      /([\s?*~^:\\]+)|(.lock$)|(\/\.)|(\.\.)|([/.]$)|(\/\/)|(^\/)|(@\{)/;
    const containsInvalidCharacters = nameRegexp.test(value);
    return containsInvalidCharacters
      ? { containsInvalidCharacters: true }
      : null;
  };

  static validCharacters(): ValidatorFn {
    return BranchNameValidators.branchNameCharactersValidator;
  }
}
