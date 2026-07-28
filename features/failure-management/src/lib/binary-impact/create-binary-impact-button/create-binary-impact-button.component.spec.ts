import { CreateBinaryImpactButtonComponent } from "./create-binary-impact-button.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CreateBinaryImpactModalComponent } from "../create-binary-impact-modal/create-binary-impact-modal.component";
import { UpgradeImpactSelectionModalComponent } from "../../upgrade-impact/upgrade-impact-selection-modal/upgrade-impact-selection-modal.component";
import { MockComponents } from "ng-mocks";
import { DomTestUtils } from "@mxevolve/testing";
import { of, throwError } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";
import { BinaryImpactService } from "../binary-impact.service";
import { AppendToBodyDirective } from "../../utils/append-to-body.directive";

const BINARY_IMPACT_ID = "binaryImpactId";
const PROJECT_ID = "projectId";
const UPGRADE_IMPACT_ID = "upgradeImpactId";
const PREFILL_RESPONSE = {
  description: "Prefilled description",
  attachments: [
    {
      attachmentId: "attachment1",
      name: "attachment1.png",
      type: "image/png",
      downloadLink: "attachment1_link",
    },
  ],
};

describe("Create binary impact button", () => {
  let fixture: ComponentFixture<CreateBinaryImpactButtonComponent>;
  let component: CreateBinaryImpactButtonComponent;
  let toastMessageService: ToastMessageService;
  let binaryImpactService: BinaryImpactService;

  beforeEach(async () => {
    toastMessageService = {
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    binaryImpactService = {
      prepareFromUpgradeImpact: jest.fn(() => of(PREFILL_RESPONSE)),
    } as unknown as BinaryImpactService;

    await TestBed.configureTestingModule({
      imports: [
        CreateBinaryImpactButtonComponent,
        MockComponents(
          CreateBinaryImpactModalComponent,
          UpgradeImpactSelectionModalComponent
        ),
        AppendToBodyDirective,
      ],
    })
      .overrideComponent(CreateBinaryImpactButtonComponent, {
        set: {
          providers: [
            { provide: ToastMessageService, useValue: toastMessageService },
            { provide: BinaryImpactService, useValue: binaryImpactService },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CreateBinaryImpactButtonComponent);
    component = fixture.componentInstance;
    component.projectId = PROJECT_ID;
    fixture.detectChanges();
  });

  describe("clicking the create with upgrade impact button", () => {
    it("should open the upgrade impact selection modal", () => {
      createBinaryImpactWithUpgradeImpact();
      expect(component.isUpgradeImpactSelectionModalVisible).toBeTruthy();
    });
  });

  describe("clicking create without upgrade impact button", () => {
    it("should open the creation modal directly", () => {
      createBinaryImpactWithoutUpgradeImpact();
      expect(component.isCreateModalVisible).toBeTruthy();
    });

    it("should emit a creation modal opened event", () => {
      jest.spyOn(component.binaryImpactCreationModalOpened, "emit");
      createBinaryImpactWithoutUpgradeImpact();
      expect(component.binaryImpactCreationModalOpened.emit).toHaveBeenCalled();
    });
  });

  describe("on upgrade impact selected", () => {
    it("should call the prefill service with the project and selected upgrade impact id", () => {
      component.onUpgradeImpactSelected(UPGRADE_IMPACT_ID);
      expect(binaryImpactService.prepareFromUpgradeImpact).toHaveBeenCalledWith(
        {
          projectId: PROJECT_ID,
          upgradeImpactId: UPGRADE_IMPACT_ID,
        }
      );
    });

    it("should close the upgrade impact selection modal", () => {
      component.isUpgradeImpactSelectionModalVisible = true;
      component.onUpgradeImpactSelected(UPGRADE_IMPACT_ID);
      expect(component.isUpgradeImpactSelectionModalVisible).toBeFalsy();
    });

    it("should prefill the description from the prefill response", () => {
      component.onUpgradeImpactSelected(UPGRADE_IMPACT_ID);
      expect(component.prefillDescription).toEqual(
        PREFILL_RESPONSE.description
      );
    });

    it("should prefill the attachments from the prefill response", () => {
      component.onUpgradeImpactSelected(UPGRADE_IMPACT_ID);
      expect(component.prefillAttachments).toEqual(
        PREFILL_RESPONSE.attachments
      );
    });

    it("should open the creation modal following the selection of an upgrade impact", () => {
      component.onUpgradeImpactSelected(UPGRADE_IMPACT_ID);
      expect(component.isCreateModalVisible).toBeTruthy();
    });

    describe("when no upgrade impact is selected", () => {
      it("should not call the prefill service", () => {
        component.onUpgradeImpactSelected(undefined);
        expect(
          binaryImpactService.prepareFromUpgradeImpact
        ).not.toHaveBeenCalled();
      });

      it("should open the creation modal without any prefill", () => {
        component.onUpgradeImpactSelected(undefined);
        expect(component.isCreateModalVisible).toBeTruthy();
        expect(component.prefillDescription).toBeUndefined();
        expect(component.prefillAttachments).toBeUndefined();
      });
    });

    describe("when the prefill call fails", () => {
      const prefillError = () => new Error("failed");
      beforeEach(() => {
        jest
          .spyOn(binaryImpactService, "prepareFromUpgradeImpact")
          .mockReturnValue(throwError(prefillError));
      });

      it("should show an error message", () => {
        component.onUpgradeImpactSelected(UPGRADE_IMPACT_ID);
        expect(toastMessageService.showError).toHaveBeenCalledWith(
          "Error prefilling upgrade impact:failed"
        );
      });

      it("should still open the creation modal with the selected upgrade impact id", () => {
        component.onUpgradeImpactSelected(UPGRADE_IMPACT_ID);
        expect(component.isCreateModalVisible).toBeTruthy();
        expect(component.prefillUpgradeImpactId).toEqual(UPGRADE_IMPACT_ID);
      });

      it("should leave the description and attachments blank", () => {
        component.onUpgradeImpactSelected(UPGRADE_IMPACT_ID);
        expect(component.prefillDescription).toBeUndefined();
        expect(component.prefillAttachments).toBeUndefined();
      });
    });

    it("should set the prefill inputs on the create modal before toggling its visibility", () => {
      const modalInstance = getModalComponent();
      const setOrder: string[] = [];
      Object.defineProperty(modalInstance, "initialDescription", {
        configurable: true,
        set: () => setOrder.push("initialDescription"),
      });
      Object.defineProperty(modalInstance, "isVisible", {
        configurable: true,
        set: () => setOrder.push("isVisible"),
      });

      component.onUpgradeImpactSelected(UPGRADE_IMPACT_ID);
      fixture.detectChanges();

      expect(setOrder.indexOf("initialDescription")).toBeLessThan(
        setOrder.indexOf("isVisible")
      );
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

    it("should reset the prefilled upgrade impact id", () => {
      component.onUpgradeImpactSelected(UPGRADE_IMPACT_ID);
      emitBinaryImpactCreationCancelledEventFromModal();
      expect(component.prefillUpgradeImpactId).toBeUndefined();
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

    it("should reset the prefilled upgrade impact id", () => {
      component.onUpgradeImpactSelected(UPGRADE_IMPACT_ID);
      emitBinaryImpactCreatedEventFromModal();
      expect(component.prefillUpgradeImpactId).toBeUndefined();
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

  function createBinaryImpactWithUpgradeImpact() {
    triggerCreateNewMenuItem(0);
  }

  function createBinaryImpactWithoutUpgradeImpact() {
    triggerCreateNewMenuItem(1);
  }

  function triggerCreateNewMenuItem(index: number) {
    const menuItem = component.createNewButtonItems[index];
    menuItem.command?.({
      originalEvent: new MouseEvent("click"),
      item: menuItem,
    });
  }

  function getModalComponent(): CreateBinaryImpactModalComponent {
    return DomTestUtils.getElementByType(
      fixture,
      CreateBinaryImpactModalComponent
    ).getInstance();
  }
});
