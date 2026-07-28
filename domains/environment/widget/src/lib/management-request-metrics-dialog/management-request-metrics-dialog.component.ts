import { Component, input, output } from "@angular/core";
import { Dialog } from "primeng/dialog";
import { ManagementRequestMetricsTableComponent } from "../management-request-metrics-table/management-request-metrics-table.component";

@Component({
  selector: "mxevolve-management-request-metrics-dialog",
  standalone: true,
  imports: [Dialog, ManagementRequestMetricsTableComponent],
  template: `
    <p-dialog
      header="Metrics"
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      [modal]="true"
      [maximizable]="true"
      [contentStyle]="{ height: '100%', overflow: 'auto' }"
      [style]="{ width: '60vw', height: '60vh' }"
      appendTo="body"
    >
      @if (visible() && managementRequestId()) {
      <mxevolve-management-request-metrics-table
        [projectId]="projectId()"
        [environmentId]="environmentId()"
        [managementRequestId]="managementRequestId()!"
      />
      }
    </p-dialog>
  `,
})
export class ManagementRequestMetricsDialogComponent {
  readonly projectId = input.required<string>();
  readonly environmentId = input.required<string>();
  readonly managementRequestId = input<string>();
  readonly visible = input(false);
  readonly closed = output<void>();

  protected onVisibleChange(value: boolean): void {
    if (!value) {
      this.closed.emit();
    }
  }
}
