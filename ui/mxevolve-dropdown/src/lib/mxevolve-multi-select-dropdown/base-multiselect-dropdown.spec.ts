import { Component, DestroyRef, inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { BaseMultiselectDropdown } from "./base-multiselect-dropdown";
import { MxevolveMultiselectDropdownComponent } from "./mxevolve-multiselect-dropdown.component";
import { MxEvolveDropdownDataProvider } from "../models/dropdown-data-provider.interface";
import { MxevolveDropdownBackendStateProvider } from "./state/mxevolve-multiselect-dropdown-backend-state.provider";
import { MxEvolveDropdownState } from "../models/dropdown-state.interface";
import { of } from "rxjs";

interface TestItem {
  id: string;
  name: string;
}

const createMockDataProvider = (): jest.Mocked<
  MxEvolveDropdownDataProvider<TestItem, { testParam: string }>
> => ({
  fetchData: jest.fn().mockReturnValue(of({ content: [], last: true })),
  toDropdownOption: jest.fn((item: TestItem) => ({
    label: item.name,
    value: item,
  })),
  getItemId: jest.fn((item: TestItem) => item.id),
});

@Component({
  selector: "test-dropdown",
  template: "",
  standalone: true,
})
class TestDropdownComponent extends BaseMultiselectDropdown<
  TestItem,
  { testParam: string }
> {
  protected override stateProvider: MxEvolveDropdownState<
    TestItem,
    { testParam: string }
  >;

  constructor() {
    super();
    const destroyRef = inject(DestroyRef);
    const mockDataProvider = createMockDataProvider();
    this.stateProvider = new MxevolveDropdownBackendStateProvider(
      mockDataProvider,
      destroyRef
    );
  }
}

describe("BaseMultiselectDropdown", () => {
  let component: TestDropdownComponent;

  beforeEach(() => {
    const mockDestroyRef = {
      onDestroy: jest.fn(),
    } as unknown as DestroyRef;

    TestBed.configureTestingModule({
      imports: [TestDropdownComponent],
      providers: [{ provide: DestroyRef, useValue: mockDestroyRef }],
    });

    const fixture = TestBed.createComponent(TestDropdownComponent);
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
      } as unknown as MxevolveMultiselectDropdownComponent<
        TestItem,
        { testParam: string }
      >;
      component.dropdownComponent = mockDropdown;

      const testItems: TestItem[] = [{ id: "1", name: "Test" }];
      component.writeValue(testItems);

      expect(mockDropdown.writeValue).toHaveBeenCalledWith(testItems);
    });

    it("should not throw when writeValue called without dropdown component", () => {
      component.dropdownComponent = undefined;

      expect(() =>
        component.writeValue([{ id: "1", name: "Test" }])
      ).not.toThrow();
    });

    it("should register onChange callback", () => {
      const onChangeFn = jest.fn();
      component.registerOnChange(onChangeFn);

      const testItems: TestItem[] = [{ id: "1", name: "Test" }];
      component.onSelectionChange(testItems);

      expect(onChangeFn).toHaveBeenCalledWith(testItems);
    });

    it("should register onTouched callback", () => {
      const onTouchedFn = jest.fn();
      component.registerOnTouched(onTouchedFn);

      component.onSelectionChange([]);

      expect(onTouchedFn).toHaveBeenCalled();
    });
  });

  describe("onSelectionChange", () => {
    it("should call registered onChange callback", () => {
      const onChangeFn = jest.fn();
      component.registerOnChange(onChangeFn);

      const testItems: TestItem[] = [{ id: "1", name: "Test" }];
      component.onSelectionChange(testItems);

      expect(onChangeFn).toHaveBeenCalledWith(testItems);
    });

    it("should call registered onTouched callback", () => {
      const onTouchedFn = jest.fn();
      component.registerOnTouched(onTouchedFn);

      component.onSelectionChange([]);

      expect(onTouchedFn).toHaveBeenCalled();
    });

    it("should handle empty selection", () => {
      const onChangeFn = jest.fn();
      component.registerOnChange(onChangeFn);

      component.onSelectionChange([]);

      expect(onChangeFn).toHaveBeenCalledWith([]);
    });
  });

  describe("onError", () => {
    it("should emit error through failureEvent", () => {
      const errorSpy = jest.fn();
      component.failureEvent.subscribe(errorSpy);

      const errorMessage = "Test error";
      component.onError(errorMessage);

      expect(errorSpy).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe("createProviders", () => {
    it("should create NG_VALUE_ACCESSOR provider", () => {
      const providers = BaseMultiselectDropdown.createProviders(
        TestDropdownComponent
      );

      expect(providers).toHaveLength(1);
      expect(providers[0]).toHaveProperty("provide");
      expect(providers[0]).toHaveProperty("useExisting");
      expect(providers[0]).toHaveProperty("multi", true);
    });
  });

  describe("setDisabledState", () => {
    it("should have setDisabledState method", () => {
      expect(() => component.setDisabledState()).not.toThrow();
    });
  });
});
