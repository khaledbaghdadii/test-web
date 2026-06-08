import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export class FactoryProductValidator {
  private static missingAttributesValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    return !control.value?.id
      ? ({ missingFactoryProductAttributes: true } as ValidationErrors)
      : null;
  };

  static factoryProductAttributes(): ValidatorFn {
    return FactoryProductValidator.missingAttributesValidator;
  }
}
