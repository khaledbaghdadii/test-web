import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ValidationScopeSetterComponent } from "./validation-scope-setter.component";
import { ReactiveFormsModule } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { ValidationScope } from "../model/validation-scope.model";
import { MenuItemCommandEvent } from "primeng/api";
import { SplitButton, SplitButtonModule } from "primeng/splitbutton";
import { MockBuilder } from "ng-mocks";

const targetVersion = "1.0.0";
const targetVersion2 = "1.5.0";
const sourceVersion = "2.0.0";
const sourceVersion2 = "2.5.0";

describe("ValidationScopeSetterComponent", () => {
  let component: ValidationScopeSetterComponent;
  let fixture: ComponentFixture<ValidationScopeSetterComponent>;

  beforeEach(async () => {
    await MockBuilder(ValidationScopeSetterComponent)
      .keep(SplitButtonModule)
      .keep(ReactiveFormsModule);

    fixture = TestBed.createComponent(ValidationScopeSetterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("validation scope input change", () => {
    it("should set the form values to null if no validation scope is passed", () => {
      component.validationScope = undefined;
      fixture.detectChanges();
      const targetVersionControl =
        component.validationScopeSetterForm.get("targetVersion");
      const sourceVersionControl =
        component.validationScopeSetterForm.get("sourceVersion");
      expect(targetVersionControl?.value).toBeNull();
      expect(sourceVersionControl?.value).toBeNull();
    });

    it("should set form values to null if currentVersion is not passed", () => {
      component.validationScope = {
        referenceVersion: sourceVersion,
      };
      fixture.detectChanges();
      const targetVersionControl =
        component.validationScopeSetterForm.get("targetVersion");
      const sourceVersionControl =
        component.validationScopeSetterForm.get("sourceVersion");
      expect(targetVersionControl?.value).toBeNull();
      expect(sourceVersionControl?.value).toBeNull();
    });

    it("should set form values to null if referenceVersion is not passed", () => {
      component.validationScope = {
        currentVersion: targetVersion,
      };
      fixture.detectChanges();
      const targetVersionControl =
        component.validationScopeSetterForm.get("targetVersion");
      const sourceVersionControl =
        component.validationScopeSetterForm.get("sourceVersion");
      expect(targetVersionControl?.value).toBeNull();
      expect(sourceVersionControl?.value).toBeNull();
    });

    it("should update the target version form value", () => {
      component.validationScope = {
        currentVersion: targetVersion2,
        referenceVersion: sourceVersion,
      };
      fixture.detectChanges();
      const targetVersionControl =
        component.validationScopeSetterForm.get("targetVersion");
      expect(targetVersionControl?.value).toBe(targetVersion2);
    });

    it("should set the target version form value to null if not provided", () => {
      component.validationScope = {
        currentVersion: undefined,
        referenceVersion: sourceVersion,
      };
      fixture.detectChanges();
      const targetVersionControl =
        component.validationScopeSetterForm.get("targetVersion");
      expect(targetVersionControl?.value).toBeNull();
    });

    it("should update the source version value", () => {
      component.validationScope = {
        currentVersion: targetVersion,
        referenceVersion: sourceVersion2,
      };
      fixture.detectChanges();
      const sourceVersionControl =
        component.validationScopeSetterForm.get("sourceVersion");
      expect(sourceVersionControl?.value).toBe(sourceVersion2);
    });

    it("should set the source version form value to null if not provided", () => {
      component.validationScope = {
        currentVersion: targetVersion,
        referenceVersion: undefined,
      };
      fixture.detectChanges();
      const sourceVersionControl =
        component.validationScopeSetterForm.get("sourceVersion");
      expect(sourceVersionControl?.value).toBeNull();
    });
  });

  describe("validation setter form initialization", () => {
    it("should set the targetVersion control to null initially", () => {
      const targetVersionControl =
        component.validationScopeSetterForm.get("targetVersion");
      expect(targetVersionControl?.value).toBeNull();
    });

    it("should set the sourceVersion control to null initially", () => {
      const sourceVersionControl =
        component.validationScopeSetterForm.get("sourceVersion");
      expect(sourceVersionControl?.value).toBeNull();
    });

    it("should not allow white spaces for targetVersion", () => {
      const targetVersionControl =
        component.validationScopeSetterForm.get("targetVersion");
      targetVersionControl?.setValue("   ");
      expect(targetVersionControl?.valid).toBe(false);
    });

    it("should not allow white spaces for sourceVersion", () => {
      const sourceVersionControl =
        component.validationScopeSetterForm.get("sourceVersion");
      sourceVersionControl?.setValue("   ");
      expect(sourceVersionControl?.valid).toBe(false);
    });

    it("should show whitespace error message when targetVersion is whitespace only", () => {
      const targetVersionControl =
        component.validationScopeSetterForm.get("targetVersion");
      const sourceVersionControl =
        component.validationScopeSetterForm.get("sourceVersion");
      sourceVersionControl?.setValue(sourceVersion);
      targetVersionControl?.setValue("  ");
      targetVersionControl?.markAsDirty();
      fixture.detectChanges();

      const errorMessage = fixture.debugElement.query(
        By.css("[data-testid='control-error-tip']")
      );
      expect(errorMessage.nativeElement.textContent).toContain(
        "Field cannot be blank"
      );
    });

    it("should show whitespace error message when sourceVersion is whitespace only", () => {
      const targetVersionControl =
        component.validationScopeSetterForm.get("targetVersion");
      const sourceVersionControl =
        component.validationScopeSetterForm.get("sourceVersion");
      targetVersionControl?.setValue(targetVersion);
      sourceVersionControl?.setValue("  ");
      sourceVersionControl?.markAsDirty();
      fixture.detectChanges();

      const errorMessage = fixture.debugElement.query(
        By.css("[data-testid='control-error-tip']")
      );
      expect(errorMessage.nativeElement.textContent).toContain(
        "Field cannot be blank"
      );
    });

    it.each([
      [targetVersion, null],
      [null, sourceVersion],
    ])(
      "should show error message when only one of targetVersion or sourceVersion is filled",
      (targetVersion, sourceVersion) => {
        const targetVersionControl =
          component.validationScopeSetterForm.get("targetVersion");
        const sourceVersionControl =
          component.validationScopeSetterForm.get("sourceVersion");
        targetVersionControl?.setValue(targetVersion);
        sourceVersionControl?.setValue(sourceVersion);
        fixture.detectChanges();

        const errorMessage = fixture.debugElement.query(By.css("small"));
        expect(errorMessage.nativeElement.textContent).toContain(
          "Both 'From Version' and 'To Version' must be filled in together"
        );
      }
    );

    it("should set the form as valid if both targetVersion and sourceVersion are filled", () => {
      const targetVersionControl =
        component.validationScopeSetterForm.get("targetVersion");
      const sourceVersionControl =
        component.validationScopeSetterForm.get("sourceVersion");
      targetVersionControl?.setValue(targetVersion);
      sourceVersionControl?.setValue(sourceVersion);
      fixture.detectChanges();

      expect(component.validationScopeSetterForm.valid).toBe(true);
    });

    it("should set the form as valid if the form is empty", () => {
      const targetVersionControl =
        component.validationScopeSetterForm.get("targetVersion");
      const sourceVersionControl =
        component.validationScopeSetterForm.get("sourceVersion");
      targetVersionControl?.setValue(null);
      sourceVersionControl?.setValue(null);
      fixture.detectChanges();

      expect(component.validationScopeSetterForm.valid).toBe(true);
    });

    it("should set the form as invalid if only targetVersion is filled", () => {
      const targetVersionControl =
        component.validationScopeSetterForm.get("targetVersion");
      const sourceVersionControl =
        component.validationScopeSetterForm.get("sourceVersion");
      targetVersionControl?.setValue(targetVersion);
      sourceVersionControl?.setValue(null);
      fixture.detectChanges();
      expect(component.validationScopeSetterForm.valid).toBe(false);
    });

    it("should set the form as invalid if only sourceVersion is filled", () => {
      const targetVersionControl =
        component.validationScopeSetterForm.get("targetVersion");
      const sourceVersionControl =
        component.validationScopeSetterForm.get("sourceVersion");
      targetVersionControl?.setValue(null);
      sourceVersionControl?.setValue(sourceVersion);
      fixture.detectChanges();
      expect(component.validationScopeSetterForm.valid).toBe(false);
    });
  });

  describe("onSubmit", () => {
    it("should emit the new validation scope when form is valid", () => {
      const targetVersionControl =
        component.validationScopeSetterForm.get("targetVersion");
      const sourceVersionControl =
        component.validationScopeSetterForm.get("sourceVersion");
      targetVersionControl?.setValue(targetVersion);
      sourceVersionControl?.setValue(sourceVersion);
      const emitSpy = jest.spyOn(component.validationScopeChange, "emit");
      const expectedValidationScope: ValidationScope = {
        currentVersion: targetVersion,
        referenceVersion: sourceVersion,
      };
      component.onSubmit();

      expect(component.validationScopeSetterForm.valid).toBe(true);
      expect(emitSpy).toHaveBeenCalledWith(expectedValidationScope);
    });

    it("should emit a validation scope with trimmed targetVersion", () => {
      const targetVersionControl =
        component.validationScopeSetterForm.get("targetVersion");
      const sourceVersionControl =
        component.validationScopeSetterForm.get("sourceVersion");
      targetVersionControl?.setValue(targetVersion + "  ");
      sourceVersionControl?.setValue(sourceVersion);
      const emitSpy = jest.spyOn(component.validationScopeChange, "emit");
      const expectedValidationScope: ValidationScope = {
        currentVersion: targetVersion,
        referenceVersion: sourceVersion,
      };
      component.onSubmit();

      expect(emitSpy).toHaveBeenCalledWith(expectedValidationScope);
    });

    it.each([null, ""])(
      "should not emit a validation scope with an undefined targetVersion if not set in the form",
      (emptyTargetVersion: string | null) => {
        const targetVersionControl =
          component.validationScopeSetterForm.get("targetVersion");
        const sourceVersionControl =
          component.validationScopeSetterForm.get("sourceVersion");
        targetVersionControl?.setValue(emptyTargetVersion);
        sourceVersionControl?.setValue(sourceVersion);
        const emitSpy = jest.spyOn(component.validationScopeChange, "emit");
        component.onSubmit();

        expect(component.validationScopeSetterForm.valid).toBe(false);
        expect(emitSpy).not.toHaveBeenCalled();
      }
    );

    it("should emit a validation scope with trimmed sourceVersion", () => {
      const targetVersionControl =
        component.validationScopeSetterForm.get("targetVersion");
      const sourceVersionControl =
        component.validationScopeSetterForm.get("sourceVersion");
      targetVersionControl?.setValue(targetVersion);
      sourceVersionControl?.setValue(sourceVersion + "  ");
      const emitSpy = jest.spyOn(component.validationScopeChange, "emit");
      const expectedValidationScope: ValidationScope = {
        currentVersion: targetVersion,
        referenceVersion: sourceVersion,
      };
      component.onSubmit();

      expect(emitSpy).toHaveBeenCalledWith(expectedValidationScope);
    });

    it.each([null, ""])(
      "should not emit a validation scope with an undefined sourceVersion if not set in the form",
      (emptySourceVersion: string | null) => {
        const targetVersionControl =
          component.validationScopeSetterForm.get("targetVersion");
        const sourceVersionControl =
          component.validationScopeSetterForm.get("sourceVersion");
        targetVersionControl?.setValue(targetVersion);
        sourceVersionControl?.setValue(emptySourceVersion);
        const emitSpy = jest.spyOn(component.validationScopeChange, "emit");
        component.onSubmit();

        expect(component.validationScopeSetterForm.valid).toBe(false);
        expect(emitSpy).not.toHaveBeenCalled();
      }
    );

    it("should not emit the new validation scope when form is invalid", () => {
      const targetVersionControl =
        component.validationScopeSetterForm.get("targetVersion");
      const sourceVersionControl =
        component.validationScopeSetterForm.get("sourceVersion");
      targetVersionControl?.setValue("   ");
      sourceVersionControl?.setValue(sourceVersion);
      const emitSpy = jest.spyOn(component.validationScopeChange, "emit");
      component.onSubmit();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it("should call the submit function when the form is submitted", () => {
      const handlerSpy = jest.spyOn(component, "onSubmit");
      const formElement =
        fixture.debugElement.nativeElement.querySelector("form");
      formElement.dispatchEvent(new Event("submit"));
      fixture.detectChanges();
      expect(handlerSpy).toHaveBeenCalled();
    });
  });

  describe("reset validation scope", () => {
    const mockEvent = {} as MenuItemCommandEvent;

    it("should emit the initial validation scope when reset is called", () => {
      const validationScope = {
        currentVersion: targetVersion,
        referenceVersion: sourceVersion,
      };
      component.initialValidationScope = validationScope;
      const emitSpy = jest.spyOn(component.validationScopeChange, "emit");
      component.showValidationScopeMenuOptions();
      const resetMenuItem = component.validationScopeMenuItems[0];
      resetMenuItem.command!(mockEvent);
      expect(emitSpy).toHaveBeenCalledWith(validationScope);
    });

    it("should set the label of the Reset menu item", () => {
      component.showValidationScopeMenuOptions();
      expect(component.validationScopeMenuItems[0].label).toBe(
        "Reset Validation Scope"
      );
    });

    it("reset button should be disabled when the initial and current validation scope are the same", () => {
      const validationScope = {
        currentVersion: targetVersion,
        referenceVersion: sourceVersion,
      };
      component.initialValidationScope = validationScope;
      component.validationScope = validationScope;
      fixture.detectChanges();
      component.showValidationScopeMenuOptions();
      expect(component.validationScopeMenuItems[0].disabled).toBeTruthy();
    });
  });

  it("should disable the submit button when the form is invalid", () => {
    const targetVersionControl =
      component.validationScopeSetterForm.get("targetVersion");
    targetVersionControl?.setValue("   ");
    fixture.detectChanges();
    const submitButton: SplitButton = fixture.debugElement.query(
      By.directive(SplitButton)
    ).componentInstance;
    expect(submitButton.disabled).toBeTruthy();
  });

  it("should enable the submit button when the form is valid", () => {
    const targetVersionControl =
      component.validationScopeSetterForm.get("targetVersion");
    const sourceVersionControl =
      component.validationScopeSetterForm.get("sourceVersion");
    targetVersionControl?.setValue(targetVersion);
    sourceVersionControl?.setValue(sourceVersion);
    fixture.detectChanges();
    const submitButton: SplitButton = fixture.debugElement.query(
      By.directive(SplitButton)
    ).componentInstance;
    expect(submitButton.disabled).toBeFalsy();
  });
});
