import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WorkItemPriorityFilterComponent } from "./work-item-priority-filter.component";
import { WorkItemPriority } from "../../../../model/work-item";

describe("WorkItemPriorityFilterComponent", () => {
  let component: WorkItemPriorityFilterComponent;
  let fixture: ComponentFixture<WorkItemPriorityFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkItemPriorityFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkItemPriorityFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should expose correct priorityOptions getter", () => {
    expect(component.priorityOptions).toEqual([
      { label: "High", value: WorkItemPriority.HIGH },
      { label: "Medium", value: WorkItemPriority.MEDIUM },
      { label: "Low", value: WorkItemPriority.LOW },
    ]);
  });

  it("should emit priority change", () => {
    const priorityChangeSpy = jest.spyOn(
      component.workItemPriorityChange,
      "emit"
    );
    component.onPriorityChange(WorkItemPriority.HIGH);
    expect(priorityChangeSpy).toHaveBeenCalledWith(WorkItemPriority.HIGH);
  });
});
