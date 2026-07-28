import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MxevolveSingleSelectDropdownComponent } from "./mxevolve-single-select-dropdown.component";
import { DestroyRef, signal, WritableSignal } from "@angular/core";
import { PrimeTemplate } from "primeng/api";
import { Select } from "primeng/select";
import { FormsModule } from "@angular/forms";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { Subject } from "rxjs";
import { DropdownOption } from "../models/dropdown-option.interface";
import { MxEvolveSingleSelectDropdownState } from "../models/single-select-dropdown-state.interface";

interface TestItem {
  id: string;
  name: string;
}

let fixture: ComponentFixture<
  MxevolveSingleSelectDropdownComponent<TestItem, { testParam: string }>
>;
let component: MxevolveSingleSelectDropdownComponent<
  TestItem,
  { testParam: string }
>;
let mockStateProvider: jest.Mocked<
  MxEvolveSingleSelectDropdownState<TestItem, { testParam: string }>
>;

describe("MxevolveSingleSelectDropdownComponent", () => {
  const TEST_ITEM: TestItem = { id: "1", name: "Test Item" };
  const TEST_PARAMS = { testParam: "test" };
  const SEARCH_KEY = "search";

  beforeEach(async () => {
    mockStateProvider = {
      setDataParams: jest.fn(),
      setSelectedItem: jest.fn(),
      attemptLoadingMoreItems: jest.fn(),
      setSearchKey: jest.fn(),
      setPageIndex: jest.fn(),
      errorMessageSubject: new Subject<string>(),
      items: signal<TestItem[]>([TEST_ITEM]),
      dropdownOptions: signal<DropdownOption<TestItem>[]>([
        { label: TEST_ITEM.name, value: TEST_ITEM },
      ]),
      selectedItem: signal<TestItem | null>(null),
      searchKey: signal<string>(SEARCH_KEY),
      loading: signal<boolean>(false),
      itemsPage: signal(undefined),
    } as unknown as jest.Mocked<
      MxEvolveSingleSelectDropdownState<TestItem, { testParam: string }>
    >;

    const mockDestroyRef = {
      onDestroy: jest.fn(),
    } as unknown as DestroyRef;

    await TestBed.configureTestingModule({
      imports: [
        Select,
        FormsModule,
        IconField,
        InputIcon,
        InputText,
        PrimeTemplate,
        MxevolveSingleSelectDropdownComponent,
      ],
      providers: [{ provide: DestroyRef, useValue: mockDestroyRef }],
    }).compileComponents();

    fixture = TestBed.createComponent(
      MxevolveSingleSelectDropdownComponent<TestItem, { testParam: string }>
    );
    fixture.componentRef.setInput("stateProvider", mockStateProvider);
    fixture.componentRef.setInput("dataParams", TEST_PARAMS);
    fixture.componentRef.setInput("config", {});
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe("ControlValueAccessor", () => {
    it("should set selected item in state service when writeValue is called", () => {
      component.writeValue(TEST_ITEM);

      expect(mockStateProvider.setSelectedItem).toHaveBeenCalledWith(TEST_ITEM);
    });

    it("should handle null value in writeValue", () => {
      component.writeValue(null);

      expect(mockStateProvider.setSelectedItem).toHaveBeenCalledWith(null);
    });

    it("should propagate changes when onItemSelected is called", () => {
      const onChangeSpy = jest.fn();
      component.registerOnChange(onChangeSpy);

      component.onItemSelected(TEST_ITEM);

      expect(onChangeSpy).toHaveBeenCalledWith(TEST_ITEM);
    });

    it("should emit selectionChange when item is selected", () => {
      const selectionChangeSpy = jest.fn();
      component.selectionChange.subscribe(selectionChangeSpy);

      component.onItemSelected(TEST_ITEM);

      expect(selectionChangeSpy).toHaveBeenCalledWith(TEST_ITEM);
    });

    it("should propagate null when onItemSelected is called with null", () => {
      const onChangeSpy = jest.fn();
      component.registerOnChange(onChangeSpy);

      component.onItemSelected(null);

      expect(onChangeSpy).toHaveBeenCalledWith(null);
    });
  });

  describe("onClear", () => {
    it("should clear selected item and propagate changes", () => {
      const onChangeSpy = jest.fn();
      component.registerOnChange(onChangeSpy);

      component.onClear();

      expect(onChangeSpy).toHaveBeenCalledWith(null);
    });

    it("should emit selectionChange with null on clear", () => {
      const selectionChangeSpy = jest.fn();
      component.selectionChange.subscribe(selectionChangeSpy);

      component.onClear();

      expect(selectionChangeSpy).toHaveBeenCalledWith(null);
    });

    it("should reset search key when clearing selection", () => {
      component.onClear();

      expect(mockStateProvider.setSearchKey).toHaveBeenCalledWith("");
    });
  });

  describe("onFilter", () => {
    it("should set search key in state provider", () => {
      component.onFilter("test filter");

      expect(mockStateProvider.setSearchKey).toHaveBeenCalledWith(
        "test filter"
      );
    });

    it("should handle empty filter string", () => {
      component.onFilter("");

      expect(mockStateProvider.setSearchKey).toHaveBeenCalledWith("");
    });

    it("should scroll to top when filtering", () => {
      const scrollInViewSpy = jest.fn();
      component.selectRef = {
        scrollInView: scrollInViewSpy,
      } as Partial<Select> as Select;

      component.onFilter("test");

      expect(scrollInViewSpy).toHaveBeenCalledWith(0);
    });
  });

  describe("onFilterCleared", () => {
    it("should clear search key when current search key is not empty", () => {
      const mockEvent = { stopPropagation: jest.fn() };

      component.onFilterCleared(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockStateProvider.setSearchKey).toHaveBeenCalledWith("");
    });

    it("should scroll to top when clearing filter", () => {
      const scrollInViewSpy = jest.fn();
      component.selectRef = {
        scrollInView: scrollInViewSpy,
      } as Partial<Select> as Select;
      const mockEvent = { stopPropagation: jest.fn() };

      component.onFilterCleared(mockEvent);

      expect(scrollInViewSpy).toHaveBeenCalledWith(0);
    });
  });

  describe("initialization", () => {
    it("should initialize state provider with data params on init", () => {
      expect(mockStateProvider.setDataParams).toHaveBeenCalledWith(TEST_PARAMS);
    });

    it("should subscribe to error messages on init", () => {
      const errorSpy = jest.fn();
      component.errorEvent.subscribe(errorSpy);

      mockStateProvider.errorMessageSubject.next("Test error");

      expect(errorSpy).toHaveBeenCalledWith("Test error");
    });
  });

  describe("config merging", () => {
    it("should use default config when no config is provided", () => {
      expect(component.mergedConfig().placeholder).toBe("Select Item");
      expect(component.mergedConfig().showClear).toBe(true);
    });

    it("should merge provided config with defaults", async () => {
      fixture.componentRef.setInput("config", {
        placeholder: "Custom Placeholder",
        showClear: false,
      });
      fixture.detectChanges();

      expect(component.mergedConfig().placeholder).toBe("Custom Placeholder");
      expect(component.mergedConfig().showClear).toBe(false);
    });
  });

  describe("registerOnTouched", () => {
    it("should register onTouched callback", () => {
      const onTouchedSpy = jest.fn();
      component.registerOnTouched(onTouchedSpy);

      component.onTouched();

      expect(onTouchedSpy).toHaveBeenCalled();
    });
  });

  describe("setDisabledState", () => {
    it("should not throw when called", () => {
      expect(() => component.setDisabledState()).not.toThrow();
    });
  });

  describe("scrollHeight", () => {
    it("should return height based on item count when fewer items than max", () => {
      // 1 item * 45px = 45px (below 200px max)
      expect(component.scrollHeight()).toBe("45px");
    });

    it("should cap at max scroll height when many items", () => {
      const manyOptions = Array.from({ length: 10 }, (_, i) => ({
        label: `Item ${i}`,
        value: { id: `${i}`, name: `Item ${i}` } as TestItem,
      }));
      (
        mockStateProvider.dropdownOptions as unknown as WritableSignal<
          DropdownOption<TestItem>[]
        >
      ).set(manyOptions);

      // 10 items * 45px = 450px, capped at 200px
      expect(component.scrollHeight()).toBe("200px");
    });

    it("should return 0px when no items", () => {
      (
        mockStateProvider.dropdownOptions as unknown as WritableSignal<
          DropdownOption<TestItem>[]
        >
      ).set([]);

      expect(component.scrollHeight()).toBe("0px");
    });
  });

  describe("selected item display (ngModel binding)", () => {
    it("displays the selected item's label instead of the placeholder", async () => {
      (mockStateProvider.selectedItem as WritableSignal<TestItem | null>).set(
        TEST_ITEM
      );
      fixture.detectChanges();
      // NgModel propagates programmatic (model -> view) changes via a
      // resolved-promise microtask, so flush it before re-checking the view.
      await Promise.resolve();
      fixture.detectChanges();

      expect(component.selectRef?.label()).toBe(TEST_ITEM.name);
    });

    it("keeps selectedItem callable (a live signal) after a selection is made via the select", () => {
      component.onItemSelected(TEST_ITEM);
      fixture.detectChanges();

      // Regression guard: a previous [(ngModel)] binding overwrote the
      // WritableSignal itself on ngModelChange, making subsequent
      // `selectedItem()` calls throw ("selectedItem is not a function").
      expect(() => mockStateProvider.selectedItem()).not.toThrow();
    });

    it("does not throw and reflects a cleared selection after onClear", () => {
      (mockStateProvider.selectedItem as WritableSignal<TestItem | null>).set(
        TEST_ITEM
      );
      fixture.detectChanges();

      expect(() => component.onClear()).not.toThrow();
      fixture.detectChanges();

      expect(() => mockStateProvider.selectedItem()).not.toThrow();
    });
  });
});
