import { Component, computed, signal } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-enterprise";
import {
  ExecutionFamily,
  ExecutionStatus,
} from "@mxevolve/domains/business-process/util";
import { ExecutionAbortButtonComponent } from "../execution-abort-button/execution-abort-button.component";
import {
  RepushEligibleEvent,
  RepushModalOpenerComponent,
} from "../repush-modal-opener/repush-modal-opener.component";

/** The run fields the Actions cell needs to drive abort + repush. */
export interface RunActionsRow {
  projectId: string;
  processId: string;
  status: ExecutionStatus;
  familyId: ExecutionFamily;
  familyName?: string;
  sourceDefinitionId?: string | null;
}

/**
 * AG Grid cell-renderer params for {@link RunActionsCellComponent}. `terminal`
 * (history rows) forces the abort into its non-abortable state; `onAborted`
 * lets the consumer react after a successful abort (in addition to the grid
 * reload the cell performs).
 */
export type RunActionsCellParams<T extends RunActionsRow = RunActionsRow> =
  ICellRendererParams<T> & {
    terminal?: boolean;
    onAborted?: () => void;
    /**
     * Called when the Repush eligibility gate passes, so the consuming landing
     * page can open the pre-filled executor for the run.
     */
    onRepush?: (event: RepushEligibleEvent) => void;
  };

/**
 * Sticky Actions cell shared by the Active Runs and Show History tables. It
 * composes the already-migrated new-arch abort button and the new-arch repush
 * opener for the row's run. On terminal history rows the abort is rendered
 * non-abortable (disabled) while repush stays available; after a successful
 * abort the grid is reloaded so the row leaves the Active table.
 */
@Component({
  selector: "mxevolve-run-actions-cell",
  imports: [ExecutionAbortButtonComponent, RepushModalOpenerComponent],
  templateUrl: "./run-actions-cell.component.html",
})
export class RunActionsCellComponent<T extends RunActionsRow = RunActionsRow>
  implements ICellRendererAngularComp
{
  protected readonly run = signal<T | undefined>(undefined);
  protected readonly terminal = signal(false);

  /** Terminal rows are non-abortable; otherwise the abort follows the run status. */
  protected readonly abortStatus = computed<ExecutionStatus>(() =>
    this.terminal()
      ? ExecutionStatus.ABORTED
      : this.run()?.status ?? ExecutionStatus.ABORTED
  );

  private params: RunActionsCellParams<T> | undefined;

  agInit(params: RunActionsCellParams<T>): void {
    this.params = params;
    this.run.set(params.data ?? undefined);
    this.terminal.set(!!params.terminal);
  }

  refresh(): boolean {
    return false;
  }

  protected onAborted(): void {
    this.params?.onAborted?.();
    this.params?.api.refreshServerSide({ purge: false });
  }

  protected onRepush(event: RepushEligibleEvent): void {
    this.params?.onRepush?.(event);
  }
}
