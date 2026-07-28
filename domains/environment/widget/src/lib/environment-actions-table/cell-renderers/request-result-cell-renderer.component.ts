import { Component, computed, signal } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { Dialog } from "primeng/dialog";
import { ManagementRequest } from "@mxevolve/domains/environment/data-access";
import { RequestResultStatusComponent } from "@mxevolve/domains/environment/ui";

@Component({
  selector: "mxevolve-request-result-cell-renderer",
  standalone: true,
  imports: [RequestResultStatusComponent, Dialog],
  template: `
    @if (request(); as req) { @if (isStatusClickable()) {
    <span class="cursor-pointer" (click)="openDialog()">
      <mxevolve-request-result-status
        [status]="req.status"
        [resultStatus]="req.resultStatus"
        [resultMessage]="req.resultMessage"
      />
    </span>
    } @else {
    <mxevolve-request-result-status
      [status]="req.status"
      [resultStatus]="req.resultStatus"
      [resultMessage]="req.resultMessage"
    />
    } }
    <p-dialog
      header="Message"
      [visible]="dialogVisible()"
      (visibleChange)="dialogVisible.set($event)"
      [modal]="true"
      [closeOnEscape]="true"
      [dismissableMask]="true"
      [style]="{ width: '50rem' }"
      appendTo="body"
    >
      <p>{{ dialogMessage() }}</p>
    </p-dialog>
  `,
})
export class RequestResultCellRendererComponent
  implements ICellRendererAngularComp
{
  readonly request = signal<ManagementRequest | undefined>(undefined);
  readonly dialogVisible = signal(false);

  readonly isStatusClickable = computed(() => {
    const req = this.request();
    if (!req) {
      return false;
    }
    if (req.status === "ENDED" && req.resultMessage) {
      return true;
    }
    return !!(req.statusMessage && req.statusMessage.trim() !== "");
  });

  readonly dialogMessage = computed(() => {
    const req = this.request();
    if (!req) {
      return "";
    }
    if (req.status === "ENDED") {
      return req.resultMessage ?? "No details available";
    }
    return req.statusMessage ?? "No details available";
  });

  agInit(params: ICellRendererParams): void {
    this.request.set(params.data as ManagementRequest);
  }

  refresh(): boolean {
    return false;
  }

  openDialog(): void {
    if (this.isStatusClickable()) {
      this.dialogVisible.set(true);
    }
  }
}
