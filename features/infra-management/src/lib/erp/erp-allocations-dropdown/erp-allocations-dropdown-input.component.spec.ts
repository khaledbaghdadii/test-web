import {
  ErpAllocation,
  ErpAllocationsDropdownInputComponent,
} from "@mxflow/features/infra-management";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { signal } from "@angular/core";
import { ErpAllocationsDropdownDefaultSelectionMode } from "../model/erp-allocations-dropdown-default-selection-mode";
import { Select, SelectChangeEvent, SelectModule } from "primeng/select";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { By } from "@angular/platform-browser";
import { ErpAllocationsDropdownOption } from "./erp-allocations-dropdown.option";
import { Subject } from "rxjs";
import { ErpAllocationsDropdownStateService } from "./state-service/erp-allocations-dropdown-state.service";

const PROJECT_ID = "projectId";
const MOCK_ERP_ALLOCATION_ID_1 = "erpAllocationId1";
const CUSTOM_ERP_ALLOCATION_ID = "customErpAllocationId";

const ERP_ALLOCATION_1: ErpAllocation = {
  id: MOCK_ERP_ALLOCATION_ID_1,
  projectId: PROJECT_ID,
  erpProjectId: "erpProjectId1",
  allocationName: "allocationName1",
};

const CUSTOM_ERP_ALLOCATION: ErpAllocation = {
  id: CUSTOM_ERP_ALLOCATION_ID,
  projectId: PROJECT_ID,
  erpProjectId: "erpProjectId2",
  allocationName: "allocationName2",
};

const ERP_ALLOCATION_DROPDOWN_OPTION_1 = {
  label: `${ERP_ALLOCATION_1.erpProjectId}-${ERP_ALLOCATION_1.allocationName}`,
  value: ERP_ALLOCATION_1,
};

const CUSTOM_ERP_ALLOCATION_DROPDOWN_OPTION = {
  label: `${CUSTOM_ERP_ALLOCATION.erpProjectId}-${CUSTOM_ERP_ALLOCATION.allocationName}`,
  value: CUSTOM_ERP_ALLOCATION,
};

