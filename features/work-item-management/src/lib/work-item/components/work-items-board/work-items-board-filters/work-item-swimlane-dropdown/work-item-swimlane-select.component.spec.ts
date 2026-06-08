import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { By } from "@angular/platform-browser";
import { WorkItemSwimlaneSelectComponent } from "./work-item-swimlane-select.component";
import { WorkItemBoardStateService } from "../../services/state/work-item-board-state.service";
import { SelectModule } from "primeng/select";
import { WorkItemSwimlaneSelectOption } from "../../model/work-item-swimlane-select-option";
import { WorkItemSwimlaneOptionType } from "../../model/work-item-swimlane-option-type.enum";

class MockWorkItemBoardStateService {
  swimlaneOptions: WorkItemSwimlaneSelectOption[] = [
    { label: "Priority", value: WorkItemSwimlaneOptionType.PRIORITY },
    { label: "Category", value: WorkItemSwimlaneOptionType.CATEGORY },
    { label: "Due Date", value: WorkItemSwimlaneOptionType.DUE_DATE },
  ];

  filters = {
    sortBy: () => WorkItemSwimlaneOptionType.PRIORITY,
  };

  setSortBy = jest.fn();
}

describe("WorkItemSwimlaneSelectComponent", () => {
  let fixture: ComponentFixture<WorkItemSwimlaneSelectComponent>;
  let component: WorkItemSwimlaneSelectComponent;
  let state: MockWorkItemBoardStateService;

  beforeEach(async () => {
    state = new MockWorkItemBoardStateService();

    TestBed.overrideComponent(WorkItemSwimlaneSelectComponent, {
      set: {
        providers: [{ provide: WorkItemBoardStateService, useValue: state }],
      },
    });

    await TestBed.configureTestingModule({
      imports: [
        WorkItemSwimlaneSelectComponent,
        CommonModule,
        FormsModule,
        SelectModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkItemSwimlaneSelectComponent);
    component = fixture.componentInstance;
  });

  it("should renders select with correct options", () => {
    fixture.detectChanges();

    const select = fixture.debugElement.query(By.css("p-select"));

    expect(select).toBeTruthy();
    expect(component.options.length).toBe(3);
    expect(component.options[0].label).toBe("Priority");
    expect(component.options[1].label).toBe("Category");
    expect(component.options[2].label).toBe("Due Date");
  });

  it("should binds selected value from service", () => {
    fixture.detectChanges();

    expect(component.selected).toBe("priority");
  });

  it("should calls setSortBy when selection changes", () => {
    fixture.detectChanges();
    const newValue = WorkItemSwimlaneOptionType.CATEGORY;

    component.onSortByChange(newValue);

    expect(state.setSortBy).toHaveBeenCalledWith(
      WorkItemSwimlaneOptionType.CATEGORY
    );
  });
});
