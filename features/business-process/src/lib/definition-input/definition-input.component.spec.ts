import { DefinitionInputComponent } from "./definition-input.component";
import { FormControl } from "@angular/forms";
import { InputAccessMode } from "./input-access-mode";

describe("DefinitionInputComponent", () => {
  let component: DefinitionInputComponent;

  beforeEach(() => {
    component = new DefinitionInputComponent();
  });

  it("should show component if input access mode is ALL_INPUTS", () => {
    component.inputAccessMode = InputAccessMode.ACCESS_ALL_INPUTS;

    component.ngOnInit();

    expect(component.shouldShow).toBeTruthy();
  });

  it("should show component if input access mode is ONLY_INVALID and input is not valid", () => {
    component.inputAccessMode = InputAccessMode.ACCESS_INVALID_INPUTS_ONLY;
    component.inputFormControl = new FormControl();
    component.inputFormControl.setErrors(["error"]);

    component.ngOnInit();

    expect(component.shouldShow).toBeTruthy();
  });

  it("should not show component if input access mode is ONLY_VALID and input is valid", () => {
    component.inputAccessMode = InputAccessMode.ACCESS_INVALID_INPUTS_ONLY;
    component.inputFormControl = new FormControl();

    component.ngOnInit();

    expect(component.shouldShow).toBeFalsy();
  });

  it("should show the component when forceShow is true even if access mode is invalid inputs and form control is valid", () => {
    component.forceShow = true;
    component.inputAccessMode = InputAccessMode.ACCESS_INVALID_INPUTS_ONLY;
    component.inputFormControl = new FormControl();

    component.ngOnInit();
    expect(component.shouldShow).toBeTruthy();
  });

  it.each(["", undefined, null, []])(
    "should show the component when accessing empty inputs and the value is empty",
    (value) => {
      component.inputAccessMode = InputAccessMode.ACCESS_EMPTY_OPTIONAL_INPUTS;
      component.inputFormControl = new FormControl(value);

      component.ngOnInit();
      expect(component.shouldShow).toBeTruthy();
    }
  );
});
