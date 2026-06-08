import { Component, EventEmitter, inject, Input, Output } from "@angular/core";

import { FormsModule } from "@angular/forms";
import { DatePickerModule } from "primeng/datepicker";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { WorkItemService } from "../../services/work-item-api/work-item.service";
import { firstValueFrom } from "rxjs";
import { WorkItem } from "../../model/work-item";
import { NotificationService } from "@mxflow/ui/alert";
import { HttpErrorResponse } from "@angular/common/http";

@Component({
  selector: "mxevolve-due-date-picker",
  templateUrl: "./due-date-picker.component.html",
  standalone: true,
  imports: [FormsModule, DatePickerModule, ButtonModule, DialogModule],
})
export class DueDatePickerComponent {
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) workItemId: string;
  @Input() currentDueDate?: Date | null;
  @Output() dueDateUpdated = new EventEmitter<WorkItem>();

  selectedDate: Date | null = null;
  isVisible = false;

  private readonly workItemService = inject(WorkItemService);
  private readonly notificationService = inject(NotificationService);

  show() {
    this.selectedDate = this.currentDueDate
      ? new Date(this.currentDueDate)
      : null;
    this.isVisible = true;
  }

  hide() {
    this.isVisible = false;
    this.selectedDate = null;
  }

  async onConfirm() {
    if (!this.selectedDate) {
      return;
    }
    try {
      const adjustedDate = new Date(this.selectedDate);
      adjustedDate.setHours(23, 59, 59, 999);
      const updatedWorkItem = await firstValueFrom(
        this.workItemService.updateDueDate(
          this.projectId,
          this.workItemId,
          adjustedDate
        )
      );
      this.dueDateUpdated.emit(updatedWorkItem);
      this.hide();
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this.notificationService.showError(errorMessage);
    }
  }

  onCancel() {
    this.hide();
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message || "Failed to update due date";
    }
    return "Failed to update due date";
  }
}
