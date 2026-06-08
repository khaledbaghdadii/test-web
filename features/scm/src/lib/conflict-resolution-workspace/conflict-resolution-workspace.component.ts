import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { rxResource, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { catchError, concatMap, finalize, of } from "rxjs";
import { Button } from "primeng/button";
import { SplitterModule } from "primeng/splitter";
import { Message } from "primeng/message";
import { ToastMessageService } from "@mxflow/ui/alert";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import { ConflictFileTreeViewComponent } from "../conflict-file-tree-view/conflict-file-tree-view.component";
import {
  GitFileStatusCode,
  resolveGitFileStatusCode,
} from "../remote-cloned-repository/model";
import { FileConflictResolverComponent } from "../file-conflict-resolver/file-conflict-resolver.component";
import { ConflictResolutionWorkspaceSkeletonComponent } from "./skeleton/conflict-resolution-workspace-skeleton.component";

const WORKSPACE_PANEL_SIZES: [number, number] = [30, 70];
const CONFLICT_STATUSES: ReadonlySet<GitFileStatusCode> = new Set([
  GitFileStatusCode.BOTH_MODIFIED,
  GitFileStatusCode.BOTH_ADDED,
  GitFileStatusCode.BOTH_DELETED,
  GitFileStatusCode.ADDED_LOCALLY,
  GitFileStatusCode.ADDED_REMOTELY,
  GitFileStatusCode.DELETED_LOCALLY,
  GitFileStatusCode.DELETED_REMOTELY,
]);

interface ConflictFileSelection {
  filePath: string;
  gitFileStatusCode: GitFileStatusCode;
}

@Component({
  selector: "mxevolve-conflict-resolution-workspace",
  standalone: true,
  imports: [
    Button,
    SplitterModule,
    Message,
    ConflictResolutionWorkspaceSkeletonComponent,
    ConflictFileTreeViewComponent,
    FileConflictResolverComponent,
  ],
  providers: [RemoteClonedRepositoryService],
  templateUrl: "./conflict-resolution-workspace.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConflictResolutionWorkspaceComponent {
  private readonly remoteClonedRepositoryService = inject(
    RemoteClonedRepositoryService
  );
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly projectId = input.required<string>();
  readonly remoteClonedRepositoryId = input.required<string>();

  readonly closed = output<void>();

  readonly selectedFile = signal<ConflictFileSelection | null>(null);
  readonly isApplyingFixes = signal(false);
  readonly isTreeInitialLoadComplete = signal(false);
  readonly treeReloadToken = signal(0);
  readonly workspacePanelSizes = WORKSPACE_PANEL_SIZES;

  private readonly conflictTree = viewChild(ConflictFileTreeViewComponent);

  readonly remainingConflictCount = computed(() => {
    const files = this.conflictTree()?.files() ?? [];
    return files.filter((file) => this.isConflictFile(file.metadata)).length;
  });

  readonly allConflictsResolved = computed(
    () => this.remainingConflictCount() === 0
  );

  private readonly repositoryStateResource = rxResource({
    params: () => ({
      projectId: this.projectId(),
      remoteClonedRepositoryId: this.remoteClonedRepositoryId(),
    }),
    stream: ({ params }) =>
      this.remoteClonedRepositoryService.getRebaseOperationInfo(
        params.projectId,
        params.remoteClonedRepositoryId
      ),
  });

  readonly isCheckingState = computed(() =>
    this.repositoryStateResource.isLoading()
  );

  readonly stateErrorMessage = computed(() => {
    const err = this.repositoryStateResource.error();
    return err instanceof Error ? err.message : null;
  });

  readonly rebaseInProgress = computed(
    () => this.repositoryStateResource.value()?.rebaseInProgress ?? false
  );

  readonly applyFixesDisabled = computed(
    () =>
      this.isApplyingFixes() ||
      !this.rebaseInProgress() ||
      !this.allConflictsResolved()
  );

  readonly viewState = computed<"checking" | "error" | "no-rebase" | "ready">(
    () => {
      if (this.isCheckingState()) return "checking";
      if (this.stateErrorMessage()) return "error";
      if (!this.rebaseInProgress()) return "no-rebase";
      return "ready";
    }
  );

  readonly showSkeleton = computed(
    () => this.viewState() === "checking" || !this.isTreeInitialLoadComplete()
  );

  readonly emptySelectionMessage = computed(() =>
    this.allConflictsResolved()
      ? 'All conflicts are resolved. Click "Apply Fixes" below to continue the rebase.'
      : "Select a file from the tree to resolve its conflicts."
  );

  constructor() {
    effect(() => {
      this.projectId();
      this.remoteClonedRepositoryId();
      this.isCheckingState();
      this.isTreeInitialLoadComplete.set(false);
    });
  }

  onFileSelected(selection: ConflictFileSelection): void {
    this.selectedFile.set(selection);
  }

  onFileResolved(): void {
    this.selectedFile.set(null);
    this.treeReloadToken.update((t) => t + 1);
  }

  onTreeLoaded(): void {
    this.isTreeInitialLoadComplete.set(true);
  }

  private isConflictFile(metadata: unknown): boolean {
    const rawStatusCode = this.getRawGitStatusCode(metadata);
    return (
      !!rawStatusCode &&
      CONFLICT_STATUSES.has(resolveGitFileStatusCode(rawStatusCode))
    );
  }

  private getRawGitStatusCode(metadata: unknown): string | null {
    if (!metadata || typeof metadata !== "object") {
      return null;
    }

    const value = (metadata as { gitFileStatusCode?: unknown })
      .gitFileStatusCode;
    return typeof value === "string" ? value : null;
  }

  applyFixes(): void {
    if (this.applyFixesDisabled()) {
      return;
    }

    this.isApplyingFixes.set(true);
    this.remoteClonedRepositoryService
      .continueRebase(this.projectId(), this.remoteClonedRepositoryId())
      .pipe(
        concatMap(() =>
          this.remoteClonedRepositoryService
            .getRebaseOperationInfo(
              this.projectId(),
              this.remoteClonedRepositoryId()
            )
            .pipe(catchError(() => of(null)))
        ),
        finalize(() => this.isApplyingFixes.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.toastMessageService.showSuccess(
            "Your updates were applied successfully."
          );
          this.closed.emit();
        },
        error: (err: Error) => {
          this.toastMessageService.showError(
            err?.message || "Failed to apply fixes.",
            "Apply Fixes Failed"
          );
        },
      });
  }
}
