import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { DueDatePickerComponent } from "./due-date-picker.component";
import { WorkItemService } from "../../services/work-item-api/work-item.service";
import { WorkItem } from "@mxflow/features/work-item-management";
import { NotificationService } from "@mxflow/ui/alert";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { HttpErrorResponse } from "@angular/common/http";

describe("DueDatePickerComponent", () => {
  let component: DueDatePickerComponent;
  let fixture: ComponentFixture<DueDatePickerComponent>;
  let mockWorkItemService: jest.Mocked<WorkItemService>;
  let notificationService: jest.Mocked<NotificationService>;

  const projectId = "project-1";
  const bpId = "bp-1";
  const workItemId = "work-item-1";
  const currentDate = new Date("2025-11-04T11:59:59Z");
  const mockWorkItem: WorkItem = {
    id: "1",
    projectId: projectId,
    businessProcesses: [{ id: bpId }],
    createdOn: new Date("2024-01-01T00:00:00Z"),
    dueDate: new Date("2024-01-10T00:00:00Z"),
  } as WorkItem;

  beforeEach(async () => {
    const workItemServiceSpy = {
      updateDueDate: jest.fn(),
    } as unknown as jest.Mocked<WorkItemService>;
    const notificationServiceSpy = {
      showError: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    await TestBed.configureTestingModule({
      imports: [DueDatePickerComponent, NoopAnimationsModule],
      providers: [
        { provide: WorkItemService, useValue: workItemServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DueDatePickerComponent);
    component = fixture.componentInstance;
    mockWorkItemService = TestBed.inject(
      WorkItemService
    ) as jest.Mocked<WorkItemService>;
    notificationService = TestBed.inject(
      NotificationService
    ) as jest.Mocked<NotificationService>;

    component.projectId = projectId;
    component.workItemId = workItemId;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("show", () => {
    it("should set selectedDate to currentDueDate when it exists", () => {
      component.currentDueDate = currentDate;
      component.show();

      expect(component.selectedDate).toEqual(new Date(currentDate));
      expect(component.isVisible).toBe(true);
    });

    it("should set selectedDate to null when currentDueDate is null", () => {
      component.currentDueDate = null;
      component.show();

      expect(component.selectedDate).toBeNull();
      expect(component.isVisible).toBe(true);
    });

    it("should set selectedDate to null when currentDueDate is undefined", () => {
      component.currentDueDate = undefined;
      component.show();

      expect(component.selectedDate).toBeNull();
      expect(component.isVisible).toBe(true);
    });
  });

  describe("hide", () => {
    it("should set isVisible to false and clear selectedDate", () => {
      component.isVisible = true;
      component.selectedDate = currentDate;

      component.hide();

      expect(component.isVisible).toBe(false);
      expect(component.selectedDate).toBeNull();
    });
  });

  describe("onConfirm", () => {
    const selectedDate = new Date("2025-11-06");
    const expectedDate = new Date(selectedDate);
    expectedDate.setHours(23, 59, 59, 999);

    beforeEach(() => {
      component.selectedDate = selectedDate;
      component.isVisible = true;
    });

    it("should call updateDueDate service with correct parameters", async () => {
      mockWorkItemService.updateDueDate.mockReturnValue(of(mockWorkItem));

      await component.onConfirm();

      expect(mockWorkItemService.updateDueDate).toHaveBeenCalledWith(
        projectId,
        workItemId,
        expectedDate
      );
    });

    it("should emit updatedWorkItem event on successful update", async () => {
      mockWorkItemService.updateDueDate.mockReturnValue(of(mockWorkItem));
      const emitSpy = jest.spyOn(component.dueDateUpdated, "emit");

      await component.onConfirm();

      expect(emitSpy).toHaveBeenCalledWith(mockWorkItem);
    });

    it("should hide the picker on successful update", async () => {
      mockWorkItemService.updateDueDate.mockReturnValue(of(mockWorkItem));

      await component.onConfirm();

      expect(component.isVisible).toBe(false);
      expect(component.selectedDate).toBeNull();
    });

    it("should show error notification when update fails", async () => {
      const error = new Error("Update failed");
      mockWorkItemService.updateDueDate.mockReturnValue(
        throwError(() => error)
      );

      await component.onConfirm();

      expect(notificationService.showError).toHaveBeenCalledWith(
        "Failed to update due date"
      );
    });

    it("should show custom error message from HttpErrorResponse", async () => {
      const httpError = new HttpErrorResponse({
        error: { message: "Custom error message" },
        status: 400,
      });
      mockWorkItemService.updateDueDate.mockReturnValue(
        throwError(() => httpError)
      );

      await component.onConfirm();

      expect(notificationService.showError).toHaveBeenCalledWith(
        "Custom error message"
      );
    });

    it("should show default error when HttpErrorResponse has no message", async () => {
      const httpError = new HttpErrorResponse({
        error: {},
        status: 500,
      });
      mockWorkItemService.updateDueDate.mockReturnValue(
        throwError(() => httpError)
      );

      await component.onConfirm();

      expect(notificationService.showError).toHaveBeenCalledWith(
        "Failed to update due date"
      );
    });

    it("should not call service when selectedDate is null", async () => {
      component.selectedDate = null;

      await component.onConfirm();

      expect(mockWorkItemService.updateDueDate).not.toHaveBeenCalled();
    });

    it("should not emit event when selectedDate is null", async () => {
      component.selectedDate = null;
      const emitSpy = jest.spyOn(component.dueDateUpdated, "emit");

      await component.onConfirm();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe("onCancel", () => {
    it("should hide the picker", () => {
      component.isVisible = true;
      component.selectedDate = currentDate;

      component.onCancel();

      expect(component.isVisible).toBe(false);
      expect(component.selectedDate).toBeNull();
    });
  });

  const getButton = (testId: string): HTMLButtonElement => {
    return fixture.debugElement.nativeElement.querySelector(
      `p-button[data-testid="${testId}"] button`
    );
  };

  describe("Button interactions via id", () => {
    beforeEach(async () => {
      component.show();
      component.selectedDate = new Date("2025-11-06T11:59:59Z");
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it("should call onConfirm when Confirm button is clicked", async () => {
      mockWorkItemService.updateDueDate.mockReturnValue(of(mockWorkItem));
      const onConfirmSpy = jest.spyOn(component, "onConfirm");

      const confirmButtonElement = getButton("confirm-due-date-button");

      expect(confirmButtonElement).toBeTruthy();

      confirmButtonElement.dispatchEvent(new Event("click"));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(onConfirmSpy).toHaveBeenCalled();
    });

    it("should call onCancel when Cancel button is clicked", async () => {
      const onCancelSpy = jest.spyOn(component, "onCancel");

      const cancelButtonElement = getButton("cancel-due-date-button");

      expect(cancelButtonElement).toBeTruthy();

      cancelButtonElement.dispatchEvent(new Event("click"));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(onCancelSpy).toHaveBeenCalled();
    });

    it("should disable Confirm button when selectedDate is null", async () => {
      component.selectedDate = null;
      fixture.detectChanges();
      await fixture.whenStable();

      const confirmButtonElement = getButton("confirm-due-date-button");

      expect(confirmButtonElement).toBeTruthy();
      expect(confirmButtonElement.disabled).toBe(true);
    });

    it("should enable Confirm button when selectedDate is set", async () => {
      component.selectedDate = new Date("2025-11-06T11:59:59Z");
      fixture.detectChanges();
      await fixture.whenStable();

      const confirmButtonElement = getButton("confirm-due-date-button");

      expect(confirmButtonElement).toBeTruthy();
      expect(confirmButtonElement.disabled).toBe(false);
    });
  });
});
