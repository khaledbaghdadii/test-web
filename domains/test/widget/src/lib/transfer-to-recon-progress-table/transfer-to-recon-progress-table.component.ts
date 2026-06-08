import { Component, computed, inject, input, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { TableModule } from "primeng/table";
import { CommonModule } from "@angular/common";
import {
  TableCheckboxFilterComponent,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { Skeleton } from "primeng/skeleton";
import { ReconService } from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";
import { DurationPipeModule } from "@mxflow/pipe";
import { TransferToReconStatusComponent } from "../transfer-to-recon-status/transfer-to-recon-status.component";
import { catchError, of } from "rxjs";
import {
  TransferToReconProgressStatus,
  TransferToReconProgressStatusDisplayValue,
} from "@mxevolve/domains/test/model";
import { FormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { Tooltip } from "primeng/tooltip";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-transfer-to-recon-progress-table",
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TableEmptyMessageComponent,
    TableCheckboxFilterComponent,
    Skeleton,
    DurationPipeModule,
    TransferToReconStatusComponent,
    Button,
    Tooltip,
    HeaderTitleModule,
    MxevolveIconComponent,
  ],
  providers: [ReconService],
  templateUrl: "./transfer-to-recon-progress-table.component.html",
})
export class TransferToReconProgressTableComponent {
  readonly projectId = input.required<string>();
  readonly scenarioExecutionId = input.required<string>();
  readonly testExecutionId = input.required<string>();

  private readonly reconService = inject(ReconService);
  private readonly toastMessageService = inject(ToastMessageService);

  private readonly transferProgressResource = rxResource({
    params: () => ({
      projectId: this.projectId(),
      scenarioExecutionId: this.scenarioExecutionId(),
      testExecutionId: this.testExecutionId(),
    }),
    stream: ({ params }) =>
      this.reconService.fetch(params).pipe(
        catchError(() => {
          this.toastMessageService.showError(
            "Failed to load transfer progress"
          );
          return of([]);
        })
      ),
  });

  readonly rows = computed(() => this.transferProgressResource.value() ?? []);
  readonly isLoading = computed(() =>
    this.transferProgressResource.isLoading()
  );

  selectedStatuses = signal<string[]>([]);

  readonly statusFilterOptions = Object.values(
    TransferToReconProgressStatus
  ).map((status) => ({
    value: status,
    text: TransferToReconProgressStatusDisplayValue[status],
  }));

  handleRefresh() {
    this.transferProgressResource.set([]);
    this.transferProgressResource.reload();
  }

  protected readonly Array = Array;
}
