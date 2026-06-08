import { CreateConfigurationRegressionButtonComponent } from "./create-configuration-regression-button.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Button } from "primeng/button";
import { CreateConfigurationRegressionModalComponent } from "../create-configuration-regression-modal/create-configuration-regression-modal.component";
import { AppendToBodyDirective } from "../../utils/append-to-body.directive";
import { MockComponents } from "ng-mocks";
import { DomTestUtils } from "@mxevolve/testing";

const CONFIGURATION_REGRESSION_ID = "configurationRegressionId";
describe("Create configuration regression button", () => {
  let fixture: ComponentFixture<CreateConfigurationRegressionButtonComponent>;
  let component: CreateConfigurationRegressionButtonComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CreateConfigurationRegressionButtonComponent,
        Button,
        MockComponents(CreateConfigurationRegressionModalComponent),
        AppendToBodyDirective,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      CreateConfigurationRegressionButtonComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe("on configuration regression creation started", () => {
    it("should open the creation modal", () => {
      getCreateButtonHarness().click();
      expect(component.isCreateModalVisible).toBeTruthy();
    });

    it("should emit a creation modal opened event", () => {
      jest.spyOn(component.configurationRegressionCreationModalOpened, "emit");
      getCreateButtonHarness().click();
      expect(
        component.configurationRegressionCreationModalOpened.emit
      ).toHaveBeenCalled();
    });
  });

  describe("on configuration regression creation cancelled", () => {
    it("should close the creation modal", () => {
      component.isCreateModalVisible = true;
      emitConfigurationRegressionCreationCancelledEventFromModal();
      expect(component.isCreateModalVisible).toBeFalsy();
    });

    it("should emit a creation modal closed event", () => {
      jest.spyOn(component.configurationRegressionCreationModalClosed, "emit");
      emitConfigurationRegressionCreationCancelledEventFromModal();
      expect(
        component.configurationRegressionCreationModalClosed.emit
      ).toHaveBeenCalled();
    });
  });

  describe("on configuration regression created", () => {
    it("should close the creation modal", () => {
      component.isCreateModalVisible = true;
      emitConfigurationRegressionCreatedEventFromModal();
      expect(component.isCreateModalVisible).toBeFalsy();
    });

    it("should emit a configuration regression created event with the correct id", () => {
      jest.spyOn(component.configurationRegressionCreated, "emit");
      emitConfigurationRegressionCreatedEventFromModal();
      expect(
        component.configurationRegressionCreated.emit
      ).toHaveBeenCalledWith({
        id: CONFIGURATION_REGRESSION_ID,
      });
    });
  });

  function emitConfigurationRegressionCreatedEventFromModal() {
    getModalComponent().configurationRegressionCreated.emit({
      id: CONFIGURATION_REGRESSION_ID,
    });
  }

  function emitConfigurationRegressionCreationCancelledEventFromModal() {
    getModalComponent().createConfigurationRegressionCancelled.emit();
  }

  function getModalComponent(): CreateConfigurationRegressionModalComponent {
    return DomTestUtils.getElementByType(
      fixture,
      CreateConfigurationRegressionModalComponent
    ).getInstance();
  }

  function getCreateButtonHarness() {
    return DomTestUtils.getButtonByTestId(
      fixture,
      "create-configuration-regression-button"
    );
  }
});
