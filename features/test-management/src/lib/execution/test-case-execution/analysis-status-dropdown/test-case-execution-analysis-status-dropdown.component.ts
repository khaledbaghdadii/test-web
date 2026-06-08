import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { TestCaseExecution } from "../test-case-execution";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  TestCaseExecutionAnalysisStatus,
  TestCaseExecutionAnalysisStatusDisplayValue,
} from "../analysis-status/test-case-execution-analysis-status";
import { UpdateTestCaseExecutionAnalysisStatusRequest } from "../update-test-case-execution-analysis-status-request";
import { FormsModule } from "@angular/forms";
import { Select, SelectChangeEvent } from "primeng/select";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { TestCaseExecutionService } from "../test-case-execution.service";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import { AnalysisObjectLinkingComponent } from "../../analysis-object-link/analysis-object-linking/analysis-object-linking.component";
import {
  TestCaseExecutionAnalysisStatusIneligibilityReason,
  TestCaseExecutionAnalysisStatusIneligibilityReasonDisplayMessage,
} from "../analysis-status-eligibility/test-case-execution-analysis-status-ineligibility-reason";
import { PrimeTemplate } from "primeng/api";
import { Tooltip } from "primeng/tooltip";
import { TestCaseExecutionAnalysisStatusTransitionEligibility } from "../analysis-status-eligibility/test-case-executions-analyisis-status-eligibility";

@Component({
  imports: [
    FormsModule,
    HeaderTitleModule,
    AnalysisObjectLinkingComponent,
    PrimeTemplate,
    Tooltip,
    Select,
  ],
  selector: "mxevolve-test-case-execution-analysis-status-dropdown",
  templateUrl: "./test-case-execution-analysis-status-dropdown.component.html",
})
export class TestCaseExecutionAnalysisStatusDropdownComponent {
  nextAnalysisStatusOptions: {
    label: string;
    value: TestCaseExecutionAnalysisStatus;
    tooltip: string;
    disabled: boolean;
  }[] = [];
  selectedStatus: TestCaseExecutionAnalysisStatus | undefined;
  disabled = true;
  isLoading = false;
  protected readonly TestCaseExecutionAnalysisStatusDisplayValue =
    TestCaseExecutionAnalysisStatusDisplayValue;
  private _testCaseExecution: TestCaseExecution | undefined = undefined;

  @Input({ required: true })
  set testCaseExecution(testCaseExecution: TestCaseExecution | undefined) {
    this._testCaseExecution = testCaseExecution;
    this.disabled = true;
    this.selectedStatus = testCaseExecution?.analysisStatus;
    this.reloadAnalysisStatus();
  }

  reloadAnalysisStatus() {
    this.nextAnalysisStatusOptions = [];
    const testCaseExecution = this._testCaseExecution;
    if (testCaseExecution) {
      this.isLoading = true;
      this.testCaseExecutionService
        .fetchAnalysisStatusEligibility(
          testCaseExecution.projectId,
          testCaseExecution.id
        )
        .subscribe((eligibility) => {
          this.disabled = !eligibility.eligibleToUpdateTestCaseAnalysisStatus;
          this.nextAnalysisStatusOptions =
            eligibility.nextAnalysisStatusTransitionEligibilities.map(
              (nextAnalysisStatus) => ({
                label:
                  TestCaseExecutionAnalysisStatusDisplayValue[
                    nextAnalysisStatus.analysisStatus
                  ],
                value: nextAnalysisStatus.analysisStatus,
                disabled:
                  this.isAnalysisStatusMenuItemDisabled(nextAnalysisStatus),
                tooltip:
                  this.getAnalysisStatusMenuItemTooltip(nextAnalysisStatus),
              })
            );
        })
        .add(() => {
          this.isLoading = false;
        });
    }
  }

  private getAnalysisStatusMenuItemTooltip(
    nextAnalysisStatus: TestCaseExecutionAnalysisStatusTransitionEligibility
  ): string {
    if (
      this.isCancelled(nextAnalysisStatus.analysisStatus) &&
      this.isIneligibleDueToNoFailureReasonsLinked(nextAnalysisStatus)
    ) {
      return "";
    }
    return TestCaseExecutionAnalysisStatusIneligibilityReasonDisplayMessage[
      nextAnalysisStatus.ineligibilityReason
    ];
  }

