import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from "@angular/core";
import { Dialog } from "primeng/dialog";
import { ConflictResolutionWorkspaceComponent } from "../../conflict-resolution-workspace/conflict-resolution-workspace.component";

@Component({
  selector: "mxevolve-technical-conflict-resolver",
  standalone: true,
  imports: [Dialog, ConflictResolutionWorkspaceComponent],
  templateUrl: "./technical-conflict-resolver.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechnicalConflictResolverComponent {
  readonly projectId = input.required<string>();
  readonly remoteClonedRepositoryId = input.required<string>();
  readonly closed = output<void>();

  readonly dialogVisible = signal(false);

  openDialog(): void {
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.closed.emit();
  }
}
