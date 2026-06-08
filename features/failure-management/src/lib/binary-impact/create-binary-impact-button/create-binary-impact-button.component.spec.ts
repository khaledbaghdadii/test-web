import { CreateBinaryImpactButtonComponent } from "./create-binary-impact-button.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CreateBinaryImpactModalComponent } from "../create-binary-impact-modal/create-binary-impact-modal.component";
import { MockComponents } from "ng-mocks";
import { DomTestUtils } from "@mxevolve/testing";
import { Button } from "primeng/button";
import { AppendToBodyDirective } from "../../utils/append-to-body.directive";

const BINARY_IMPACT_ID = "binaryImpactId";
describe("Create binary impact button", () => {
  let fixture: ComponentFixture<CreateBinaryImpactButtonComponent>;
  let component: CreateBinaryImpactButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CreateBinaryImpactButtonComponent,
        MockComponents(CreateBinaryImpactModalComponent),
        Button,
        AppendToBodyDirective,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateBinaryImpactButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe("on binary impact creation started", () => {
    it("should open the creation modal", () => {
      getCreateButtonHarness().click();
      expect(component.isCreateModalVisible).toBeTruthy();
    });

    it("should emit a creation modal opened event", () => {
      jest.spyOn(component.binaryImpactCreationModalOpened, "emit");
      getCreateButtonHarness().click();
      expect(component.binaryImpactCreationModalOpened.emit).toHaveBeenCalled();
    });
  });

  describe("on binary impact creation cancelled", () => {
    it("should close the creation modal", () => {
      component.isCreateModalVisible = true;
      emitBinaryImpactCreationCancelledEventFromModal();
      expect(component.isCreateModalVisible).toBeFalsy();
    });

    it("should emit a creation modal closed event", () => {
      jest.spyOn(component.binaryImpactCreationModalClosed, "emit");
      emitBinaryImpactCreationCancelledEventFromModal();
      expect(component.binaryImpactCreationModalClosed.emit).toHaveBeenCalled();
    });
  });

  describe("on binary impact created", () => {
    it("should close the creation modal", () => {
      component.isCreateModalVisible = true;
      emitBinaryImpactCreatedEventFromModal();
      expect(component.isCreateModalVisible).toBeFalsy();
    });

    it("should emit a binary impact created event with the correct id", () => {
      jest.spyOn(component.binaryImpactCreated, "emit");
      emitBinaryImpactCreatedEventFromModal();
      expect(component.binaryImpactCreated.emit).toHaveBeenCalledWith({
        id: BINARY_IMPACT_ID,
      });
    });
  });

  function emitBinaryImpactCreatedEventFromModal() {
    getModalComponent().binaryImpactCreated.emit({
      id: BINARY_IMPACT_ID,
    });
  }

  function emitBinaryImpactCreationCancelledEventFromModal() {
    getModalComponent().createBinaryImpactCancelled.emit();
  }

  function getModalComponent(): CreateBinaryImpactModalComponent {
    return DomTestUtils.getElementByType(
      fixture,
      CreateBinaryImpactModalComponent
    ).getInstance();
  }

  function getCreateButtonHarness() {
    return DomTestUtils.getButtonByTestId(
      fixture,
      "create-binary-impact-button"
    );
  }
});
