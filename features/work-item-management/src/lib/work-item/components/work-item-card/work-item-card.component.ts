import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit,
  signal,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { ProgressBarModule } from "primeng/progressbar";
import { Button } from "primeng/button";
import { catchError, finalize, Observable, of, switchMap, tap } from "rxjs";
import { AvatarModule } from "primeng/avatar";
import { Tooltip } from "primeng/tooltip";
import { WorkItemCategoryIconComponent } from "../work-item-category-icon/work-item-category-icon.component";
import { ShowMoreLessTextComponent } from "@mxflow/ui/utils";
import { WorkItemRedirectorService } from "../../services/work-item-redirector-service/work-item-redirector.service";
import { WorkItem } from "../../model/work-item";
import { WorkItemTimeUtilitiesService } from "../../utilities/work-item-time-utilities.service";
import { WorkItemAssigneeAutocompleteComponent } from "../work-item-assignee-autocomplete/work-item-assignee-autocomplete.component";
import {
  AuthorizationService,
  ShowElementIfAuthorizedDirective,
} from "@mxflow/core/auth";
import { WorkItemService } from "../../services/work-item-api/work-item.service";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { NotificationService } from "@mxflow/ui/alert";
import { DueDatePickerComponent } from "../due-date-picker/due-date-picker.component";
import { CopyableModule } from "@mxflow/directive";

@Component({
  selector: "mxevolve-work-item-card",
  templateUrl: "./work-item-card.component.html",
  imports: [
    CommonModule,
    CardModule,
    TagModule,
    HeaderTitleModule,
    ProgressBarModule,
    AvatarModule,
    Button,
    Tooltip,
    WorkItemCategoryIconComponent,
    ShowMoreLessTextComponent,
    WorkItemAssigneeAutocompleteComponent,
    ShowElementIfAuthorizedDirective,
    DueDatePickerComponent,
    CopyableModule,
  ],
  providers: [WorkItemRedirectorService, NotificationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class WorkItemCardComponent {
  @ViewChild(DueDatePickerComponent) dueDatePicker!: DueDatePickerComponent;

  @Input({ required: true }) workItem!: WorkItem;

  readonly isEditingAssignee = signal(false);
  readonly isSavingAssignee = signal(false);
  readonly editedAssignee = signal<string | undefined>(undefined);
  private readonly saveAssigneeTrigger = signal<{
    projectId: string;
    workItemId: string;
    assignee: string | undefined;
  } | null>(null);

  private readonly redirectorService = inject(WorkItemRedirectorService);
  private readonly workItemService = inject(WorkItemService);
  private readonly notificationService = inject(NotificationService);
  private readonly authorizationService = inject(AuthorizationService);

  constructor() {
    toSignal(this.createAssigneeUpdateStream());
  }

  onRedirect(): void {
    this.redirectorService.redirect(this.workItem);
  }

  getElapsedTimePercentage(): number {
    return WorkItemTimeUtilitiesService.getElapsedTimePercentage(this.workItem);
  }

  openDueDatePicker() {
    this.dueDatePicker.show();
  }

  onDueDateUpdated(updatedWorkItem: WorkItem) {
    this.workItem.dueDate = updatedWorkItem.dueDate;
  }

  canEditDueDate(): Observable<boolean> {
    if (!this.workItem.dueDateEditable) {
      return of(false);
    }
    return this.authorizationService.isAuthorized(
      {
        action: "update_due_date",
        resource: "work_item",
        package: "work_item_management",
        attributes: { workItem: this.workItem },
        projectId: this.workItem.projectId,
      },
      this.workItem.projectId
    );
  }

  startEditingAssignee(): void {
    this.isEditingAssignee.set(true);
    this.editedAssignee.set(this.workItem.assignee);
  }

  cancelEditingAssignee(): void {
    this.isEditingAssignee.set(false);
    this.editedAssignee.set(undefined);
  }

  saveAssignee(): void {
    if (this.isSavingAssignee()) {
      return;
    }
    if (this.workItem.requireAssignee && !this.editedAssignee()) {
      this.notificationService.showError(
        "Assignee is required for this work item."
      );
      return;
    }
    this.saveAssigneeTrigger.set({
      projectId: this.workItem.projectId,
      workItemId: this.workItem.id,
      assignee: this.editedAssignee(),
    });
  }

  private createAssigneeUpdateStream(): Observable<WorkItem | null> {
    return toObservable(this.saveAssigneeTrigger).pipe(
      switchMap((trigger) => {
        if (!trigger) {
          return of(null);
        }
        this.isSavingAssignee.set(true);
        return this.workItemService
          .updateWorkItemAssignee(
            trigger.projectId,
            trigger.workItemId,
            trigger.assignee
          )
          .pipe(
            tap((updatedWorkItem) => {
              this.workItem = {
                ...this.workItem,
                assignee: updatedWorkItem.assignee,
              };
              this.isEditingAssignee.set(false);
              this.editedAssignee.set(undefined);
              this.saveAssigneeTrigger.set(null);
            }),
            catchError((error) => {
              const errorMessage =
                error?.error?.message || "Failed to update assignee";
              this.notificationService.showError(errorMessage);
              return of(null);
            }),
            finalize(() => this.isSavingAssignee.set(false))
          );
      })
    );
  }
}
