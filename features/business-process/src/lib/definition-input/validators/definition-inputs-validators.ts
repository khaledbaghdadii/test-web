import { ValidatorFn, Validators } from "@angular/forms";
import { BranchNameValidators } from "@mxflow/ui/inputs";
import { WhitespaceValidators } from "@mxflow/validator";
import { FactoryProductValidator } from "./factory-product.validator";
import { InputValidationMode } from "../input-validation-mode";

export class DefinitionInputsValidators {
  static readonly arrayLengthValidator = Validators.minLength(1);

  static standardBranchInputValidators(
    inputValidationMode: InputValidationMode,
    isOptional = false
  ) {
    const whenValidatingAllFieldsValidators = [
      BranchNameValidators.validCharacters(),
      WhitespaceValidators.notBlank(),
    ];

    if (!isOptional) {
      whenValidatingAllFieldsValidators.push(Validators.required);
    }

    return this.getValidators(
      inputValidationMode,
      whenValidatingAllFieldsValidators,
      [BranchNameValidators.validCharacters(), WhitespaceValidators.notBlank()]
    );
  }

  static factoryProductValidators(inputValidationMode: InputValidationMode) {
    return this.getValidators(inputValidationMode, [
      Validators.required,
      FactoryProductValidator.factoryProductAttributes(),
    ]);
  }

  static standardCopiableTextInputValidators(
    inputValidationMode: InputValidationMode
  ) {
    return this.getValidators(
      inputValidationMode,
      [
        Validators.required,
        WhitespaceValidators.notBlank(),
        WhitespaceValidators.noWhitespaces(),
      ],
      [WhitespaceValidators.notBlank(), WhitespaceValidators.noWhitespaces()]
    );
  }

  static standardSelectableInputValidators(
    inputValidationMode: InputValidationMode
  ) {
    return this.getValidators(inputValidationMode, [Validators.required]);
  }

  static standardMultiSelectInputValidators(
    inputValidationMode: InputValidationMode
  ) {
    return this.getValidators(inputValidationMode, [
      Validators.required,
      this.arrayLengthValidator,
    ]);
  }

  private static getValidators(
    inputValidationMode: InputValidationMode,
    whenValidatingAllFields: ValidatorFn[],
    whenValidatingOnlyFilledFields?: ValidatorFn[]
  ) {
    return inputValidationMode === InputValidationMode.VALIDATE_ALL_FIELDS
      ? whenValidatingAllFields
      : whenValidatingOnlyFilledFields ?? [];
  }
}