  private isAnalysisStatusMenuItemDisabled(
    nextAnalysisStatus: TestCaseExecutionAnalysisStatusTransitionEligibility
  ): boolean {
    if (
      this.isCancelled(nextAnalysisStatus.analysisStatus) &&
      this.isIneligibleDueToNoFailureReasonsLinked(nextAnalysisStatus)
    ) {
      return false;
    }
    return !nextAnalysisStatus.eligible;
  }

  private isIneligibleDueToNoFailureReasonsLinked(
    nextAnalysisStatus: TestCaseExecutionAnalysisStatusTransitionEligibility
  ) {
    return (
      !nextAnalysisStatus.eligible &&
      nextAnalysisStatus.ineligibilityReason ===
        TestCaseExecutionAnalysisStatusIneligibilityReason.NO_FAILURE_REASONS_LINKED
    );
  }

  private isCancelled(analysisStatus: TestCaseExecutionAnalysisStatus) {
    return analysisStatus === TestCaseExecutionAnalysisStatus.CANCELLED;
  }

  get testCaseExecution(): TestCaseExecution | undefined {
    return this._testCaseExecution;
  }

  @Output() statusUpdate = new EventEmitter<void>();

  private toastMessageService = inject(ToastMessageService);
  private testCaseExecutionService = inject(TestCaseExecutionService);

  onStatusChange(event: SelectChangeEvent) {
    const targetAnalysisStatus: TestCaseExecutionAnalysisStatus = event.value;
    if (targetAnalysisStatus === TestCaseExecutionAnalysisStatus.CANCELLED) {
      this.originalStatusBeforeModal = this._testCaseExecution?.analysisStatus;
      this.failureReasonLinksChanged = false;
      this.isFailureReasonModalVisible = true;
    } else {
      this.updateAnalysisStatus(targetAnalysisStatus);
    }
  }

  private updateAnalysisStatus(status: TestCaseExecutionAnalysisStatus) {
    const testCaseExecution = this.testCaseExecution;
    const currentStatus = testCaseExecution?.analysisStatus;
    this.testCaseExecutionService
      .updateAnalysisStatus({
        analysisStatus: status,
        testCaseExecutionId: testCaseExecution?.id,
        projectId: this.testCaseExecution?.projectId,
      } as UpdateTestCaseExecutionAnalysisStatusRequest)
      .subscribe({
        next: () => {
          if (this._testCaseExecution) {
            this._testCaseExecution.analysisStatus = status;
          }
          this.toastMessageService.showSuccess(
            "Status successfully updated to " +
              TestCaseExecutionAnalysisStatusDisplayValue[status]
          );
          this.statusUpdate.emit();
        },
        error: (err) => {
          this.toastMessageService.showError(
            "Failed to update status: " + err.message
          );
          this.selectedStatus = currentStatus;
        },
      });
  }

  protected readonly AnalysisObjectType = AnalysisObjectType;
  isFailureReasonModalVisible = false;
  private originalStatusBeforeModal:
    | TestCaseExecutionAnalysisStatus
    | undefined;
  private failureReasonLinksChanged = false;

  onModalVisibilityChange(isVisible: boolean) {
    this.isFailureReasonModalVisible = isVisible;

    if (!isVisible) {
      if (
        !this.failureReasonLinksChanged &&
        this.originalStatusBeforeModal !== undefined
      ) {
        this.selectedStatus = this.originalStatusBeforeModal;
      }
      this.originalStatusBeforeModal = undefined;
      this.failureReasonLinksChanged = false;
    }
  }

  onFailureReasonLinksChanged() {
    this.failureReasonLinksChanged = true;
    this.updateAnalysisStatus(TestCaseExecutionAnalysisStatus.CANCELLED);
  }

  preventClicksOnDisabled($event: Event, disabled: boolean) {
    if (disabled) {
      $event.stopPropagation();
    }
  }
}
