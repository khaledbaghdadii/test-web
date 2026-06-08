import { ToastMessageService } from "@mxflow/ui/alert";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { CardContainerModule } from "@mxflow/ui/container";
import { FailureReasonsDataService } from "../failure-reasons-data.service";
import { Subject, takeUntil } from "rxjs";

import { ButtonModule } from "primeng/button";
import { CreateFailureReasonModalComponent } from "../create-failure-reason-modal/create-failure-reason-modal.component";
import { CreateFailureReasonRequest } from "../create-failure-reason-modal/create-failure-reason-request";
import {
  FailureReasonsTableComponent,
  FailureReasonTableData,
  SwitchEnabledRequest,
} from "../failure-reasons-table/failure-reasons-table.component";
import { FailureReason } from "../failure-reason";

@Component({
  selector: "mxevolve-failure-reasons-page",
  templateUrl: "./failure-reasons-page.component.html",
  imports: [
    HeaderTitleModule,
    CardContainerModule,
    ButtonModule,
    CreateFailureReasonModalComponent,
    FailureReasonsTableComponent,
  ],
})
export class FailureReasonsPageComponent implements OnInit, OnDestroy {
  private failureReasonDataService = inject(FailureReasonsDataService);
  private toastMessageService = inject(ToastMessageService);

  private readonly destroy$ = new Subject();

  isLoading = false;
  isCreateFailureReasonLoading = false;
  isCreateFailureReasonModalShown = false;
  failureReasonsTableData: FailureReasonTableData[] = [];

  ngOnInit() {
    this.fetchAllFailureReasons();
  }

  private fetchAllFailureReasons() {
    this.isLoading = true;
    this.failureReasonDataService
      .getFailureReasons()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reasons) => {
          this.failureReasonsTableData =
            this.mapToFailureReasonTableData(reasons);
          this.isLoading = false;
        },
        error: (error) => {
          this.handleErrorMessage(error);
          this.isLoading = false;
        },
      });
  }

  switchEnabledValue(request: SwitchEnabledRequest) {
    const failureReasonToSwitch = this.findFailureReasonById(
      request.reasonId,
      this.failureReasonsTableData
    );
    failureReasonToSwitch.isDisabled = true;
    failureReasonToSwitch.isLoading = true;
    this.failureReasonDataService
      .toggleFailureReasonActivation(request.reasonId, request.newValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          failureReasonToSwitch.isDisabled = false;
          failureReasonToSwitch.isLoading = false;
        },
        error: (error) => {
          failureReasonToSwitch.isDisabled = false;
          failureReasonToSwitch.isLoading = false;
          failureReasonToSwitch.isEnabled = !failureReasonToSwitch.isEnabled;
          this.handleErrorMessage(error);
        },
      });
  }

  handleFailureReasonCreationCancelled(): void {
    this.isCreateFailureReasonModalShown = false;
  }

  openCreateFailureReasonModal() {
    this.isCreateFailureReasonModalShown = true;
  }

  handleFailureReasonCreationSubmitted(
    createFailureReasonRequest: CreateFailureReasonRequest
  ): void {
    this.isCreateFailureReasonLoading = true;
    this.failureReasonDataService
      .createFailureReason(createFailureReasonRequest)
      .subscribe({
        next: () => {
          this.fetchAllFailureReasons();
          this.toastMessageService.showSuccess(
            "Failure reason added successfully!"
          );
          this.isCreateFailureReasonLoading = false;
          this.isCreateFailureReasonModalShown = false;
        },
        error: (error) => {
          this.isCreateFailureReasonLoading = false;
          this.handleErrorMessage(error);
        },
      });
  }

  private mapToFailureReasonTableData(
    reasons: FailureReason[]
  ): FailureReasonTableData[] {
    return reasons.map((reason) => ({
      ...reason,
      isDisabled: false,
      isLoading: false,
    }));
  }

  private findFailureReasonById(
    id: string,
    reasons: FailureReasonTableData[]
  ): FailureReasonTableData {
    const reason = reasons.find((reason) => reason.id === id);
    if (!reason) {
      throw new Error(`Failure Reason with ID ${id} not found.`);
    }
    return reason;
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  private handleErrorMessage(message: string) {
    this.toastMessageService.showError(message);
  }
}
