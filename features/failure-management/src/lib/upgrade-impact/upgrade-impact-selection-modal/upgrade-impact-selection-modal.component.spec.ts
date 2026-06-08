import { UpgradeImpactSelectionModalComponent } from "./upgrade-impact-selection-modal.component";
import { ToastMessageService } from "@mxflow/ui/alert";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { Dialog, DialogModule } from "primeng/dialog";
import { UpgradeImpactSelectionTableComponent } from "../upgrade-impact-selection-table/upgrade-impact-selection-table.component";
import { By } from "@angular/platform-browser";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { Message, MessageModule } from "primeng/message";
import { FormsModule } from "@angular/forms";
import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import {
  ShowDetectionWithNoDefectsToggleComponent,
  ValidationScopeSetterComponent,
} from "@mxflow/features/validation-management";
import { Tooltip } from "primeng/tooltip";
import { DomTestUtils } from "@mxevolve/testing";
import { Type } from "@angular/core";
import { ToggleSwitch, ToggleSwitchModule } from "primeng/toggleswitch";

const UPGRADE_IMPACT_ID = "id";
const validationScope = {
  currentVersion: "currentVersion",
  referenceVersion: "referenceVersion",
};

describe("UpgradeImpactSelectionModalComponent", () => {
  let toastMessageService: ToastMessageService;
  let fixture: MockedComponentFixture<UpgradeImpactSelectionModalComponent>;
  let component: UpgradeImpactSelectionModalComponent;

  beforeEach(async () => {
    toastMessageService = {
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    await MockBuilder(UpgradeImpactSelectionModalComponent)
      .keep(DialogModule)
      .keep(ButtonModule)
      .keep(CommonModule)
      .keep(MessageModule)
      .keep(ToggleSwitchModule)
      .mock(ToggleSwitch)
      .mock(ShowDetectionWithNoDefectsToggleComponent)
      .keep(FormsModule)
      .keep(Tooltip)
      .provide(provideNoopAnimations())
      .mock(ToastMessageService, toastMessageService)
      .mock(ValidationScopeSetterComponent)
      .mock(UpgradeImpactSelectionTableComponent);

    fixture = MockRender(UpgradeImpactSelectionModalComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it("should update validation scope when validation scope setter changes it", () => {
    component.isVisible = true;
    expect(component.validationScope()).toBeFalsy();
    getComponent(ValidationScopeSetterComponent).validationScopeChange.emit(
      validationScope
    );
    expect(component.validationScope()).toEqual(validationScope);
  });

  it("should show the validation scope input", () => {
    component.isVisible = true;
    expect(getComponent(ValidationScopeSetterComponent)).toBeTruthy();
  });

  it("should default show impacts with no defects to false", () => {
    expect(component.showUpgradeImpactsWithoutDefects()).toBe(false);
  });

  describe("selectedUpgradeImpactId", () => {
    it("should select impact correctly", () => {
      component.selectUpgradeImpactId(UPGRADE_IMPACT_ID);
      expect(component.selectedUpgradeImpactId).toEqual(UPGRADE_IMPACT_ID);
    });

    it("should call select impact method on upgrade impact selection change", () => {
      const handlerSpy = jest.spyOn(component, "selectUpgradeImpactId");
      component.isVisible = true;

      getComponent(
        UpgradeImpactSelectionTableComponent
      ).selectedUpgradeImpactIdChange.emit(UPGRADE_IMPACT_ID);
      fixture.detectChanges();

      expect(handlerSpy).toHaveBeenCalledWith(UPGRADE_IMPACT_ID);
    });
  });

  describe("hiding the modal", () => {
    it("should hide modal correctly", () => {
      const emitSpy = jest.spyOn(component.isVisibleChange, "emit");
      component.isVisible = true;
      getComponent(Dialog).onHide.emit();
      expect(component.isVisible).toEqual(false);
      expect(emitSpy).toHaveBeenCalledWith(false);
    });

    it("should reset the selected upgrade impact id on hide", () => {
      component.selectedUpgradeImpactId = UPGRADE_IMPACT_ID;
      component.isVisible = true;
      component.selectedUpgradeImpactId = "another-id";
      getComponent(Dialog).onHide.emit();
      expect(component.selectedUpgradeImpactId).toEqual(UPGRADE_IMPACT_ID);
    });

    it("should call hide modal on dialog hide", () => {
      const handlerSpy = jest.spyOn(component, "handleCancel");
      component.isVisible = true;
      getComponent(Dialog).onHide.emit();
      expect(handlerSpy).toHaveBeenCalled();
    });

    it("should set warning message to undefined when modal is hidden", () => {
      component.isVisible = true;
      component.warningMessage = "warning";
      fixture.detectChanges();
      const emitSpy = jest.spyOn(component.isVisibleChange, "emit");
      getComponent(Dialog).onHide.emit();
      expect(component.warningMessage).toBeUndefined();
      expect(emitSpy).toHaveBeenCalledWith(false);
    });
  });

  describe("clicking on cancel button", () => {
    it("should reset selected upgrade impact id on cancel", () => {
      component.selectedUpgradeImpactId = UPGRADE_IMPACT_ID;
      component.isVisible = true;
      component.selectedUpgradeImpactId = "another-id";
      getButtonHarness("cancel-button").click();
      expect(component.selectedUpgradeImpactId).toEqual(UPGRADE_IMPACT_ID);
    });

    it("should call handle cancel modal when user clicks the cancel btn", () => {
      const handlerSpy = jest.spyOn(component, "handleCancel");
      component.isVisible = true;
      getButtonHarness("cancel-button").click();
      expect(handlerSpy).toHaveBeenCalled();
    });
  });

  describe("submit", () => {
    it("should hide modal on submit", () => {
      const emitSpy = jest.spyOn(component.isVisibleChange, "emit");
      component.isVisible = true;
      component.submit();
      expect(component.isVisible).toEqual(false);
      expect(emitSpy).toHaveBeenCalledWith(false);
    });

    it("should emit selected upgrade impact on submit", () => {
      const emitSpy = jest.spyOn(
        component.selectedUpgradeImpactIdChange,
        "emit"
      );
      component.selectedUpgradeImpactId = UPGRADE_IMPACT_ID;

      component.submit();

      expect(emitSpy).toHaveBeenCalledWith(UPGRADE_IMPACT_ID);
    });

    it("should call submit method when user submits their selection", () => {
      const handlerSpy = jest.spyOn(component, "submit");
      component.isVisible = true;
      component.selectedUpgradeImpactId = UPGRADE_IMPACT_ID;
      getButtonHarness("submit-button").click();
      expect(handlerSpy).toHaveBeenCalled();
    });

    it("should update the initial selection to the new selection on submit", () => {
      component.isVisible = true;
      component.selectedUpgradeImpactId = UPGRADE_IMPACT_ID;
      getButtonHarness("submit-button").click();
      getComponent(Dialog).onHide.emit();
      component.isVisible = true;
      expect(component.selectedUpgradeImpactId).toEqual(UPGRADE_IMPACT_ID);
    });
  });

  describe("handleErrorOccurred", () => {
    it("handleErrorOcurred should add error message", () => {
      const message = "Error";

      component.handleErrorOccurred(message);

      expect(toastMessageService.showError).toHaveBeenCalledWith(message);
    });

    it("should call handler error method when upgrade impact table throws an error", () => {
      const handlerSpy = jest.spyOn(component, "handleErrorOccurred");
      const message = "Error";
      component.isVisible = true;

      getComponent(UpgradeImpactSelectionTableComponent).errorMessage.emit(
        message
      );
      fixture.detectChanges();

      expect(handlerSpy).toHaveBeenCalledWith(message);
    });
  });

  describe("isVisible", () => {
    it("should make the modal visible when true", () => {
      component.isVisible = true;
      expect(getComponent(Dialog).visible).toBeTruthy();
    });
  });

  describe("handling warning message", () => {
    it.each(["warning", undefined])(
      "should display warning message in the modal",
      (warningMessage?: string) => {
        component.handleWarningMessage(warningMessage);
        expect(component.warningMessage).toEqual(warningMessage);
      }
    );

    it("should call handleWarningMessage on emitted warning messages", () => {
      const handlerSpy = jest.spyOn(component, "handleWarningMessage");
      const message = "warning";
      component.isVisible = true;

      getComponent(UpgradeImpactSelectionTableComponent).warningMessage.emit(
        message
      );
      fixture.detectChanges();

      expect(handlerSpy).toHaveBeenCalledWith(message);
    });

    it("should display a message in the modal", () => {
      component.isVisible = true;
      fixture.detectChanges();
      component.handleWarningMessage("warningMessage");
      fixture.detectChanges();
      const message = getComponent(Message);
      expect(message.severity).toEqual("warn");
      expect(message.el.nativeElement.textContent).toContain("warningMessage");
    });

    it("should not call handleWarningMessage if warning message input is falsy", () => {
      const handlerSpy = jest.spyOn(component, "handleWarningMessage");
      component.warningMessage = undefined;
      expect(handlerSpy).not.toHaveBeenCalled();
    });
  });

  describe("handleRefresh", () => {
    it("should call the table's fetch upgrade impacts method", () => {
      component.isVisible = true;

      const fetchUpgradeImpactSpy = jest.spyOn(
        getComponent(UpgradeImpactSelectionTableComponent),
        "fetchUpgradeImpacts"
      );
      fixture.detectChanges();
      component.handleRefresh();
      expect(fetchUpgradeImpactSpy).toHaveBeenCalled();
    });

    it("should call handleRefresh when refresh button is clicked", () => {
      component.isVisible = true;
      const handlerSpy = jest.spyOn(component, "handleRefresh");
      getButtonHarness("refresh-button").click();
      expect(handlerSpy).toHaveBeenCalled();
    });
  });

  describe("hiding upgrade selection capability", () => {
    it("should set the hideSelection input of the upgrade impacts table", () => {
      component.isVisible = true;
      component.hideSelection = true;
      expect(
        getComponent(UpgradeImpactSelectionTableComponent).hideSelection
      ).toBeTruthy();
    });

    it("should not display the modal's submit button if hideSelection is enabled", () => {
      component.isVisible = true;
      component.hideSelection = true;
      fixture.detectChanges();
      const submitButton = fixture.debugElement.query(
        By.css('[data-testid="submit-button"]')
      );
      expect(submitButton).toBeFalsy();
    });

    it("should not display the modal's cancel button if hideSelection is enabled", () => {
      component.isVisible = true;
      component.hideSelection = true;
      fixture.detectChanges();
      const cancelButton = fixture.debugElement.query(
        By.css('[data-testid="cancel-button"]')
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
