import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { catchError, combineLatest, of, switchMap } from "rxjs";
import { SplitterModule } from "primeng/splitter";
import { FileManagementSourceTreeViewComponent } from "../file-management-source-tree-view/file-management-source-tree-view.component";
import { FileEditorViewComponent } from "../file-editor-view/file-editor-view.component";
import { PushChangesDialogComponent } from "../push-changes-dialog/push-changes-dialog.component";
import { GitFileStatusCode } from "../remote-cloned-repository/model";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import {
  RemoteClonedRepositoryState,
  RemoteClonedRepositoryStateApiResponse,
} from "../remote-cloned-repository/response/get-remote-cloned-repository-state-api-response";

interface SelectedFile {
  filePath: string;
  gitFileStatusCode: GitFileStatusCode;
}

interface TreeEntryDeletedEvent {
  path: string;
  type: "file" | "directory";
}

const WORKSPACE_PANEL_SIZES: [number, number] = [30, 70];

@Component({
  selector: "mxevolve-file-management-workspace",
  standalone: true,
  imports: [
    SplitterModule,
    FileManagementSourceTreeViewComponent,
    FileEditorViewComponent,
    PushChangesDialogComponent,
  ],
  providers: [RemoteClonedRepositoryService],
  templateUrl: "./file-management-workspace.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileManagementWorkspaceComponent {
  private readonly remoteClonedRepositoryService = inject(
    RemoteClonedRepositoryService
  );
  private readonly destroyRef = inject(DestroyRef);

  protected readonly sourceTree =
    viewChild<FileManagementSourceTreeViewComponent>("sourceTreeRef");

  readonly projectId = input.required<string>();
  readonly repositoryId = input.required<string>();
  readonly branchName = input.required<string>();
  readonly repositoryBasePath = input<string | null>(null);

  readonly pushSucceeded = output<void>();

  protected readonly selectedFile = signal<SelectedFile | null>(null);
  protected readonly editorReloadToken = signal(0);
  protected readonly workspacePanelSizes = WORKSPACE_PANEL_SIZES;
  protected readonly repositoryState =
    signal<RemoteClonedRepositoryState | null>(null);
  protected readonly isTreeLoading = computed(
    () => this.sourceTree()?.treeLoading() ?? true
  );
  protected readonly isTreeLoadFailed = computed(
    () => this.sourceTree()?.loadFailed() ?? false
  );
  protected readonly isRepositoryAvailable = computed(
    () => this.repositoryState() === RemoteClonedRepositoryState.AVAILABLE
  );
  protected readonly hasChanges = computed(
    () => this.sourceTree()?.hasChanges() ?? false
  );
  protected readonly isPushDisabled = computed(
    () => !this.isRepositoryAvailable() || !this.hasChanges()
  );
  protected readonly pushDisabledTooltip = computed(() =>
    !this.isRepositoryAvailable()
      ? "Repository is not available"
      : "No modified files to push"
  );

  constructor() {
    this.setupRepositoryStateListener();
  }

  onFileSelected(selection: SelectedFile): void {
    this.selectedFile.set(selection);
  }

  onTreeEntryDeleted(event: TreeEntryDeletedEvent): void {
    const selected = this.selectedFile();
    if (!selected) {
      return;
    }

    if (event.type === "file" && selected.filePath === event.path) {
      this.editorReloadToken.update((value) => value + 1);
      this.sourceTree()?.reload({ preserveSelection: false });
      return;
    }

    if (
      event.type === "directory" &&
      (selected.filePath === event.path ||
        selected.filePath.startsWith(`${event.path}/`))
    ) {
      this.selectedFile.set(null);
    }
  }

  onSourceTreeRefreshRequested(): void {
    this.sourceTree()?.reload();
  }

  onFileSaved(): void {
    this.sourceTree()?.reload();
  }

  onFileRestored(): void {
    this.sourceTree()?.reload();
  }

  onPushSucceeded(): void {
    this.pushSucceeded.emit();
    this.sourceTree()?.reload();
  }

  private setupRepositoryStateListener(): void {
    combineLatest([
      toObservable(this.projectId),
      toObservable(this.repositoryId),
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(([projectId, repositoryId]) =>
          this.remoteClonedRepositoryService
            .getRemoteClonedRepositoryState(projectId, repositoryId)
            .pipe(catchError(() => of(null)))
        )
      )
      .subscribe((response: RemoteClonedRepositoryStateApiResponse | null) => {
        this.repositoryState.set(response?.remoteClonedRepositoryState ?? null);
      });
  }
}
