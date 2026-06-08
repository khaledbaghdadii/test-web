import { FormControl } from "@angular/forms";
import { noSpacesValidator } from "./no-space-validators";

describe("noSpacesValidator", () => {
  it("should return null for valid strings without spaces", () => {
    const control = new FormControl("validText", [noSpacesValidator()]);

    expect(control.valid).toBeTruthy();
    expect(control.errors).toBeNull();
  });

  it("should return validation error for strings with spaces", () => {
    const control = new FormControl("invalid text", [noSpacesValidator()]);

    expect(control.valid).toBeFalsy();
    expect(control.errors).toEqual({ noSpaces: true });
  });

  it("should return validation error for strings with only spaces", () => {
    const control = new FormControl("   ", [noSpacesValidator()]);

    expect(control.valid).toBeFalsy();
    expect(control.errors).toEqual({ noSpaces: true });
  });

  it("should return null for null or undefined values", () => {
    const nullControl = new FormControl(null, [noSpacesValidator()]);
    expect(nullControl.errors).toBeNull();

    const undefinedControl = new FormControl(undefined, [noSpacesValidator()]);
    expect(undefinedControl.errors).toBeNull();
  });

  it("should return null for empty strings", () => {
    const control = new FormControl("", [noSpacesValidator()]);

    expect(control.valid).toBeTruthy();
    expect(control.errors).toBeNull();
  });
});
