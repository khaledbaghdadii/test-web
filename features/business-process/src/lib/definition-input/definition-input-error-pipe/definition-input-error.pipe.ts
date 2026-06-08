import { Pipe, PipeTransform } from "@angular/core";
import { FormControl } from "@angular/forms";

@Pipe({
  name: "definitionInputError",
  standalone: true,
})
export class DefinitionInputErrorPipe implements PipeTransform {
  transform(formControl: FormControl): string {
    if (formControl.hasError("required")) {
      return "Field is required";
    } else if (formControl.hasError("whitespace")) {
      return "Field cannot be whitespaces";
    } else if (formControl.hasError("containsInvalidCharacters")) {
      return "Field contains invalid characters";
    } else if (formControl.hasError("missingFactoryProductAttributes")) {
      return "All attributes are required when selecting a factory product";
    } else if (formControl.hasError("containsWhitespace")) {
      return "Field cannot contain whitespaces";
    } else {
      return "";
    }
  }
}
