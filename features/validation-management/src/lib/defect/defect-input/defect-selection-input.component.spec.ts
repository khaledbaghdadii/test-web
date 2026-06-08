import { DefectSelectionInputComponent } from "./defect-selection-input.component";
import { Defect } from "../model/defect.model";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { InputTextModule } from "primeng/inputtext";
import { NgIf } from "@angular/common";
import {
  DefectSelectionModalComponent,
  ValidationScope,
} from "@mxflow/features/validation-management";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { By } from "@angular/platform-browser";
import { DomTestUtils } from "@mxevolve/testing";

@Component({
  selector: "mxevolve-defect-selection-modal",
  template: "",
})
class MockDefectSelectionModalComponent {
  @Input() isVisible: boolean;
  @Input() validationScope?: ValidationScope;
  @Input() initialValidationScope?: ValidationScope;
  @Input() warningMessage?: string;
  @Output() defectSelectedChange = new EventEmitter<string>();
  @Output() errorMessage = new EventEmitter<string>();
}

describe("DefectInputComponent", () => {
  let component: DefectSelectionInputComponent;
  let fixture: ComponentFixture<DefectSelectionInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DefectSelectionInputComponent,
        InputTextModule,
        NgIf,
        DefectSelectionModalComponent,
      ],
    })
      .overrideComponent(DefectSelectionInputComponent, {
        remove: { imports: [DefectSelectionModalComponent] },
        add: {
          imports: [MockDefectSelectionModalComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DefectSelectionInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("show defect modal", () => {
    it("should show defect modal correclty", () => {
      component.showDefectModal();
      expect(component.isDefectModalVisible).toEqual(true);
    });

    it("should show defect modal when browse button is clicked", () => {
      const showDefectModalSpy = jest.spyOn(component, "showDefectModal");
      getBrowseButtonHarness().click();
      expect(showDefectModalSpy).toHaveBeenCalled();
    });
  });

  it("should register onChange function", () => {
    const fn = jest.fn();

    component.registerOnChange(fn);

    expect(component.onChange).toBe(fn);
  });

  it("should register onTouched function", () => {
    const fn = jest.fn();

    component.registerOnTouched(fn);

    expect(component.onTouched).toBe(fn);
  });

  describe("defect id input change", () => {
    it("input value should have the selected defect id", () => {
      component.selectedDefectId = getDefect().id;
      fixture.detectChanges();
      const input = fixture.debugElement.query(By.css("input")).nativeElement;
      expect(input.value).toEqual(getDefect().id);
    });
  });

  describe("handle selected defect change", () => {
    it("handleSelectedDefectChange should set selected defect id", () => {
      const fn = jest.fn();
      component.registerOnChange(fn);
      component.registerOnTouched(fn);

      component.handleSelectedDefectChange(getDefect().id);
      expect(component.selectedDefectId).toEqual(getDefect().id);
    });

    it("should call handleSelectedDefectChange on defect selected change", () => {
      const handlerSpy = jest.spyOn(component, "handleSelectedDefectChange");
      getSelectionModalComponent().defectSelectedChange.emit(getDefect().id);
      fixture.detectChanges();

      expect(handlerSpy).toHaveBeenCalledWith(getDefect().id);
    });

    it("handleSelectedDefectChange should call onChange and onTouched functions", () => {
      component.registerOnChange(jest.fn());
      component.registerOnTouched(jest.fn());

      component.handleSelectedDefectChange(getDefect().id);

      expect(component.onChange).toHaveBeenCalledWith(getDefect().id);
      expect(component.onTouched).toHaveBeenCalled();
    });
  });

  describe("handle error message", () => {
    it("should handle error message", () => {
      const errorMessage = "error";
      const emitSpy = jest.spyOn(component.errorMessage, "emit");
      component.handleErrorMessage(errorMessage);
      expect(emitSpy).toHaveBeenCalledWith(errorMessage);
    });

    it("should call handleErrorMessage on modal error message change", () => {
      const handlerSpy = jest.spyOn(component, "handleErrorMessage");
      const errorMessage = "error";

      getSelectionModalComponent().errorMessage.emit(errorMessage);
      fixture.detectChanges();

      expect(handlerSpy).toHaveBeenCalledWith(errorMessage);
    });
  });

  function getDefect(): Defect {
    return {
      id: "defect1",
      link: "/defect1",
      title: "Defect 1",
      description: "description1",
      submissionDate: new Date(),
      developer: "3amo sami",
    };
  }

  function getBrowseButtonHarness() {
    return DomTestUtils.getButtonByTestId(fixture, "browse-defects-button");
  }

  function getSelectionModalComponent() {
    return DomTestUtils.getElementByType(
      fixture,
      MockDefectSelectionModalComponent
    ).getInstance();
  }
});
