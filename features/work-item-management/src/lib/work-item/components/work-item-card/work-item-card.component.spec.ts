import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import {
  DebugElement,
  NO_ERRORS_SCHEMA,
  Component,
  Input,
} from "@angular/core";
import { firstValueFrom, of, throwError } from "rxjs";
import { MessageService } from "primeng/api";
import { AuthorizationService } from "@mxflow/core/auth";
import { WorkItemCardComponent } from "./work-item-card.component";
import {
  WorkItem,
  WorkItemRedirectorService,
} from "@mxflow/features/work-item-management";
import { WorkItemService } from "../../services/work-item-api/work-item.service";
import { NotificationService } from "@mxflow/ui/alert";
import { WorkItemAssigneeAutocompleteComponent } from "../work-item-assignee-autocomplete/work-item-assignee-autocomplete.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { DueDatePickerComponent } from "../due-date-picker/due-date-picker.component";

const projectId = "project-1";
const bpId = "bp-1";

@Component({
  selector: "mxevolve-work-item-assignee-autocomplete",
  template: "",
  standalone: true,
})
class MockWorkItemAssigneeAutocompleteComponent {
  @Input() workItem: WorkItem;
  @Input() assignee: string | undefined;
}

describe("WorkItemCardComponent", () => {
  let component: WorkItemCardComponent;
  let fixture: ComponentFixture<WorkItemCardComponent>;
  let mockWorkItemRedirectorService: jest.Mocked<WorkItemRedirectorService>;
  let mockWorkItemService: jest.Mocked<WorkItemService>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  const mockWorkItem: WorkItem = {
    id: "1",
    name: "Test Work Item",
    projectId: projectId,
    businessProcesses: [{ id: bpId }],
    createdOn: new Date("2024-01-01T00:00:00Z"),
    dueDate: new Date("2024-01-10T00:00:00Z"),
  } as WorkItem;

  beforeEach(async () => {
    const workItemRedirectorSpy = {
      redirect: jest.fn(),
    } as unknown as jest.Mocked<WorkItemRedirectorService>;

    const workItemServiceSpy = {
      updateWorkItemAssignee: jest.fn(),
    } as unknown as jest.Mocked<WorkItemService>;

    const notificationServiceSpy = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    const messageServiceSpy = {
      add: jest.fn(),
      clear: jest.fn(),
    } as unknown as jest.Mocked<MessageService>;

    const authorizationServiceSpy = {
      isAuthorized: jest.fn(() => of(true)),
    } as unknown as jest.Mocked<AuthorizationService>;

    await TestBed.configureTestingModule({
      imports: [WorkItemCardComponent, NoopAnimationsModule],
      providers: [
        { provide: WorkItemService, useValue: workItemServiceSpy },
        { provide: MessageService, useValue: messageServiceSpy },
        { provide: AuthorizationService, useValue: authorizationServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(WorkItemCardComponent, {
        remove: {
          imports: [WorkItemAssigneeAutocompleteComponent],
          providers: [WorkItemRedirectorService, NotificationService],
        },
        add: {
          imports: [MockWorkItemAssigneeAutocompleteComponent],
          providers: [
            {
              provide: WorkItemRedirectorService,
              useValue: workItemRedirectorSpy,
            },
            { provide: NotificationService, useValue: notificationServiceSpy },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(WorkItemCardComponent);
    component = fixture.componentInstance;
    mockWorkItemRedirectorService = fixture.debugElement.injector.get(
      WorkItemRedirectorService
    ) as jest.Mocked<WorkItemRedirectorService>;
    mockWorkItemService = TestBed.inject(
      WorkItemService
    ) as jest.Mocked<WorkItemService>;
    mockNotificationService = fixture.debugElement.injector.get(
      NotificationService
    ) as jest.Mocked<NotificationService>;
    mockAuthorizationService = TestBed.inject(
      AuthorizationService
    ) as jest.Mocked<AuthorizationService>;
  });

  function getButton(testId: string): DebugElement | null {
    const wrapper = fixture.debugElement.query(
      By.css(`[data-testid="${testId}"]`)
    );
    if (!wrapper) return null;
    return wrapper.query(By.css("button")) || wrapper;
  }

  it("should create", () => {
    component.workItem = mockWorkItem;
    expect(component).toBeTruthy();
  });

  it("should initialize signals with default values", () => {
    component.workItem = mockWorkItem;

    expect(component.isEditingAssignee()).toBe(false);
    expect(component.isSavingAssignee()).toBe(false);
    expect(component.editedAssignee()).toBeUndefined();
  });

  describe("onRedirect", () => {
    it("should call workItemRedirectorService.redirect with workItem", () => {
      component.workItem = mockWorkItem;

      component.onRedirect();

      expect(mockWorkItemRedirectorService.redirect).toHaveBeenCalledWith(
        mockWorkItem
      );
    });
  });

  describe("openDueDatePicker", () => {
    it("should call show on dueDatePicker component", () => {
      const showSpy = jest.fn();
      component.dueDatePicker = {
        show: showSpy,
      } as unknown as DueDatePickerComponent;

      component.openDueDatePicker();

      expect(showSpy).toHaveBeenCalled();
    });
  });

  describe("due date button interaction", () => {
    it("should render due date button when user is authorized and dueDateEditable is true", async () => {
      component.workItem = { ...mockWorkItem, dueDateEditable: true };
      mockAuthorizationService.isAuthorized.mockReturnValue(of(true));

      fixture.detectChanges();
      await fixture.whenStable();

      const dueDateButton = getButton("open-due-date-picker-button");

      expect(dueDateButton).toBeTruthy();
    });

    it("should open date picker when due date button is clicked", async () => {
      component.workItem = { ...mockWorkItem, dueDateEditable: true };
      mockAuthorizationService.isAuthorized.mockReturnValue(of(true));

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const showSpy = jest.fn();
      component.dueDatePicker = {
        show: showSpy,
      } as unknown as DueDatePickerComponent;

      const dueDateButton = getButton("open-due-date-picker-button");
      dueDateButton!.nativeElement.click();

      expect(showSpy).toHaveBeenCalled();
    });
  });

  describe("onDueDateUpdated", () => {
    it("should update dueDate when onDueDateUpdated is called", () => {
      component.workItem = mockWorkItem;
      const newDate = new Date("2024-01-10T00:00:02Z");
      const updatedWorkItem = { ...mockWorkItem, dueDate: newDate };

      component.onDueDateUpdated(updatedWorkItem);

      expect(component.workItem.dueDate).toEqual(newDate);
    });
  });

  describe("canEditDueDate", () => {
    it("should return false when dueDateEditable is false", async () => {
      component.workItem = { ...mockWorkItem, dueDateEditable: false };

      const result = await firstValueFrom(component.canEditDueDate());

      expect(result).toBe(false);
    });

    it("should return true when dueDateEditable is true and user is authorized", async () => {
      component.workItem = { ...mockWorkItem, dueDateEditable: true };
      mockAuthorizationService.isAuthorized.mockReturnValue(of(true));

      const result = await firstValueFrom(component.canEditDueDate());

      expect(result).toBe(true);
      expect(mockAuthorizationService.isAuthorized).toHaveBeenCalledWith(
        {
          action: "update_due_date",
          resource: "work_item",
          package: "work_item_management",
          attributes: { workItem: component.workItem },
          projectId: component.workItem.projectId,
        },
        component.workItem.projectId
      );
    });

    it("should return false when dueDateEditable is true but user is not authorized", async () => {
      component.workItem = { ...mockWorkItem, dueDateEditable: true };
      mockAuthorizationService.isAuthorized.mockReturnValue(of(false));

      const result = await firstValueFrom(component.canEditDueDate());

      expect(result).toBe(false);
    });
  });

  describe("getElapsedTimePercentage", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-01-05T12:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should return 0 when workItem has no dueDate", () => {
      component.workItem = { ...mockWorkItem, dueDate: undefined };

      const result = component.getElapsedTimePercentage();

      expect(result).toBe(0);
    });

    it("should return 100 when current date is past due date", () => {
      jest.setSystemTime(new Date("2024-01-15T00:00:00Z"));
      component.workItem = mockWorkItem;

      const result = component.getElapsedTimePercentage();

      expect(result).toBe(100);
    });

    it("should return 100 when created date is after due date", () => {
      component.workItem = {
        ...mockWorkItem,
        createdOn: new Date("2024-01-15T00:00:00Z"),
        dueDate: new Date("2024-01-10T00:00:00Z"),
      };

      const result = component.getElapsedTimePercentage();

      expect(result).toBe(100);
    });

    it("should calculate correct percentage for work item in progress", () => {
      component.workItem = mockWorkItem;

      const result = component.getElapsedTimePercentage();

      expect(result).toBe(50);
    });

    it("should return 0 when current date is before created date", () => {
      jest.setSystemTime(new Date("2023-12-31T00:00:00Z"));

      component.workItem = mockWorkItem;

      const result = component.getElapsedTimePercentage();

      expect(result).toBe(0);
    });

    it("should return 0 when total time is 0 or negative", () => {
      component.workItem = {
        ...mockWorkItem,
        createdOn: new Date("2024-01-10T00:00:00Z"),
        dueDate: new Date("2024-01-10T00:00:00Z"),
      };

      const result = component.getElapsedTimePercentage();

      expect(result).toBe(0);
    });
  });

  describe("startEditingAssignee", () => {
    it("should enable editing mode and initialize editedAssignee when edit button is clicked", () => {
      component.workItem = { ...mockWorkItem, assignee: "test@example.com" };
      fixture.detectChanges();

      const editButton = getButton("edit-assignee-btn");
      editButton!.nativeElement.click();
      fixture.detectChanges();

      expect(editButton).toBeTruthy();
      expect(component.isEditingAssignee()).toBe(true);
      expect(component.editedAssignee()).toBe("test@example.com");
    });

    it("should enable editing mode with undefined assignee when edit button is clicked", () => {
      component.workItem = { ...mockWorkItem, assignee: undefined };
      fixture.detectChanges();

      const editButton = getButton("edit-assignee-btn");
      editButton!.nativeElement.click();
      fixture.detectChanges();

      expect(editButton).toBeTruthy();
      expect(component.isEditingAssignee()).toBe(true);
      expect(component.editedAssignee()).toBeUndefined();
    });
  });

  describe("cancelEditingAssignee", () => {
    it("should reset editing state when cancel button is clicked", () => {
      component.workItem = { ...mockWorkItem, assignee: "test@example.com" };
      component.isEditingAssignee.set(true);
      component.editedAssignee.set("changed@example.com");
      fixture.detectChanges();

      const cancelButton = getButton("cancel-assignee-btn");
      cancelButton!.nativeElement.click();
      fixture.detectChanges();

      expect(cancelButton).toBeTruthy();
      expect(component.isEditingAssignee()).toBe(false);
      expect(component.editedAssignee()).toBeUndefined();
    });

    it("should disable cancel button when save is in progress", () => {
      component.workItem = { ...mockWorkItem, assignee: "test@example.com" };
      component.isEditingAssignee.set(true);
      component.isSavingAssignee.set(true);
      fixture.detectChanges();

      const cancelButton = getButton("cancel-assignee-btn");

      expect(cancelButton!.nativeElement.disabled).toBe(true);
    });
  });

  describe("saveAssignee", () => {
    beforeEach(() => {
      component.workItem = { ...mockWorkItem, assignee: "old@example.com" };
    });

    it("should not call service when save is already in progress", () => {
      component.isSavingAssignee.set(true);
      component.editedAssignee.set("new@example.com");

      component.saveAssignee();

      expect(mockWorkItemService.updateWorkItemAssignee).not.toHaveBeenCalled();
    });

    it("should maintain editing state when save button is clicked", () => {
      component.isEditingAssignee.set(true);
      component.editedAssignee.set("new@example.com");
      fixture.detectChanges();

      const saveButton = getButton("save-assignee-btn");
      saveButton!.nativeElement.click();
      fixture.detectChanges();

      expect(saveButton).toBeTruthy();
      expect(component.isEditingAssignee()).toBe(true);
      expect(component.editedAssignee()).toBe("new@example.com");
    });

    it("should show loading state when save is in progress", () => {
      component.isEditingAssignee.set(true);
      component.isSavingAssignee.set(true);
      fixture.detectChanges();

      const saveButton = getButton("save-assignee-btn");

      expect(saveButton).toBeTruthy();
      expect(component.isSavingAssignee()).toBe(true);
    });

    it("should allow saving when assignee is undefined", () => {
      component.workItem = {
        ...mockWorkItem,
        assignee: "existing@example.com",
      };
      component.editedAssignee.set(undefined);

      component.saveAssignee();

      expect(component.isSavingAssignee()).toBe(false);
    });

    it("should show error and not call service when assignee is required but not provided", () => {
      component.workItem = {
        ...mockWorkItem,
        assignee: "existing@example.com",
        requireAssignee: true,
      } as WorkItem;
      component.editedAssignee.set(undefined);

      component.saveAssignee();

      expect(mockNotificationService.showError).toHaveBeenCalledWith(
        "Assignee is required for this work item."
      );
      expect(mockWorkItemService.updateWorkItemAssignee).not.toHaveBeenCalled();
      expect(component.isSavingAssignee()).toBe(false);
    });

    it("should allow saving when assignee is required and provided", () => {
      component.workItem = {
        ...mockWorkItem,
        assignee: "existing@example.com",
        requireAssignee: true,
      } as WorkItem;
      component.editedAssignee.set("new@example.com");

      component.saveAssignee();

      expect(mockNotificationService.showError).not.toHaveBeenCalled();
      expect(component.isSavingAssignee()).toBe(false);
    });

    it("should show backend error message when update fails", fakeAsync(() => {
      const backendError = {
        error: {
          status: 400,
          message: "Work Item with ID 123 requires an assignee to be set",
          timestamp: "2025-11-09T20:40:57.137317821Z",
          errors: {},
        },
      };
      component.workItem = { ...mockWorkItem, assignee: "old@example.com" };
      component.editedAssignee.set(undefined);
      fixture.detectChanges();
      mockWorkItemService.updateWorkItemAssignee.mockReturnValue(
        throwError(() => backendError)
      );

      component.saveAssignee();
      tick();
      fixture.detectChanges();

      expect(mockWorkItemService.updateWorkItemAssignee).toHaveBeenCalledWith(
        projectId,
        "1",
        undefined
      );
      expect(mockNotificationService.showError).toHaveBeenCalledWith(
        "Work Item with ID 123 requires an assignee to be set"
      );
      expect(component.isSavingAssignee()).toBe(false);
    }));

    it("should show fallback error message when backend error has no message", fakeAsync(() => {
      const genericError = { error: {} };
      component.workItem = { ...mockWorkItem, assignee: "old@example.com" };
      component.editedAssignee.set("new@example.com");
      fixture.detectChanges();
      mockWorkItemService.updateWorkItemAssignee.mockReturnValue(
        throwError(() => genericError)
      );

      component.saveAssignee();
      tick();
      fixture.detectChanges();

      expect(mockNotificationService.showError).toHaveBeenCalledWith(
        "Failed to update assignee"
      );
      expect(component.isSavingAssignee()).toBe(false);
    }));

    it("should show fallback error message when error structure is unexpected", fakeAsync(() => {
      const unexpectedError = new Error("Network error");
      component.workItem = { ...mockWorkItem, assignee: "old@example.com" };
      component.editedAssignee.set("new@example.com");
      fixture.detectChanges();
      mockWorkItemService.updateWorkItemAssignee.mockReturnValue(
        throwError(() => unexpectedError)
      );

      component.saveAssignee();
      tick();
      fixture.detectChanges();

      expect(mockNotificationService.showError).toHaveBeenCalledWith(
        "Failed to update assignee"
      );
      expect(component.isSavingAssignee()).toBe(false);
    }));
  });

  describe("assignee editing workflow", () => {
    it("should complete full edit and cancel workflow when user edits then cancels", () => {
      component.workItem = {
        ...mockWorkItem,
        assignee: "original@example.com",
      };
      fixture.detectChanges();

      const editButton = getButton("edit-assignee-btn");
      editButton!.nativeElement.click();
      fixture.detectChanges();

      expect(editButton).toBeTruthy();
      expect(component.isEditingAssignee()).toBe(true);
      expect(component.editedAssignee()).toBe("original@example.com");

      component.editedAssignee.set("new@example.com");
      fixture.detectChanges();

      expect(component.editedAssignee()).toBe("new@example.com");

      const cancelButton = getButton("cancel-assignee-btn");
      cancelButton!.nativeElement.click();
      fixture.detectChanges();

      expect(cancelButton).toBeTruthy();
      expect(component.isEditingAssignee()).toBe(false);
      expect(component.editedAssignee()).toBeUndefined();
    });

    it("should hide edit button when editing mode is active", () => {
      component.workItem = { ...mockWorkItem, assignee: "test@example.com" };
      component.isEditingAssignee.set(true);
      fixture.detectChanges();

      const editButton = getButton("edit-assignee-btn");

      expect(editButton).toBeFalsy();
    });

    it("should prevent multiple simultaneous saves when save is called multiple times", () => {
      component.workItem = mockWorkItem;
      component.isSavingAssignee.set(false);

      component.saveAssignee();
      component.isSavingAssignee.set(true);
      const firstCallCount =
        mockWorkItemService.updateWorkItemAssignee.mock.calls.length;

      component.saveAssignee();
      const secondCallCount =
        mockWorkItemService.updateWorkItemAssignee.mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount);
    });
  });
});
