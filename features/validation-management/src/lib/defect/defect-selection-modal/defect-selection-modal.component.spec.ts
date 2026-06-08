import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { Dialog, DialogModule } from "primeng/dialog";
import { By } from "@angular/platform-browser";
import { Message, MessageModule } from "primeng/message";
import { CommonModule } from "@angular/common";
import { DefectSelectionTableComponent } from "../defect-selection-table/defect-selection-table.component";
import { Defect } from "../model/defect.model";
import { ButtonModule } from "primeng/button";
import { DefectSelectionModalComponent } from "./defect-selection-modal.component";
import { ValidationScope } from "../../validation-scope/model/validation-scope.model";
import { MockComponents } from "ng-mocks";
import { ValidationScopeSetterComponent } from "../../validation-scope/validation-scope-setter/validation-scope-setter.component";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { SharedModule } from "primeng/api";
import { DomTestUtils } from "@mxevolve/testing";
import { Type } from "@angular/core";

const VALIDATION_SCOPE: ValidationScope = {
  currentVersion: "currentVersion",
  referenceVersion: "referenceVersion",
};
const WARNING_MESSAGE = "warning";

const DEFECT: Defect = {
  id: "defect1",
  link: "/defect1",
  title: "Defect 1",
  description: "description1",
  submissionDate: new Date(),
  developer: "3amo sami",
};

