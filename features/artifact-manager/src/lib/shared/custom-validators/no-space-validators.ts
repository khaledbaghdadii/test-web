import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function noSpacesValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const hasSpaces = control.value?.includes(" ");
    return hasSpaces ? { noSpaces: true } : null;
  };
}
