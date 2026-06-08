import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DumpsMultiSelectDropdownComponent } from "./dumps-multi-select-dropdown.component";
import {
  BaseMultiselectDropdown,
  MxevolveMultiselectDropdownComponent,
} from "@mxflow/ui/mxevolve-dropdown";
import { ArtifactDumpsService, Dump } from "@mxflow/features/artifact-manager";
import { of } from "rxjs";

const DUMP_ID_1 = "DUMP_ID_1";
const DUMP_ID_2 = "DUMP_ID_2";
const DUMP_1: Dump = { id: DUMP_ID_1 } as Dump;
const DUMP_2: Dump = { id: DUMP_ID_2 } as Dump;

describe("DumpsMultiSelectDropdownComponent", () => {
  let component: DumpsMultiSelectDropdownComponent;
  let fixture: ComponentFixture<DumpsMultiSelectDropdownComponent>;
  let mockDumpsService: jest.Mocked<ArtifactDumpsService>;

  beforeEach(async () => {
    mockDumpsService = {
      getAllDumps: jest.fn().mockReturnValue(of({ content: [], last: true })),
    } as unknown as jest.Mocked<ArtifactDumpsService>;

    await TestBed.configureTestingModule({
      imports: [
        DumpsMultiSelectDropdownComponent,
        MxevolveMultiselectDropdownComponent,
      ],
      providers: [
        { provide: ArtifactDumpsService, useValue: mockDumpsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DumpsMultiSelectDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("should extend BaseMultiselectDropdown", () => {
    expect(component).toBeInstanceOf(BaseMultiselectDropdown);
  });

  it("should have state provider initialized", () => {
    expect(component["stateProvider"]).toBeDefined();
  });

  it("should have failureEvent output from base class", () => {
    expect(component.failureEvent).toBeDefined();
  });

  describe("dropdownConfig", () => {
    it("should set placeholder to 'Select Dumps'", () => {
      const config = component.dropdownConfig();
      expect(config.placeholder).toBe("Select Dumps");
    });

    it("should set maxSelectedLabels to 2", () => {
      const config = component.dropdownConfig();
      expect(config.maxSelectedLabels).toBe(2);
    });

    it("should set panelStyle", () => {
      const config = component.dropdownConfig();
      expect(config.panelStyle).toEqual({ "min-width": "20rem" });
    });
  });

  describe("appendToBody", () => {
    it("should default appendToBody to true", () => {
      expect(component.appendToBody()).toBe(true);
    });

    it("should set appendTo to 'body' in dropdown config by default", () => {
      const config = component.dropdownConfig();
      expect(config.appendTo).toBe("body");
    });

    it("should support appendToBody input", () => {
      fixture.componentRef.setInput("appendToBody", false);
      fixture.detectChanges();
      expect(component.appendToBody()).toBe(false);
    });

    it("should set appendTo to null in dropdown config when appendToBody is false", () => {
      fixture.componentRef.setInput("appendToBody", false);
      fixture.detectChanges();
      const config = component.dropdownConfig();
      expect(config.appendTo).toBeNull();
    });
  });

  describe("onSelectionChange", () => {
    it("should emit selectedDumpsChange with dump IDs", () => {
      const emitSpy = jest.spyOn(component.selectedDumpsChange, "emit");
      component.onSelectionChange([DUMP_1, DUMP_2]);
      expect(emitSpy).toHaveBeenCalledWith([DUMP_ID_1, DUMP_ID_2]);
    });

    it("should emit selectedDumpsChange with empty array when selection is cleared", () => {
      const emitSpy = jest.spyOn(component.selectedDumpsChange, "emit");
      component.onSelectionChange([]);
      expect(emitSpy).toHaveBeenCalledWith([]);
    });
  });

  describe("onError", () => {
    it("should emit errorEventEmitter with error message", () => {
      const emitSpy = jest.spyOn(component.errorEventEmitter, "emit");
      component.onError("some error");
      expect(emitSpy).toHaveBeenCalledWith("some error");
    });

    it("should also emit failureEvent via base class", () => {
      const emitSpy = jest.spyOn(component.failureEvent, "emit");
      component.onError("some error");
      expect(emitSpy).toHaveBeenCalledWith("some error");
    });
  });
});
