import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MultiSelectModule } from "primeng/multiselect";
import { WorkItemsObjectIdMultiSelectComponent } from "./work-items-object-id-multi-select.component";
import { WorkItemsObjectIdMultiSelectStateService } from "./state-service/work-items-object-id-multi-select-state.service";

type ObjectIdOption = { id: string };
type Signal<T> = ReturnType<typeof signal<T>>;

interface MockState {
  setPageIndexSubject: jest.Mock<void, [number]>;
  setSearchKeySubject: jest.Mock<void, [string]>;
  setProjectIdsSubject: jest.Mock<void, [string[]]>;
  workItemObjectIdOptionsSignal: Signal<ObjectIdOption[]>;
  isLastPageSignal: Signal<boolean>;
  isLoadingDataSignal: Signal<boolean>;
  pageIndexSignal: Signal<number>;
  searchKeySignal: Signal<string>;
  errorMessageSignal: Signal<string>;
}

describe("WorkItemsObjectIdMultiSelectComponent", () => {
  let fixture: ComponentFixture<WorkItemsObjectIdMultiSelectComponent>;
  let component: WorkItemsObjectIdMultiSelectComponent;
  let mockState: MockState;

  beforeEach(async () => {
    mockState = {
      setPageIndexSubject: jest.fn(),
      setSearchKeySubject: jest.fn(),
      setProjectIdsSubject: jest.fn(),
      workItemObjectIdOptionsSignal: signal([{ id: "WI-1" }, { id: "WI-2" }]),
      isLastPageSignal: signal(false),
      isLoadingDataSignal: signal(false),
      pageIndexSignal: signal(0),
      searchKeySignal: signal(""),
      errorMessageSignal: signal(""),
    };

    await TestBed.configureTestingModule({
      imports: [
        WorkItemsObjectIdMultiSelectComponent,
        MultiSelectModule,
        FormsModule,
        ReactiveFormsModule,
      ],
    })
      .overrideComponent(WorkItemsObjectIdMultiSelectComponent, {
        set: {
          providers: [
            {
              provide: WorkItemsObjectIdMultiSelectStateService,
              useValue: mockState,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(WorkItemsObjectIdMultiSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit selectedObjectIdsChange on selection change", () => {
    const spy = jest.spyOn(component.selectedObjectIdsChange, "emit");
    component.handleSelectionChange([{ id: "WI-1" }, { id: "WI-2" }]);
    expect(spy).toHaveBeenCalledWith([{ id: "WI-1" }, { id: "WI-2" }]);
  });

  it("should reset page on search change", () => {
    component.handleSearchKeyChange("abc");
    expect(mockState.setPageIndexSubject).toHaveBeenCalledWith(0);
    expect(mockState.setSearchKeySubject).toHaveBeenCalledWith("abc");
  });

  it("should clear search key", () => {
    mockState.searchKeySignal.set("abc");
    const stop = jest.fn();
    component.handleClearSearchKey({ stopPropagation: stop });
    expect(mockState.setSearchKeySubject).toHaveBeenCalledWith("");
    expect(mockState.setPageIndexSubject).toHaveBeenCalledWith(0);
  });

  describe("sortedOptions", () => {
    it("should put selected options at the top if all are in the current page", () => {
      component.selectedObjectIds = [{ id: "WI-2" }, { id: "WI-1" }];
      mockState.workItemObjectIdOptionsSignal.set([
        { id: "WI-1" },
        { id: "WI-2" },
        { id: "WI-3" },
      ]);
      fixture.detectChanges();
      const sorted = component.sortedOptions();
      expect(sorted.slice(0, 2).map((o) => o.id)).toEqual(["WI-1", "WI-2"]);
      expect(sorted.map((o) => o.id)).toContain("WI-3");
    });

    it("should put selected options at the top even if some are not in the current page", () => {
      component.selectedObjectIds = [{ id: "WI-2" }, { id: "WI-1" }];
      mockState.workItemObjectIdOptionsSignal.set([
        { id: "WI-3" },
        { id: "WI-4" },
      ]);
      fixture.detectChanges();
      const sorted = component.sortedOptions();
      expect(sorted[0].id).toBe("WI-2");
      expect(sorted[1].id).toBe("WI-1");
      expect(sorted.map((o) => o.id)).toContain("WI-3");
      expect(sorted.map((o) => o.id)).toContain("WI-4");
    });

    it("should not duplicate selected options if already in the current page", () => {
      component.selectedObjectIds = [{ id: "WI-1" }];
      mockState.workItemObjectIdOptionsSignal.set([
        { id: "WI-1" },
        { id: "WI-2" },
      ]);
      fixture.detectChanges();
      const sorted = component.sortedOptions();
      expect(sorted.filter((o) => o.id === "WI-1").length).toBe(1);
    });

    it("should return all options if nothing is selected", () => {
      component.selectedObjectIds = [];
      mockState.workItemObjectIdOptionsSignal.set([
        { id: "WI-1" },
        { id: "WI-2" },
        { id: "WI-3" },
      ]);
      fixture.detectChanges();
      const sorted = component.sortedOptions();
      expect(sorted.map((o) => o.id)).toEqual(["WI-1", "WI-2", "WI-3"]);
    });
  });
});