describe("ErpAllocationsDropdownInputComponent", () => {
  let component: ErpAllocationsDropdownInputComponent;
  let fixture: ComponentFixture<ErpAllocationsDropdownInputComponent>;
  let mockStateService: any;
  let dropdown: any;
  beforeEach(async () => {
    mockStateService = {
      setProjectId: jest.fn(),
      setCustomErpAllocationId: jest.fn(),
      setDropdownDefaultSelectionMode: jest.fn(),
      setSelectedOption: jest.fn(),
      erpAllocationsDropdownOptions: signal(undefined),
      selectedOption: signal(undefined),
      retrievedErpAllocations: signal(undefined),
      dropdownDefaultSelectionModeSignal: signal(
        ErpAllocationsDropdownDefaultSelectionMode.LATEST
      ),
      customErpAllocation: signal(undefined),
      isLoadingData: signal(false),
      errorMessageSubject: new Subject<string>(),
    };
    dropdown = {
      hide: jest.fn(),
    } as unknown as jest.Mocked<Select>;

    await TestBed.configureTestingModule({
      imports: [
        ErpAllocationsDropdownInputComponent,
        SelectModule,
        FormsModule,
        CommonModule,
      ],
    })
      .overrideComponent(ErpAllocationsDropdownInputComponent, {
        set: {
          providers: [
            {
              provide: ErpAllocationsDropdownStateService,
              useValue: mockStateService,
            },
          ],
        },
      })
      .compileComponents();
    fixture = TestBed.createComponent(ErpAllocationsDropdownInputComponent);
    component = fixture.componentInstance;
    initializeInputs();
    fixture.detectChanges();
  });
  describe("ngOnInit", () => {
    it("should initialize state service with projectId, customErpAllocationId, and dropdownDefaultSelectionMode", () => {
      expect(mockStateService.setProjectId).toHaveBeenCalledWith(PROJECT_ID);
      expect(mockStateService.setCustomErpAllocationId).toHaveBeenCalledWith(
        undefined
      );
      expect(
        mockStateService.setDropdownDefaultSelectionMode
      ).toHaveBeenCalledWith(ErpAllocationsDropdownDefaultSelectionMode.LATEST);
    });
  });
  describe("constructor", () => {
    it("should emit selected option on selection observable change", fakeAsync(() => {
      const emitSpy = jest.spyOn(component.selectedErpAllocationChange, "emit");
      mockStateService.selectedOption.set(ERP_ALLOCATION_DROPDOWN_OPTION_1);
      fixture.detectChanges();
      tick();
      expect(emitSpy).toHaveBeenCalledWith(
        ERP_ALLOCATION_DROPDOWN_OPTION_1.value
      );
    }));

    it("should emit error message on failure observable change", fakeAsync(() => {
      const emitSpy = jest.spyOn(component.failureEvent, "emit");
      mockStateService.errorMessageSubject.next("Error message");
      fixture.detectChanges();
      tick();
      expect(emitSpy).toHaveBeenCalledWith("Error message");
    }));
    describe("auto-select", () => {
      it.each([undefined, null])(
        "should clear selection when dropdownDefaultSelectionMode is set to CUSTOM and customErpAllocation does not exist",
        fakeAsync((customErpAllocation: ErpAllocation) => {
          mockStateService.dropdownDefaultSelectionModeSignal.set(
            ErpAllocationsDropdownDefaultSelectionMode.CUSTOM
          );
          mockStateService.customErpAllocation.set(customErpAllocation);
          mockStateService.erpAllocationsDropdownOptions.set([
            ERP_ALLOCATION_DROPDOWN_OPTION_1,
          ]);
          tick();
          fixture.detectChanges();

          expect(mockStateService.setSelectedOption).toHaveBeenCalledWith(
            undefined
          );
        })
      );

      it.each([
        ErpAllocationsDropdownDefaultSelectionMode.CUSTOM,
        ErpAllocationsDropdownDefaultSelectionMode.LATEST,
      ])(
        "should auto-select first option on init",
        fakeAsync(
          (
            dropdownDefaultSelectionMode: ErpAllocationsDropdownDefaultSelectionMode
          ) => {
            mockStateService.erpAllocationsDropdownOptions.set([
              ERP_ALLOCATION_DROPDOWN_OPTION_1,
            ]);
            mockStateService.dropdownDefaultSelectionModeSignal.set(
              dropdownDefaultSelectionMode
            );
            tick();
            fixture.detectChanges();
            expect(mockStateService.setSelectedOption).toHaveBeenCalledWith(
              ERP_ALLOCATION_DROPDOWN_OPTION_1
            );
          }
        )
      );

      it("should select custom ERP allocation when it exists and dropdownDefaultSelectionMode is CUSTOM", fakeAsync(() => {
        mockStateService.erpAllocationsDropdownOptions.set([
          ERP_ALLOCATION_DROPDOWN_OPTION_1,
        ]);
        mockStateService.dropdownDefaultSelectionModeSignal.set(
          ErpAllocationsDropdownDefaultSelectionMode.CUSTOM
        );
        mockStateService.customErpAllocation.set(CUSTOM_ERP_ALLOCATION);
        tick();
        fixture.detectChanges();
        expect(mockStateService.setSelectedOption).toHaveBeenCalledWith(
          CUSTOM_ERP_ALLOCATION_DROPDOWN_OPTION
        );
      }));

      it("should select first ERP allocation when dropdownDefaultSelectionMode is LATEST", fakeAsync(() => {
        mockStateService.erpAllocationsDropdownOptions.set([
          ERP_ALLOCATION_DROPDOWN_OPTION_1,
        ]);
        mockStateService.dropdownDefaultSelectionModeSignal.set(
          ErpAllocationsDropdownDefaultSelectionMode.LATEST
        );
        mockStateService.customErpAllocation.set(CUSTOM_ERP_ALLOCATION);
        tick();
        fixture.detectChanges();
        expect(mockStateService.setSelectedOption).toHaveBeenCalledWith(
          ERP_ALLOCATION_DROPDOWN_OPTION_1
        );
      }));
    });
  });
  it("should emit clear event when selected option has blank label", fakeAsync(() => {
    const emitSpy = jest.spyOn(component.clearEvent, "emit");
    mockStateService.selectedOption.set(ERP_ALLOCATION_DROPDOWN_OPTION_1);
    fixture.detectChanges();
    tick();
    mockStateService.selectedOption.set({ label: "", value: undefined });
    fixture.detectChanges();
    tick();
    expect(emitSpy).toHaveBeenCalled();
  }));
  describe("reading signals from state service", () => {
    it("should read the erpAllocationsDropdownOptions signal from the state service", () => {
      mockStateService.erpAllocationsDropdownOptions.set([
        ERP_ALLOCATION_DROPDOWN_OPTION_1,
      ]);
      expect(component.erpAllocationsDropdownOptions()).toEqual([
        ERP_ALLOCATION_DROPDOWN_OPTION_1,
      ]);
    });

    it("should bind erpAllocationsDropdownOptions to the dropdown options in the template", () => {
      mockStateService.erpAllocationsDropdownOptions.set([
        ERP_ALLOCATION_DROPDOWN_OPTION_1,
      ]);
      fixture.detectChanges();
      const pDropdownElement = fixture.debugElement.query(By.directive(Select));
      const pDropdownInstance = pDropdownElement.componentInstance as Select;
      expect(pDropdownInstance.options).toEqual([
        ERP_ALLOCATION_DROPDOWN_OPTION_1,
      ]);
    });

    it("should read selected option from state service", () => {
      mockStateService.selectedOption.set(ERP_ALLOCATION_DROPDOWN_OPTION_1);
      expect(component.selectedOption()).toEqual(
        ERP_ALLOCATION_DROPDOWN_OPTION_1
      );
    });

    it("should bind selectedOption to the dropdown ngModel in the template", () => {
      mockStateService.selectedOption.set(ERP_ALLOCATION_DROPDOWN_OPTION_1);
      fixture.detectChanges();
      const pDropdownElement = fixture.debugElement.query(By.directive(Select));
      const pDropdownInstance = pDropdownElement.componentInstance as Select;
      expect(pDropdownInstance.hasSelectedOption()).toBeTruthy();
    });

    it("should read is loading data from state service", () => {
      mockStateService.isLoadingData.set(true);
      expect(component.isLoadingData()).toBeTruthy();
    });
  });

  describe("setCustomErpAllocationId", () => {
    it("should set custom erp allocation id in state service", () => {
      component.setCustomErpAllocationId(CUSTOM_ERP_ALLOCATION_ID);
      expect(mockStateService.setCustomErpAllocationId).toHaveBeenCalledWith(
        CUSTOM_ERP_ALLOCATION_ID
      );
    });
  });
  describe("handleErpAllocationSelected", () => {
    it("should set the selected erp allocation", () => {
      const event = { value: ERP_ALLOCATION_1 } as SelectChangeEvent;
      component.handleErpAllocationSelected(event);
      expect(mockStateService.setSelectedOption).toHaveBeenCalledWith(
        ERP_ALLOCATION_DROPDOWN_OPTION_1
      );
    });

    it("should call handleErpAllocationSelected on change", () => {
      const handlerSpy = jest.spyOn(component, "handleErpAllocationSelected");
      const event = { value: ERP_ALLOCATION_1 } as SelectChangeEvent;
      const pDropdownElement = fixture.debugElement.query(By.directive(Select));
      const pDropdownInstance = pDropdownElement.componentInstance as Select;

      pDropdownInstance.onChange.emit(event);
      fixture.detectChanges();

      expect(handlerSpy).toHaveBeenCalled();
    });
    it("should update the form when an erp allocation is selected", () => {
      const mockOnChange = jest.fn();
      component.registerOnChange(mockOnChange);
      const event = { value: ERP_ALLOCATION_1 } as SelectChangeEvent;

      component.handleErpAllocationSelected(event);

      expect(mockOnChange).toHaveBeenCalledWith(ERP_ALLOCATION_1);
    });
  });
  describe("clear selected option", () => {
    it("should clear selected option on dropdown clear", () => {
      mockStateService.selectedOption.set(ERP_ALLOCATION_DROPDOWN_OPTION_1);
      fixture.detectChanges();
      const pDropdownElement = fixture.debugElement.query(By.directive(Select));
      const pDropdownInstance = pDropdownElement.componentInstance as Select;

      pDropdownInstance.onClear.emit();
      fixture.detectChanges();

      expect(mockStateService.setSelectedOption).toHaveBeenCalledWith({
        label: "",
        value: undefined,
      });
    });
    it("should update form value to null on dropdown clear", () => {
      const mockOnChange = jest.fn();
      component.registerOnChange(mockOnChange);

      component.clearSelectedOption();

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });
  });
  describe("selectedOption validity", () => {
    it("should be true when selected option is defined and field required is true", () => {
      fixture.componentRef.setInput("fieldRequired", true);
      mockStateService.selectedOption.set(ERP_ALLOCATION_DROPDOWN_OPTION_1);
      expect(component.selectedOption()).toEqual(
        ERP_ALLOCATION_DROPDOWN_OPTION_1
      );
      expect(component.selectedOptionValidity()).toBeTruthy();
    });

    it("should be true when selected option is undefined and field required is true", () => {
      fixture.componentRef.setInput("fieldRequired", true);
      mockStateService.selectedOption.set(undefined);
      expect(component.selectedOption()).toBe(undefined);
      expect(component.selectedOptionValidity()).toBeTruthy();
    });

    it("should be false when label is blank and field required is true", () => {
      fixture.componentRef.setInput("fieldRequired", true);
      const option: ErpAllocationsDropdownOption = {
        label: "",
        value: ERP_ALLOCATION_1,
      };
      mockStateService.selectedOption.set(option);
      expect(component.selectedOption()).toBe(option);
      expect(component.selectedOptionValidity()).toBeFalsy();
    });

    it("should be true when field required is false", () => {
      fixture.componentRef.setInput("fieldRequired", true);
      expect(component.selectedOptionValidity()).toBeTruthy();
    });
  });
  describe("closeDialog", () => {
    it("should call dropdown hide method", () => {
      const spy = jest.spyOn(component.dropdown, "hide");
      component.closeDialog();
      expect(spy).toHaveBeenCalled();
    });
  });

  function initializeInputs() {
    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput(
      "dropdownDefaultSelectionMode",
      ErpAllocationsDropdownDefaultSelectionMode.LATEST
    );
    component.dropdown = dropdown;
  }
});
