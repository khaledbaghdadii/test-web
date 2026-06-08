import { DefinitionInputErrorPipe } from "./definition-input-error.pipe";
import { FormControl } from "@angular/forms";

describe("DefinitionInputErrorPipe", () => {
  let pipe: DefinitionInputErrorPipe;

  beforeEach(() => {
    pipe = new DefinitionInputErrorPipe();
  });

  it("should return empty string when form control has no errors", () => {
    let result = pipe.transform(new FormControl());

    expect(result).toEqual("");
  });

  it("should return correct error message when error is required", () => {
    let formControl = new FormControl();
    formControl.setErrors({ required: true });

    let result = pipe.transform(formControl);

    expect(result).toEqual("Field is required");
  });

  it("should return correct error message when error is whitespace error", () => {
    let formControl = new FormControl();
    formControl.setErrors({ whitespace: true });

    let result = pipe.transform(formControl);

    expect(result).toEqual("Field cannot be whitespaces");
  });

  it("should return correct error message when error is invalid branch name error", () => {
    let formControl = new FormControl();
    formControl.setErrors({ containsInvalidCharacters: true });

    let result = pipe.transform(formControl);

    expect(result).toEqual("Field contains invalid characters");
  });

  it("should return correct error message when error is missing factory product attributes", () => {
    let formControl = new FormControl();
    formControl.setErrors({ missingFactoryProductAttributes: true });

    let result = pipe.transform(formControl);

    expect(result).toEqual(
      "All attributes are required when selecting a factory product"
    );
  });

  it("should return correct error message when error is missing factory product attributes", () => {
    let formControl = new FormControl();
    formControl.setErrors({ containsWhitespace: true });

    let result = pipe.transform(formControl);

    expect(result).toEqual("Field cannot contain whitespaces");
  });
});
