import { CreateConfigurationImpactButtonComponent } from "./create-configuration-impact-button.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Button } from "primeng/button";
import { CreateConfigurationImpactModalComponent } from "../create-configuration-impact-modal/create-configuration-impact-modal.component";
import { AppendToBodyDirective } from "../../utils/append-to-body.directive";
import { MockComponent } from "ng-mocks";
import { DomTestUtils } from "@mxevolve/testing";

const CONFIGURATION_IMPACT_ID = "configurationImpactId";
describe("Create configuration impact button", () => {
  let fixture: ComponentFixture<CreateConfigurationImpactButtonComponent>;
  let component: CreateConfigurationImpactButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CreateConfigurationImpactButtonComponent,
        Button,
        AppendToBodyDirective,
        MockComponent(CreateConfigurationImpactModalComponent),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateConfigurationImpactButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe("on configuration impact creation started", () => {
    it("should open the creation modal", () => {
      getCreateButtonHarness().click();
      expect(component.isCreateModalVisible).toBeTruthy();
    });

    it("should emit a creation modal opened event", () => {
      jest.spyOn(component.configurationImpactCreationModalOpened, "emit");
      getCreateButtonHarness().click();
      expect(
        component.configurationImpactCreationModalOpened.emit
      ).toHaveBeenCalled();
    });
  });

  describe("on configuration impact creation cancelled", () => {
    it("should close the creation modal", () => {
      component.isCreateModalVisible = true;
      emitConfigurationImpactCreationCancelledEventFromModal();
      expect(component.isCreateModalVisible).toBeFalsy();
    });

    it("should emit a creation modal closed event", () => {
      jest.spyOn(component.configurationImpactCreationModalClosed, "emit");
      emitConfigurationImpactCreationCancelledEventFromModal();
      expect(
        component.configurationImpactCreationModalClosed.emit
      ).toHaveBeenCalled();
    });
  });

  describe("on configuration impact created", () => {
    it("should close the creation modal", () => {
      component.isCreateModalVisible = true;
      emitConfigurationImpactCreatedEventFromModal();
      expect(component.isCreateModalVisible).toBeFalsy();
    });

    it("should emit a configuration impact created event with the correct id", () => {
      jest.spyOn(component.configurationImpactCreated, "emit");
      emitConfigurationImpactCreatedEventFromModal();
      expect(component.configurationImpactCreated.emit).toHaveBeenCalledWith({
        id: CONFIGURATION_IMPACT_ID,
      });
    });
  });

  function emitConfigurationImpactCreatedEventFromModal() {
    getModalComponent().configurationImpactCreated.emit({
      id: CONFIGURATION_IMPACT_ID,
    });
  }

  function emitConfigurationImpactCreationCancelledEventFromModal() {
    getModalComponent().createConfigurationImpactCancelled.emit();
  }

  function getModalComponent(): CreateConfigurationImpactModalComponent {
    return DomTestUtils.getElementByType(
      fixture,
      CreateConfigurationImpactModalComponent
    ).getInstance();
  }

  function getCreateButtonHarness() {
    return DomTestUtils.getButtonByTestId(
      fixture,
      "create-configuration-impact-button"
    );
  }
});
