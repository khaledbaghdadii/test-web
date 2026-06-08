import { InputAccessMode } from "@mxflow/features/business-process";
import { DefinitionInputGroupComponent } from "@mxflow/features/business-process";
import { FormControl } from "@angular/forms";

describe("DefinitionInputComponent", () => {
  let component: DefinitionInputGroupComponent;

  beforeEach(() => {
    component = new DefinitionInputGroupComponent();
  });

  it("should show component when input access mode is ALL_INPUTS", () => {
    component.inputAccessMode = InputAccessMode.ACCESS_ALL_INPUTS;

    component.ngOnInit();

    expect(component.shouldShow).toBeTruthy();
  });

  it("should show component when input access mode is ONLY_INVALID and at least one form control is invalid", () => {
    component.inputAccessMode = InputAccessMode.ACCESS_INVALID_INPUTS_ONLY;
    let formControl = new FormControl();
    component.formControls = [formControl, new FormControl()];
    formControl.setErrors(["error"]);

    component.ngOnInit();

    expect(component.shouldShow).toBeTruthy();
  });

  it("should component when input access mode is ONLY_INVALID and all form controls are not valid", () => {
    component.inputAccessMode = InputAccessMode.ACCESS_INVALID_INPUTS_ONLY;
    let formControl = new FormControl();
    let otherFormControl = new FormControl();

    component.formControls = [formControl, otherFormControl];
    formControl.setErrors(["error"]);
    otherFormControl.setErrors(["error"]);

    component.ngOnInit();

    expect(component.shouldShow).toBeTruthy();
  });

  it("should not show the component when input access mode is ONLY_INVALID and all form controls are valid", () => {
    component.inputAccessMode = InputAccessMode.ACCESS_INVALID_INPUTS_ONLY;
    component.formControls = [new FormControl(), new FormControl()];

    component.ngOnInit();

    expect(component.shouldShow).toBeFalsy();
  });

  it("should show the component when forceShow is true even if access mode is invalid inputs and there are no invalid inputs", () => {
    component.forceShow = true;
    component.inputAccessMode = InputAccessMode.ACCESS_INVALID_INPUTS_ONLY;
    component.formControls = [new FormControl(), new FormControl()];

    component.ngOnInit();
    expect(component.shouldShow).toBeTruthy();
  });

  it.each([undefined, null, "", []])(
    "should shot the component when accessing empty inputs and at least one form control is empty",
    (emptyValue) => {
      component.inputAccessMode = InputAccessMode.ACCESS_EMPTY_OPTIONAL_INPUTS;
      const emptyFormControl = new FormControl(emptyValue);
      const nonEmptyFormControl = new FormControl("value");
      component.formControls = [emptyFormControl, nonEmptyFormControl];

      component.ngOnInit();

      expect(component.shouldShow).toBeTruthy();
    }
  );
});
