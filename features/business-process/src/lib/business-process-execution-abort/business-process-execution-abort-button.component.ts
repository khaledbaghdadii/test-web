import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { Button } from "primeng/button";
import { ToastMessageService } from "@mxflow/ui/alert";
import { BusinessProcessExecutionAbortService } from "./service/business-process-execution-abort.service";
import { BusinessProcessExecutionStatus } from "../business-process-execution-status/business-process-execution-status";
import { Tooltip } from "primeng/tooltip";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import { BusinessProcessResourcesService } from "../business-process-resources/business-process-resources.service";
import {
  BusinessProcessResource,
  ResourceType,
} from "../business-process-resources/business-process-resource";
import { AsyncPipe } from "@angular/common";
import {
  BranchNameByDevelopmentPipe,
  ScmManagementService,
} from "@mxflow/features/scm";
import { Checkbox } from "primeng/checkbox";
import { ReactiveFormsModule, UntypedFormControl } from "@angular/forms";
import { AbortBusinessProcessExecutionRequest } from "./service/abort-business-process-execution-request";
import { BusinessProcessFamilies } from "../business-process-definition/business-process-family";
import {
  AnalyticsTrackerService,
  EventCategory,
  EventAction,
} from "@mxflow/core/analytics-tracker";

@Component({
  selector: "mxevolve-business-process-execution-abort-button",
  imports: [
    Button,
    Tooltip,
    ConfirmDialog,
    AsyncPipe,
    BranchNameByDevelopmentPipe,
    Checkbox,
    ReactiveFormsModule,
  ],
  providers: [
    BusinessProcessExecutionAbortService,
    BusinessProcessResourcesService,
    ScmManagementService,
  ],
  templateUrl: "business-process-execution-abort-button.component.html",
})
export class BusinessProcessExecutionAbortButtonComponent implements OnInit {
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) processId: string;
  @Input({ required: true }) status: string;
  @Input({ required: true }) familyId: BusinessProcessFamilies;
  @Input() iconButton = false;
  @Input() successMessageText =
    "Business process execution successfully aborted";

  @Output() businessProcessAborted = new EventEmitter<void>();

  @Input() disabled = false;
  @Output() disabledChange = new EventEmitter<boolean>();

  executionNotAbortable: boolean;
  isLoading = false;

  developmentId: string | undefined;
  deleteDevelopmentFormControl = new UntypedFormControl(false);

  private readonly abortService = inject(BusinessProcessExecutionAbortService);
  private readonly resourcesService = inject(BusinessProcessResourcesService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly toastService = inject(ToastMessageService);
  private readonly analyticsTracker = inject(AnalyticsTrackerService);

  ngOnInit(): void {
    this.executionNotAbortable =
      this.status !== BusinessProcessExecutionStatus.RUNNING &&
      this.status !== BusinessProcessExecutionStatus.PENDING_INPUT;

    this.deleteDevelopmentFormControl.setValue(
      this.familyId === BusinessProcessFamilies.USER_STORY_BUILD_AND_TEST
    );
  }

  openAbortDialog($event: Event) {
    this.isLoading = true;
    this.disabledChange.emit(true);

    this.resourcesService
      .getBusinessProcessResources(this.projectId, this.processId)
      .subscribe({
        next: (resources: BusinessProcessResource[]) => {
          this.developmentId = resources.find((resource) => {
            return (
              resource.resourceType === ResourceType.DEVELOPMENT &&
              resource.usageTags.length === 0
            );
          })?.resourceId;

          this.isLoading = false;
          this.disabledChange.emit(false);
          this.confirmAbort($event);
        },
        error: () => {
          this.toastService.showError(
            "Unable to load branches for housekeeping decisions. Please try again later. If the issue persists, contact the support team for assistance."
          );
          this.isLoading = false;
          this.disabledChange.emit(false);
          this.confirmAbort($event);
        },
      });
  }

  private confirmAbort($event: Event) {
    this.confirmationService.confirm({
      target: $event.target as EventTarget,
      key: `${this.processId}-abort-dialog`,
      header: "Abort Business Process Execution",
      rejectButtonProps: {
        label: "Cancel",
        severity: "secondary",
        outlined: true,
      },
      acceptButtonProps: {
        label: "Abort",
        severity: "danger",
      },
      accept: () => this.abortBusinessProcess(),
    });
  }

  abortBusinessProcess() {
    this.isLoading = true;
    this.abortService.abort(this.getAbortBusinessProcessRequest()).subscribe({
      next: () => {
        this.toastService.showSuccess(this.successMessageText);
        this.analyticsTracker.trackEvent(
          EventCategory.BUTTON,
          EventAction.CLICK_BUTTON,
          `Abort Business Process - ${this.familyId}`
        );
        this.businessProcessAborted.emit();
        this.executionNotAbortable = true;
        this.isLoading = false;
      },
      error: (error: { message: string }) => {
        this.toastService.showError(error.message);
        this.isLoading = false;
      },
    });
  }

  private getAbortBusinessProcessRequest(): AbortBusinessProcessExecutionRequest {
    return {
      projectId: this.projectId,
      processId: this.processId,
      shouldCleanDevelopment: this.deleteDevelopmentFormControl.value,
      developmentId: this.developmentId,
    };
  }
}
