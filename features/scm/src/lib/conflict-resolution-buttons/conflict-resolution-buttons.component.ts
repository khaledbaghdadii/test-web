import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from "@angular/core";
import { Dialog } from "primeng/dialog";
import { Button } from "primeng/button";
import { PrimeTemplate } from "primeng/api";
import { GitFileStatusCode } from "../remote-cloned-repository/model/git-file-status-code.enum";
import {
  ConflictResolutionDecision,
  ConflictResolutionDecisionType,
} from "./model/conflict-resolution-decision.model";

@Component({
  selector: "mxevolve-conflict-resolution-buttons",
  standalone: true,
  imports: [Dialog, Button, PrimeTemplate],
  templateUrl: "./conflict-resolution-buttons.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConflictResolutionButtonsComponent {
  readonly filePath = input.required<string>();
  readonly gitFileStatusCode = input.required<GitFileStatusCode>();

  readonly decisionTaken = output<ConflictResolutionDecision>();

  readonly deleteConfirmationVisible = signal(false);

  readonly showKeepBase = computed(() =>
    [
      GitFileStatusCode.DELETED_LOCALLY,
      GitFileStatusCode.DELETED_REMOTELY,
    ].includes(this.gitFileStatusCode())
  );

  readonly showKeepLocal = computed(() =>
    [
      GitFileStatusCode.BOTH_ADDED,
      GitFileStatusCode.ADDED_LOCALLY,
      GitFileStatusCode.DELETED_REMOTELY,
    ].includes(this.gitFileStatusCode())
  );

  readonly showKeepRemote = computed(() =>
    [
      GitFileStatusCode.BOTH_ADDED,
      GitFileStatusCode.ADDED_REMOTELY,
      GitFileStatusCode.DELETED_LOCALLY,
    ].includes(this.gitFileStatusCode())
  );

  readonly showDeleteFile = computed(() =>
    [
      GitFileStatusCode.BOTH_DELETED,
      GitFileStatusCode.ADDED_LOCALLY,
      GitFileStatusCode.ADDED_REMOTELY,
      GitFileStatusCode.DELETED_LOCALLY,
      GitFileStatusCode.DELETED_REMOTELY,
    ].includes(this.gitFileStatusCode())
  );

  readonly deleteFileLabel = computed(() => {
    switch (this.gitFileStatusCode()) {
      case GitFileStatusCode.ADDED_LOCALLY:
      case GitFileStatusCode.DELETED_REMOTELY:
        return "Delete File (Keep Remote)";
      case GitFileStatusCode.ADDED_REMOTELY:
      case GitFileStatusCode.DELETED_LOCALLY:
        return "Delete File (Keep Local)";
      default:
        return "Delete File";
    }
  });

  onKeepBase(): void {
    this.emitDecision(ConflictResolutionDecisionType.KEEP_BASE);
  }

  onKeepLocal(): void {
    this.emitDecision(ConflictResolutionDecisionType.KEEP_LOCAL);
  }

  onKeepRemote(): void {
    this.emitDecision(ConflictResolutionDecisionType.KEEP_REMOTE);
  }

  onDeleteFile(): void {
    this.deleteConfirmationVisible.set(true);
  }

  onCancelDeleteFile(): void {
    this.deleteConfirmationVisible.set(false);
  }

  onConfirmDeleteFile(): void {
    this.deleteConfirmationVisible.set(false);
    this.emitDecision(ConflictResolutionDecisionType.DELETE_FILE);
  }

  private emitDecision(decision: ConflictResolutionDecisionType): void {
    this.decisionTaken.emit({
      decision,
      filePath: this.filePath(),
    });
  }
}
