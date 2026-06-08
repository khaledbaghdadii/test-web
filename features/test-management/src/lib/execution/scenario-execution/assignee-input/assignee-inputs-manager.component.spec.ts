import { AssigneeInputsManagerComponent } from "./assignee-inputs-manager.component";
import { QueryList } from "@angular/core";
import { AssigneeInputComponent } from "./assignee-input.component";
import { Subject } from "rxjs";
import { ComponentFixture, TestBed } from "@angular/core/testing";

describe("AssigneeInputsManagerComponentComponent", () => {
  let component: AssigneeInputsManagerComponent;
  let changeDetectorSpy: jest.SpyInstance;
  let fixture: ComponentFixture<AssigneeInputsManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssigneeInputsManagerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AssigneeInputsManagerComponent);
    component = fixture.componentInstance;

    changeDetectorSpy = jest.spyOn(
      component["changeDetector"],
      "detectChanges"
    );
  });

  it("should set is loading assignees to false if all components have been loaded", () => {
    expect(component.assigneeComponentsLoading).toBeTruthy();
    const queryList = new QueryList<AssigneeInputComponent>();
    const assigneeComponent1 = {
      isLoadingUsers: false,
    } as AssigneeInputComponent;
    const assigneeComponent2 = {
      isLoadingUsers: false,
    } as AssigneeInputComponent;
    const assigneeInputComponents = [assigneeComponent1, assigneeComponent2];
    queryList.reset(assigneeInputComponents);
    component.assigneeInputComponents = queryList;
    component.handleAssigneeFinishedLoading();
    expect(component.assigneeComponentsLoading).toBeFalsy();
  });

  it("should set is loading assignees to true if not all components have been loaded", () => {
    const queryList = new QueryList<AssigneeInputComponent>();
    const assigneeComponent1 = {
      isLoadingUsers: false,
    } as AssigneeInputComponent;
    const assigneeComponent2 = {
      isLoadingUsers: true,
    } as AssigneeInputComponent;
    const assigneeInputComponents = [assigneeComponent1, assigneeComponent2];
    queryList.reset(assigneeInputComponents);
    component.assigneeInputComponents = queryList;
    component.handleAssigneeFinishedLoading();
    expect(component.assigneeComponentsLoading).toBeTruthy();
  });

  it("should set is loading assignees to true if not all components are still loading", () => {
    const queryList = new QueryList<AssigneeInputComponent>();
    const assigneeComponent1 = {
      isLoadingUsers: true,
    } as AssigneeInputComponent;
    const assigneeComponent2 = {
      isLoadingUsers: true,
    } as AssigneeInputComponent;
    const assigneeInputComponents = [assigneeComponent1, assigneeComponent2];
    queryList.reset(assigneeInputComponents);
    component.assigneeInputComponents = queryList;
    component.handleAssigneeFinishedLoading();
    expect(component.assigneeComponentsLoading).toBeTruthy();
  });

  it("should subscribe to changes in assignee component list and set loading to true upon the change", (done) => {
    const queryList = new QueryList<AssigneeInputComponent>();
    const assigneeComponent1 = {} as AssigneeInputComponent;
    const assigneeComponent2 = {} as AssigneeInputComponent;
    const assigneeInputComponents = [assigneeComponent1, assigneeComponent2];
    queryList.reset(assigneeInputComponents);
    component.assigneeComponentsLoading = false;
    component.assigneeInputComponents = queryList;
    const changes = new Subject();
    jest.spyOn(queryList, "changes", "get").mockReturnValue(changes);
    component.ngAfterViewInit();
    changes.subscribe(() => {
      expect(changeDetectorSpy).toHaveBeenCalled();
      expect(component.assigneeComponentsLoading).toBeTruthy();
      done();
    });
    changes.next({});
  });

  it("should destroy subject", () => {
    const destroyNextSpy = jest.spyOn(component["destroy$"], "next");
    const destroyCompleteSpy = jest.spyOn(component["destroy$"], "complete");

    component.ngOnDestroy();

    expect(destroyNextSpy).toHaveBeenCalled();
    expect(destroyCompleteSpy).toHaveBeenCalled();
  });
});
