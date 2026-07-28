import { Component, inject } from "@angular/core";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-enterprise";
import { ScenarioRunStatusDisplayComponent } from "@mxevolve/domains/test/ui";
import { DialogService } from "primeng/dynamicdialog";
import {
  CommitTestExecutionsDialogComponent,
  CommitTestExecutionRow,
  CommitTestExecutionsDialogData,
} from "../commit-test-executions-dialog/commit-test-executions-dialog.component";

@Component({
  selector: "mxevolve-commit-test-executions-cell-renderer",
  standalone: true,
  imports: [ScenarioRunStatusDisplayComponent],
  template: `
    @if (executions.length > 0) {
    <div (click)="onClick()" class="cursor-pointer">
      <mxevolve-scenario-run-status-display [status]="executions[0].status" />
    </div>
    } @else {
    <span class="text-surface-400 text-sm">—</span>
    }
  `,
})
export class CommitTestExecutionsCellRendererComponent
  implements ICellRendererAngularComp
{
  private readonly dialogService = inject(DialogService);

  executions: CommitTestExecutionRow[] = [];
  private commitId = "";

  agInit(params: ICellRendererParams): void {
    this.commitId = params.data?.id ?? "";
    this.executions = params.data?.executions ?? [];
  }

  refresh(): boolean {
    return true;
  }

  onClick(): void {
    if (!this.commitId || this.executions.length === 0) return;

    this.dialogService.open(CommitTestExecutionsDialogComponent, {
      header: `Runs on Commit ID: ${this.commitId}`,
      width: "60rem",
      modal: true,
      closable: true,
      closeOnEscape: true,
      draggable: false,
      data: {
        commitId: this.commitId,
        executions: this.executions,
      } satisfies CommitTestExecutionsDialogData,
    });
  }
}
