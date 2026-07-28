import { Component, inject } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-enterprise";
import { ScenarioExecutionUriFactoryPipe } from "@mxflow/test-management";
import { DynamicDialogRef } from "primeng/dynamicdialog";
import type { CommitTestExecutionRow } from "@mxevolve/domains/scm/widget";

@Component({
  selector: "mxevolve-scenario-execution-link-cell-renderer",
  standalone: true,
  providers: [ScenarioExecutionUriFactoryPipe],
  template: `
    @if (url) {
    <a
      [href]="url"
      target="_blank"
      rel="noopener noreferrer"
      class="text-primary hover:underline"
      (click)="onNavigate()"
    >
      {{ label }}
    </a>
    } @else {
    <span>{{ label }}</span>
    }
  `,
})
export class ScenarioExecutionLinkCellRendererComponent
  implements ICellRendererAngularComp
{
  private readonly scenarioExecutionUriFactoryPipe = inject(
    ScenarioExecutionUriFactoryPipe
  );
  private readonly dialogRef = inject(DynamicDialogRef, { optional: true });

  label = "";
  url: string | null = null;

  agInit(params: ICellRendererParams): void {
    const row = params.data as CommitTestExecutionRow | undefined;
    this.label = params.value ?? row?.name ?? "";

    if (!row?.projectId || !row?.id) {
      this.url = null;
      return;
    }

    this.url = this.scenarioExecutionUriFactoryPipe.transform(
      row.id,
      row.projectId
    );
  }

  refresh(): boolean {
    return false;
  }

  onNavigate(): void {
    this.dialogRef?.close();
  }
}
