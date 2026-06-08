import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WorkItemCategoryIconComponent } from "./work-item-category-icon.component";
import {
  faCircleHalfStroke,
  faCodeMerge,
  faQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { WorkItem } from "@mxflow/features/work-item-management";
import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";

const workItem = {
  id: "1",
} as unknown as WorkItem;

describe("WorkItemCategoryIconComponent", () => {
  let component: WorkItemCategoryIconComponent;
  let fixture: ComponentFixture<WorkItemCategoryIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkItemCategoryIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkItemCategoryIconComponent);
    component = fixture.componentInstance;
    component.workItem = workItem;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("getCategoryIcon", () => {
    it("should return merge icon for merge_request_review category", () => {
      component.workItem.workItemCategory = "merge_request_review";
      expect(component.getCategoryIcon()).toBe(faCodeMerge);
    });

    it("should return half circle icon for business_process category", () => {
      component.workItem.workItemCategory = "business_process";
      expect(component.getCategoryIcon()).toBe(faCircleHalfStroke);
    });

    it("should return cross icon for test_execution_failure category", () => {
      component.workItem.workItemCategory = "test_execution_failure";
      expect(component.getCategoryIcon()).toBe(faCircleXmark);
    });

    it("should return question icon for unknown category", () => {
      component.workItem.workItemCategory = "unknown_category";
      expect(component.getCategoryIcon()).toBe(faQuestion);
    });

    it("should return question icon for empty category", () => {
      component.workItem.workItemCategory = "";
      expect(component.getCategoryIcon()).toBe(faQuestion);
    });
  });

  describe("getCategorySeverity", () => {
    it("should return warn severity for merge_request_review category", () => {
      component.workItem.workItemCategory = "merge_request_review";
      expect(component.getCategorySeverity()).toBe("warn");
    });

    it("should return warn severity for business_process category", () => {
      component.workItem.workItemCategory = "business_process";
      expect(component.getCategorySeverity()).toBe("warn");
    });

    it("should return danger severity for test_execution_failure category", () => {
      component.workItem.workItemCategory = "test_execution_failure";
      expect(component.getCategorySeverity()).toBe("danger");
    });

    it("should return info severity for unknown category", () => {
      component.workItem.workItemCategory = "unknown_category";
      expect(component.getCategorySeverity()).toBe("info");
    });

    it("should return info severity for empty category", () => {
      component.workItem.workItemCategory = "";
      expect(component.getCategorySeverity()).toBe("info");
    });
  });
});
