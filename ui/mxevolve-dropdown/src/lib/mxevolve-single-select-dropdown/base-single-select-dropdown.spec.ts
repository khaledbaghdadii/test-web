import { Component, DestroyRef, inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { BaseSingleSelectDropdown } from "./base-single-select-dropdown";
import { MxevolveSingleSelectDropdownComponent } from "./mxevolve-single-select-dropdown.component";
import { MxEvolveSingleSelectDataProvider } from "../models/single-select-data-provider.interface";
import { MxevolveSingleSelectFrontendStateProvider } from "./state/mxevolve-single-select-frontend-state.provider";
import { MxEvolveSingleSelectDropdownState } from "../models/single-select-dropdown-state.interface";
import { of } from "rxjs";

interface TestItem {
  id: string;
  name: string;
}

const createMockDataProvider = (): jest.Mocked<
  MxEvolveSingleSelectDataProvider<TestItem, { testParam: string }>
> => ({
  fetchData: jest.fn().mockReturnValue(of([])),
  toDropdownOption: jest.fn((item: TestItem) => ({
    label: item.name,
    value: item,
  })),
  getItemId: jest.fn((item: TestItem) => item.id),
});

@Component({
  selector: "test-single-select-dropdown",
  template: "",
  standalone: true,
})
class TestSingleSelectDropdownComponent extends BaseSingleSelectDropdown<
  TestItem,
  { testParam: string }
> {
  protected override stateProvider: MxEvolveSingleSelectDropdownState<
    TestItem,
    { testParam: string }
  >;

  constructor() {
    super();
    const destroyRef = inject(DestroyRef);
    const mockDataProvider = createMockDataProvider();
    this.stateProvider = new MxevolveSingleSelectFrontendStateProvider(
      mockDataProvider,
      destroyRef
    );
  }
}

describe("BaseSingleSelectDropdown", () => {
  let component: TestSingleSelectDropdownComponent;

  beforeEach(() => {
    const mockDestroyRef = {
      onDestroy: jest.fn(),
    } as unknown as DestroyRef;

    TestBed.configureTestingModule({
      imports: [TestSingleSelectDropdownComponent],
      providers: [{ provide: DestroyRef, useValue: mockDestroyRef }],
    });

    const fixture = TestBed.createComponent(TestSingleSelectDropdownComponent);
    component = fixture.componentInstance;
  });

  describe("ControlValueAccessor", () => {
    it("should implement ControlValueAccessor", () => {
      expect(component.writeValue).toBeDefined();
      expect(component.registerOnChange).toBeDefined();
      expect(component.registerOnTouched).toBeDefined();
      expect(component.setDisabledState).toBeDefined();
    });

    it("should forward writeValue to dropdown component when available", () => {
      const mockDropdown = {
        writeValue: jest.fn(),
      } as unknown as MxevolveSingleSelectDropdownComponent<
        TestItem,
        { testParam: string }
      >;
      component.dropdownComponent = mockDropdown;

      const testItem: TestItem = { id: "1", name: "Test" };
      component.writeValue(testItem);

      expect(mockDropdown.writeValue).toHaveBeenCalledWith(testItem);
    });

    it("should not throw when writeValue called without dropdown component", () => {
      component.dropdownComponent = undefined;

      expect(() =>
        component.writeValue({ id: "1", name: "Test" })
      ).not.toThrow();
    });

    it("should handle null value in writeValue", () => {
      const mockDropdown = {
        writeValue: jest.fn(),
      } as unknown as MxevolveSingleSelectDropdownComponent<
        TestItem,
        { testParam: string }
      >;
      component.dropdownComponent = mockDropdown;

      component.writeValue(null);

      expect(mockDropdown.writeValue).toHaveBeenCalledWith(null);
    });

    it("should register onChange callback", () => {
      const onChangeFn = jest.fn();
      component.registerOnChange(onChangeFn);

      const testItem: TestItem = { id: "1", name: "Test" };
      component.onSelectionChange(testItem);

      expect(onChangeFn).toHaveBeenCalledWith(testItem);
    });

    it("should register onTouched callback", () => {
      const onTouchedFn = jest.fn();
      component.registerOnTouched(onTouchedFn);

      component.onSelectionChange(null);

      expect(onTouchedFn).toHaveBeenCalled();
    });
  });

  describe("onSelectionChange", () => {
    it("should call registered onChange callback with selected item", () => {
      const onChangeFn = jest.fn();
      component.registerOnChange(onChangeFn);

      const testItem: TestItem = { id: "1", name: "Test" };
      component.onSelectionChange(testItem);

      expect(onChangeFn).toHaveBeenCalledWith(testItem);
    });

    it("should call registered onTouched callback", () => {
      const onTouchedFn = jest.fn();
      component.registerOnTouched(onTouchedFn);

      component.onSelectionChange({ id: "1", name: "Test" });

      expect(onTouchedFn).toHaveBeenCalled();
    });

    it("should handle null selection", () => {
      const onChangeFn = jest.fn();
      component.registerOnChange(onChangeFn);

      component.onSelectionChange(null);

      expect(onChangeFn).toHaveBeenCalledWith(null);
    });
  });

  describe("onError", () => {
    it("should emit error through failureEvent", () => {
      const errorSpy = jest.fn();
      component.failureEvent.subscribe(errorSpy);

      component.onError("Test error message");

      expect(errorSpy).toHaveBeenCalledWith("Test error message");
    });
  });

  describe("createProviders", () => {
    it("should create NG_VALUE_ACCESSOR provider", () => {
      const providers = BaseSingleSelectDropdown.createProviders(
        TestSingleSelectDropdownComponent
      );

      expect(providers).toHaveLength(1);
      expect(providers[0].provide.toString()).toContain("NgValueAccessor");
      expect(providers[0].multi).toBe(true);
    });
  });

  describe("hideDropdown", () => {
    it("should call hide on selectRef when dropdownComponent is available", () => {
      const mockSelectRef = {
        hide: jest.fn(),
      };
      const mockDropdown = {
        selectRef: mockSelectRef,
      } as unknown as MxevolveSingleSelectDropdownComponent<
        TestItem,
        { testParam: string }
      >;
      component.dropdownComponent = mockDropdown;

      component.hideDropdown();

      expect(mockSelectRef.hide).toHaveBeenCalled();
    });

    it("should not throw when dropdownComponent is undefined", () => {
      component.dropdownComponent = undefined;

      expect(() => component.hideDropdown()).not.toThrow();
    });

    it("should not throw when selectRef is undefined", () => {
      const mockDropdown = {
        selectRef: undefined,
      } as unknown as MxevolveSingleSelectDropdownComponent<
        TestItem,
        { testParam: string }
      >;
      component.dropdownComponent = mockDropdown;

      expect(() => component.hideDropdown()).not.toThrow();
    });
  });
});
