import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MxevolveMultiselectDropdownComponent } from "./mxevolve-multiselect-dropdown.component";
import { DestroyRef, signal, WritableSignal } from "@angular/core";
import { LazyLoadEvent, PrimeTemplate } from "primeng/api";
import { MultiSelect } from "primeng/multiselect";
import { FormsModule } from "@angular/forms";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { Subject } from "rxjs";
import { DropdownOption } from "../models/dropdown-option.interface";
import { MxEvolveDropdownState } from "../models/dropdown-state.interface";

interface TestItem {
  id: string;
  name: string;
}

let fixture: ComponentFixture<
  MxevolveMultiselectDropdownComponent<TestItem, { testParam: string }>
>;
let component: MxevolveMultiselectDropdownComponent<
  TestItem,
  { testParam: string }
>;
let mockStateProvider: jest.Mocked<
  MxEvolveDropdownState<TestItem, { testParam: string }>
>;

describe("MxevolveMultiselectDropdownComponent", () => {
  const TEST_ITEM: TestItem = { id: "1", name: "Test Item" };
  const TEST_PARAMS = { testParam: "test" };
  const SEARCH_KEY = "search";

  beforeEach(async () => {
    mockStateProvider = {
      setDataParams: jest.fn(),
      setSelectedItems: jest.fn(),
      attemptLoadingMoreItems: jest.fn(),
      setSearchKey: jest.fn(),
      setPageIndex: jest.fn(),
      errorMessageSubject: new Subject<string>(),
      items: signal<TestItem[]>([TEST_ITEM]),
      dropdownOptions: signal<DropdownOption<TestItem>[]>([
        { label: TEST_ITEM.name, value: TEST_ITEM },
      ]),
      selectedItems: signal<TestItem[]>([]),
      searchKey: signal<string>(SEARCH_KEY),
      loading: signal<boolean>(false),
      itemsPage: signal(undefined),
    } as unknown as jest.Mocked<
      MxEvolveDropdownState<TestItem, { testParam: string }>
    >;

    const mockDestroyRef = {
      onDestroy: jest.fn(),
    } as unknown as DestroyRef;

    await TestBed.configureTestingModule({
      imports: [
        MultiSelect,
        FormsModule,
        IconField,
        InputIcon,
        InputText,
        PrimeTemplate,
        MxevolveMultiselectDropdownComponent,
      ],
      providers: [{ provide: DestroyRef, useValue: mockDestroyRef }],
    }).compileComponents();

    fixture = TestBed.createComponent(
      MxevolveMultiselectDropdownComponent<TestItem, { testParam: string }>
    );
    fixture.componentRef.setInput("stateProvider", mockStateProvider);
    fixture.componentRef.setInput("dataParams", TEST_PARAMS);
    fixture.componentRef.setInput("config", {});
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe("ControlValueAccessor", () => {
    it("should set selected items in state service when writeValue is called", () => {
      component.writeValue([TEST_ITEM]);

      expect(mockStateProvider.setSelectedItems).toHaveBeenCalledWith([
        TEST_ITEM,
      ]);
    });

    it("should handle null value in writeValue", () => {
      component.writeValue(null as unknown as TestItem[]);

      expect(mockStateProvider.setSelectedItems).toHaveBeenCalledWith([]);
    });

    it("should propagate changes when onItemsSelected is called", () => {
      const onChangeSpy = jest.fn();
      component.registerOnChange(onChangeSpy);

      component.onItemsSelected([TEST_ITEM]);

      expect(onChangeSpy).toHaveBeenCalledWith([TEST_ITEM]);
    });

    it("should emit selectionChange when items are selected", () => {
      const selectionChangeSpy = jest.fn();
      component.selectionChange.subscribe(selectionChangeSpy);

      component.onItemsSelected([TEST_ITEM]);

      expect(selectionChangeSpy).toHaveBeenCalledWith([TEST_ITEM]);
    });
  });

  describe("onClear", () => {
    it("should clear selected items and propagate changes", () => {
      const onChangeSpy = jest.fn();
      component.registerOnChange(onChangeSpy);

      component.onClear();

      expect(onChangeSpy).toHaveBeenCalledWith([]);
    });

    it("should emit selectionChange with empty array on clear", () => {
      const selectionChangeSpy = jest.fn();
      component.selectionChange.subscribe(selectionChangeSpy);

      component.onClear();

      expect(selectionChangeSpy).toHaveBeenCalledWith([]);
    });
  });

  describe("onScroll", () => {
    it("should attempt loading more items when scrolled to bottom", () => {
      const event: LazyLoadEvent = { last: 1 };

      component.onScroll(event);

      expect(mockStateProvider.attemptLoadingMoreItems).toHaveBeenCalled();
    });

    it("should not attempt loading when not at bottom", () => {
      const event: LazyLoadEvent = { last: 0 };

      component.onScroll(event);

      expect(mockStateProvider.attemptLoadingMoreItems).not.toHaveBeenCalled();
    });
  });

  describe("onFilter", () => {
    beforeEach(() => {
      component.multiSelectRef = {
        scrollInView: jest.fn(),
      } as unknown as MultiSelect;
    });

    it("should set search key and reset page index", () => {
      component.onFilter("test");

      expect(mockStateProvider.setSearchKey).toHaveBeenCalledWith("test");
      expect(mockStateProvider.setPageIndex).toHaveBeenCalledWith(0);
    });

    it("should scroll to top of dropdown", () => {
      component.onFilter("test");

      expect(component.multiSelectRef.scrollInView).toHaveBeenCalledWith(0);
    });
  });

  describe("onFilterCleared", () => {
    beforeEach(() => {
      component.multiSelectRef = {
        scrollInView: jest.fn(),
      } as unknown as MultiSelect;
    });

    it("should clear search key and reset page when search key exists", () => {
      const event = { stopPropagation: jest.fn() };

      component.onFilterCleared(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockStateProvider.setSearchKey).toHaveBeenCalledWith("");
      expect(mockStateProvider.setPageIndex).toHaveBeenCalledWith(0);
    });

    it("should not clear when search key is empty", () => {
      const emptySearchMockStateProvider = {
        ...mockStateProvider,
        searchKey: signal<string>(""), // Empty search key
      } as unknown as jest.Mocked<
        MxEvolveDropdownState<TestItem, { testParam: string }>
      >;

      // Recreate component with the new mock
      const newFixture = TestBed.createComponent(
        MxevolveMultiselectDropdownComponent<TestItem, { testParam: string }>
      );
      newFixture.componentRef.setInput(
        "stateProvider",
        emptySearchMockStateProvider
      );
      newFixture.componentRef.setInput("dataParams", TEST_PARAMS);
      newFixture.componentRef.setInput("config", {});
      const newComponent = newFixture.componentInstance;
      newComponent.multiSelectRef = {
        scrollInView: jest.fn(),
      } as unknown as MultiSelect;
      newFixture.detectChanges();

      const event = { stopPropagation: jest.fn() };

      newComponent.onFilterCleared(event);

      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should emit error event when state service emits error", () => {
      const errorEventSpy = jest.fn();
      component.errorEvent.subscribe(errorEventSpy);
      const ERROR_MESSAGE = "Error occurred";

      mockStateProvider.errorMessageSubject.next(ERROR_MESSAGE);

      expect(errorEventSpy).toHaveBeenCalledWith(ERROR_MESSAGE);
    });
  });

  describe("config merging", () => {
    it("should use default values when no config provided", () => {
      component.ngOnInit();

      expect(component.mergedConfig.placeholder).toBe("Select Items");
      expect(component.mergedConfig.showClear).toBe(true);
      expect(component.mergedConfig.pageSize).toBe(10);
      expect(component.mergedConfig.debounceTime).toBe(200);
      expect(component.mergedConfig.virtualScrollItemSize).toBe(45);
      expect(component.mergedConfig.virtualScrollStep).toBe(8);
      expect(component.mergedConfig.maxSelectedLabels).toBe(3);
      expect(component.mergedConfig.selectionLimit).toBeUndefined();
      expect(component.mergedConfig.panelStyle).toEqual({});
    });

    it("should merge custom config with defaults", () => {
      fixture.componentRef.setInput("config", {
        placeholder: "Custom Placeholder",
        pageSize: 25,
      });
      component.ngOnInit();

      expect(component.mergedConfig.placeholder).toBe("Custom Placeholder");
      expect(component.mergedConfig.pageSize).toBe(25);
      expect(component.mergedConfig.showClear).toBe(true);
    });

    it("should support selectionLimit configuration", () => {
      fixture.componentRef.setInput("config", {
        selectionLimit: 10,
      });
      component.ngOnInit();

      expect(component.mergedConfig.selectionLimit).toBe(10);
    });

    it("should support maxSelectedLabels configuration", () => {
      fixture.componentRef.setInput("config", {
        maxSelectedLabels: 5,
      });
      component.ngOnInit();

      expect(component.mergedConfig.maxSelectedLabels).toBe(5);
    });

    it("should support panelStyle configuration", () => {
      fixture.componentRef.setInput("config", {
        panelStyle: { "min-width": "20rem", "min-height": "40px" },
      });
      component.ngOnInit();

      expect(component.mergedConfig.panelStyle).toEqual({
        "min-width": "20rem",
        "min-height": "40px",
      });
    });
  });

  describe("selected items display (ngModel binding)", () => {
    it("displays the selected item's label instead of the placeholder", async () => {
      (
        mockStateProvider.selectedItems as unknown as WritableSignal<TestItem[]>
      ).set([TEST_ITEM]);
      fixture.detectChanges();
      // NgModel propagates programmatic (model -> view) changes via a
      // resolved-promise microtask, so flush it before re-checking the view.
      await Promise.resolve();
      fixture.detectChanges();

      expect(component.multiSelectRef?.label()).toBe(TEST_ITEM.name);
    });

    it("keeps selectedItems callable (a live signal) after a selection is made via the multiselect", () => {
      component.onItemsSelected([TEST_ITEM]);
      fixture.detectChanges();

      // Regression guard: a previous [(ngModel)] binding overwrote the
      // WritableSignal itself on ngModelChange, making subsequent
      // `selectedItems()` calls throw ("selectedItems is not a function").
      expect(() => mockStateProvider.selectedItems()).not.toThrow();
    });

    it("does not throw and reflects a cleared selection after onClear", () => {
      (
        mockStateProvider.selectedItems as unknown as WritableSignal<TestItem[]>
      ).set([TEST_ITEM]);
      fixture.detectChanges();

      expect(() => component.onClear()).not.toThrow();
      fixture.detectChanges();

      expect(() => mockStateProvider.selectedItems()).not.toThrow();
    });
  });
});