describe("DefectSelectionModalComponent", () => {
  let component: DefectSelectionModalComponent;
  let fixture: ComponentFixture<DefectSelectionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefectSelectionModalComponent],
      providers: [provideAnimationsAsync("noop")],
    })
      .overrideComponent(DefectSelectionModalComponent, {
        set: {
          imports: [
            ButtonModule,
            DialogModule,
            MessageModule,
            MockComponents(
              DefectSelectionTableComponent,
              ValidationScopeSetterComponent
            ),
            CommonModule,
            SharedModule,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DefectSelectionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show the validation scope input", () => {
    component.isVisible.set(true);
    expect(getComponent(ValidationScopeSetterComponent)).toBeTruthy();
  });

  describe("inputs", () => {
    it("should initialize is visible input to false", () => {
      expect(component.isVisible()).toBeFalsy();
    });

    it("should set isVisible on input change", () => {
      fixture.componentRef.setInput("isVisible", true);
      expect(component.isVisible()).toBeTruthy();
    });

    it("should set dialog visibility to true when isVisible", () => {
      fixture.componentRef.setInput("isVisible", true);
      expect(getComponent(Dialog).visible).toBeTruthy();
    });

    it("should show the warning message if modal is visible", fakeAsync(() => {
      const handlerSpy = jest.spyOn(component, "handleWarningMessage");
      fixture.componentRef.setInput("warningMessage", WARNING_MESSAGE);
      fixture.componentRef.setInput("isVisible", true);
      fixture.detectChanges();
      tick();
      expect(handlerSpy).toHaveBeenCalledWith(WARNING_MESSAGE);
    }));

    it("should not show the warning message if modal is not visible", fakeAsync(() => {
      const handlerSpy = jest.spyOn(component, "handleWarningMessage");
      fixture.componentRef.setInput("warningMessage", "warning");
      tick();
      expect(handlerSpy).not.toHaveBeenCalled();
    }));

    it("should not show the warning message if modal is visible but warning message is undefined", fakeAsync(() => {
      const handlerSpy = jest.spyOn(component, "handleWarningMessage");
      fixture.componentRef.setInput("isVisible", true);
      tick();
      expect(handlerSpy).not.toHaveBeenCalled();
    }));

    it("should set validationScope on input change", () => {
      expect(component.validationScope()).toBeUndefined();
      fixture.componentRef.setInput("validationScope", VALIDATION_SCOPE);
      expect(component.validationScope()).toEqual(VALIDATION_SCOPE);
    });

    it("should update validation scope when validation scope setter changes it", () => {
      component.isVisible.set(true);
      fixture.detectChanges();
      expect(component.validationScope()).toBeUndefined();
      getComponent(ValidationScopeSetterComponent).validationScopeChange.emit(
        VALIDATION_SCOPE
      );
      expect(component.validationScope()).toEqual(VALIDATION_SCOPE);
    });

    it("should set the warningMessage input on change", () => {
      expect(component.warningMessage()).toBeUndefined();
      fixture.componentRef.setInput("warningMessage", "warning");
      expect(component.warningMessage()).toEqual("warning");
    });
  });

  describe("handleErrorMessage", () => {
    it("should emit error message", () => {
      const emitSpy = jest.spyOn(component.errorMessage, "emit");
      component.handleErrorMessage("error");
      expect(emitSpy).toHaveBeenCalledWith("error");
    });

    it("should call handleErrorMessage on table error message change", () => {
      const handlerSpy = jest.spyOn(component, "handleErrorMessage");
      fixture.componentRef.setInput("isVisible", true);
      const event = "error";

      getComponent(DefectSelectionTableComponent).errorMessageChange.emit(
        event
      );
      fixture.detectChanges();

      expect(handlerSpy).toHaveBeenCalledWith(event);
    });
  });

  describe("handleWarningMessage", () => {
    it.each([WARNING_MESSAGE, undefined])(
      "should set the warning message",
      (warningMessage?: string) => {
        component.handleWarningMessage(warningMessage);
        expect(component.warningMessageBanner).toEqual(warningMessage);
      }
    );

    it("should call handleWarningMessage on table warning message change", () => {
      const handlerSpy = jest.spyOn(component, "handleWarningMessage");
      fixture.componentRef.setInput("isVisible", true);
      const event = "warning";

      getComponent(DefectSelectionTableComponent).warningMessageChange.emit(
        event
      );
      fixture.detectChanges();

      expect(handlerSpy).toHaveBeenCalledWith(event);
    });

    it("should display a message in the modal", () => {
      fixture.componentRef.setInput("isVisible", true);
      fixture.detectChanges();
      component.handleWarningMessage("warningMessage");
      const message = getComponent(Message);
      expect(message.severity).toEqual("warn");
      expect(message.el.nativeElement.innerHTML).toContain("warningMessage");
    });
  });

  describe("onSelect", () => {
    it("should emit the selected defect id", () => {
      const emitSpy = jest.spyOn(component.defectSelectedChange, "emit");
      component.defectSelected = DEFECT;
      component.onSelect();
      expect(emitSpy).toHaveBeenCalledWith(DEFECT.id);
    });

    it("should emit the selected defect id on submit", () => {
      fixture.componentRef.setInput("isVisible", true);
      fixture.detectChanges();
      component.defectSelected = DEFECT;
      fixture.detectChanges();
      const selectSpy = jest.spyOn(component, "onSelect");
      getButtonHarness("select-button").click();
      expect(selectSpy).toHaveBeenCalled();
    });

    it("should hide the modal on submit", () => {
      fixture.componentRef.setInput("isVisible", true);
      component.defectSelected = DEFECT;
      component.onSelect();
      expect(component.isVisible()).toBeFalsy();
    });

    it("should disable submit button when no defect is selected", () => {
      fixture.componentRef.setInput("isVisible", true);
      fixture.detectChanges();
      const selectButton = fixture.debugElement.query(
        By.css('[data-testId="select-button"]')
      ).componentInstance;
      expect(selectButton.disabled).toBeTruthy();
    });
  });

  describe("selectDefect", () => {
    it("should call selectDefect when defect is selected", () => {
      const handlerSpy = jest.spyOn(component, "selectDefect");
      fixture.componentRef.setInput("isVisible", true);

      getComponent(DefectSelectionTableComponent).selectedDefectChange.emit(
        DEFECT
      );
      fixture.detectChanges();

      expect(handlerSpy).toHaveBeenCalledWith(DEFECT);
    });

    it("should set defectSelected when defect is selected", () => {
      component.selectDefect(DEFECT);
      expect(component.defectSelected).toEqual(DEFECT);
    });
  });

  describe("hideModal", () => {
    it("should call hideModal on cancel", () => {
      const hideSpy = jest.spyOn(component, "hideModal");
      fixture.componentRef.setInput("isVisible", true);
      fixture.detectChanges();
      getButtonHarness("cancel-button").click();
      expect(hideSpy).toHaveBeenCalled();
    });

    it("should set isVisible to false on hideModal", () => {
      component.isVisible.set(true);
      component.hideModal();
      expect(component.isVisible()).toBeFalsy();
    });

    it("should make the dialog invisible", () => {
      fixture.componentRef.setInput("isVisible", true);
      fixture.detectChanges();
      component.hideModal();
      expect(getComponent(Dialog).visible).toBeFalsy();
    });

    it("should reset the warning message on hideModal", () => {
      component.isVisible.set(true);
      component.warningMessage.set(WARNING_MESSAGE);
      component.hideModal();
      expect(component.warningMessage()).toBeUndefined();
    });

    it("should reset the warning message banner on hideModal", () => {
      component.isVisible.set(true);
      component.warningMessageBanner = WARNING_MESSAGE;
      component.hideModal();
      expect(component.warningMessageBanner).toEqual("");
    });
  });

  describe("hiding defect selection capability", () => {
    it("should set the hideSelection input of the defects table", () => {
      component.isVisible.set(true);
      fixture.componentRef.setInput("hideSelection", true);
      expect(
        getComponent(DefectSelectionTableComponent).hideSelection
      ).toBeTruthy();
    });

    it("should not display the modal's select button if hideSelection is enabled", () => {
      component.isVisible.set(true);
      fixture.componentRef.setInput("hideSelection", true);
      fixture.detectChanges();
      const selectButton = fixture.debugElement.query(
        By.css('[data-testId="select-button"]')
      );
      expect(selectButton).toBeFalsy();
    });

    it("should not display the modal's cancel button if hideSelection is enabled", () => {
      component.isVisible.set(true);
      fixture.componentRef.setInput("hideSelection", true);
      fixture.detectChanges();
      const cancelButton = fixture.debugElement.query(
        By.css('[data-testId="cancel-button"]')
      );
      expect(cancelButton).toBeFalsy();
    });
  });

  function getButtonHarness(testId: string) {
    return DomTestUtils.getButtonByTestId(fixture, testId);
  }

  function getComponent<S>(type: Type<S>) {
    return DomTestUtils.getElementByType(fixture, type).getInstance();
  }
});
