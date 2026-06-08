import { CreateBinaryRegressionButtonComponent } from "./create-binary-regression-button.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CreateBinaryRegressionModalComponent } from "../create-binary-regression-modal/create-binary-regression-modal.component";
import { MockComponents } from "ng-mocks";
import { Button } from "primeng/button";
import { DomTestUtils } from "@mxevolve/testing";

const BINARY_REGRESSION_ID = "binaryRegressionId";
describe("Create binary regression button", () => {
  let fixture: ComponentFixture<CreateBinaryRegressionButtonComponent>;
  let component: CreateBinaryRegressionButtonComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CreateBinaryRegressionButtonComponent,
        MockComponents(CreateBinaryRegressionModalComponent),
        Button,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateBinaryRegressionButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe("on binary regression creation started", () => {
    it("should open the creation modal", () => {
      getCreateButtonHarness().click();
      expect(component.isCreateModalVisible).toBeTruthy();
    });

    it("should emit a creation modal opened event", () => {
      jest.spyOn(component.binaryRegressionCreationModalOpened, "emit");
      getCreateButtonHarness().click();
      expect(
        component.binaryRegressionCreationModalOpened.emit
      ).toHaveBeenCalled();
    });
  });

  describe("on binary regression creation cancelled", () => {
    it("should close the creation modal", () => {
      component.isCreateModalVisible = true;
      emitBinaryRegressionCreationCancelledEventFromModal();
      expect(component.isCreateModalVisible).toBeFalsy();
    });

    it("should emit a creation modal closed event", () => {
      jest.spyOn(component.binaryRegressionCreationModalClosed, "emit");
      emitBinaryRegressionCreationCancelledEventFromModal();
      expect(
        component.binaryRegressionCreationModalClosed.emit
      ).toHaveBeenCalled();
    });
  });

  describe("on binary regression created", () => {
    it("should close the creation modal", () => {
      component.isCreateModalVisible = true;
      emitBinaryRegressionCreatedEventFromModal();
      expect(component.isCreateModalVisible).toBeFalsy();
    });

    it("should emit a binary regression created event with the correct id", () => {
      jest.spyOn(component.binaryRegressionCreated, "emit");
      emitBinaryRegressionCreatedEventFromModal();
      expect(component.binaryRegressionCreated.emit).toHaveBeenCalledWith(
        BINARY_REGRESSION_ID
      );
    });
  });

  function emitBinaryRegressionCreatedEventFromModal() {
    getModalComponent().binaryRegressionCreated.emit(BINARY_REGRESSION_ID);
  }

  function emitBinaryRegressionCreationCancelledEventFromModal() {
    getModalComponent().createBinaryRegressionCancelled.emit();
  }

  function getModalComponent(): CreateBinaryRegressionModalComponent {
    return DomTestUtils.getElementByType(
      fixture,
      CreateBinaryRegressionModalComponent
    ).getInstance();
  }

  function getCreateButtonHarness() {
    return DomTestUtils.getButtonByTestId(
      fixture,
      "create-binary-regression-button"
    );
  }
});
