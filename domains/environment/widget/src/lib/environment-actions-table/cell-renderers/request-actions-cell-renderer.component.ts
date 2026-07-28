import { Component, signal } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { ButtonModule } from "primeng/button";
import { Tooltip } from "primeng/tooltip";
import {
  CopyToClipboardComponent,
  MxevolveIconComponent,
} from "@mxevolve/shared/ui/primitive";
import { ManagementRequest } from "@mxevolve/domains/environment/data-access";
import { ManagementRequestMetricsDialogComponent } from "../../management-request-metrics-dialog/management-request-metrics-dialog.component";

export interface RequestActionsCellRendererParams extends ICellRendererParams {
  projectId: string;
  environmentId: string;
}

@Component({
  selector: "mxevolve-request-actions-cell-renderer",
  standalone: true,
  imports: [
    ButtonModule,
    Tooltip,
    MxevolveIconComponent,
    CopyToClipboardComponent,
    ManagementRequestMetricsDialogComponent,
  ],
  template: `
    @if (request(); as req) {
    <div class="flex gap-3 justify-end">
      <span [pTooltip]="'Copy request ID'" tooltipPosition="top">
        <mxevolve-copy-to-clipboard [value]="req.id" />
      </span>
      @if (req.hasMetrics) {
      <span class="cursor-pointer">
        <mxevolve-icon
          pTooltip="Metrics"
          tooltipPosition="top"
          (click)="openMetrics()"
          (keydown)="openMetrics()"
          data-testid="metrics-button"
          name="poll"
          size="md"
          [color]="'#007bff'"
        />
      </span>
      }
    </div>
    <mxevolve-management-request-metrics-dialog
      [visible]="metricsDialogVisible()"
      [projectId]="projectId()"
      [environmentId]="environmentId()"
      [managementRequestId]="req.id"
      (closed)="metricsDialogVisible.set(false)"
    />
    }
  `,
})
export class RequestActionsCellRendererComponent
  implements ICellRendererAngularComp
{
  readonly request = signal<ManagementRequest | undefined>(undefined);
  readonly projectId = signal("");
  readonly environmentId = signal("");
  readonly metricsDialogVisible = signal(false);

  agInit(params: RequestActionsCellRendererParams): void {
    this.request.set(params.data as ManagementRequest);
    this.projectId.set(params.projectId);
    this.environmentId.set(params.environmentId);
  }

  refresh(): boolean {
    return false;
  }

  openMetrics(): void {
    this.metricsDialogVisible.set(true);
  }
}
