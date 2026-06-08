import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  DestroyRef,
  Injectable,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { ToastMessageService } from "@mxflow/ui/alert";
import { FileNodeData, GitFileStatus } from "@mxflow/ui/file-tree";
import { TreeNode } from "primeng/api";
import {
  catchError,
  concatMap,
  finalize,
  map,
  mergeMap,
  Observable,
  of,
  Subject,
  switchMap,
  throwError,
} from "rxjs";
import { mapGitFileStatusCodeToGitFileStatus } from "../../remote-cloned-repository/model";
import { RemoteClonedRepositoryService } from "../../remote-cloned-repository/remote-cloned-repository.service";
import { SourceTreeEntryApiResponse } from "../../remote-cloned-repository/response/source-tree-entry-api-response";

@Injectable()
export class FileManagementSourceTreeViewStateService {
  private static readonly TREE_DEPTH_MIN = 1;
  private static readonly TREE_DEPTH_MAX = 2;

  readonly files = signal<FileNodeData[]>([]);
  readonly loading = signal(false);
  readonly loadFailed = signal(false);
  readonly allLoadsSettled = signal(false);
  readonly treeLoading = computed(
    () => this.loading() && this.files().length === 0
  );
  readonly hasChanges = computed(() =>
    this.files().some(
      (file) =>
        file.gitStatus !== undefined &&
        file.gitStatus !== GitFileStatus.Unknown &&
        file.gitStatus !== GitFileStatus.Unmodified
    )
  );

  private readonly destroyRef = inject(DestroyRef);
  private readonly remoteClonedRepositoryService = inject(
    RemoteClonedRepositoryService
  );
  private readonly toastMessageService = inject(ToastMessageService);

  private readonly projectId = signal("");
  private readonly remoteRepositoryId = signal("");
  private readonly repositoryBasePath = signal<string | null>(null);

  private readonly rootRequests$ = new Subject<void>();
  private readonly subdirectoryRequests$ = new Subject<string>();

  private readonly expandedDirectories = new Set<string>();
  private pendingSubdirectoryRestoration: string[] = [];
  private activeSubdirectoryLoads = 0;

  constructor() {
    this.setupContextChangeListener();
    this.setupRootPipeline();
    this.setupSubdirectoryPipeline();
  }

  setContext(
    projectId: string,
    remoteRepositoryId: string,
    repositoryBasePath?: string | null
  ): void {
    this.projectId.set(projectId);
    this.remoteRepositoryId.set(remoteRepositoryId);
    this.repositoryBasePath.set(repositoryBasePath ?? null);
  }

  reload(): void {
    const previouslyExpanded = [...this.expandedDirectories];
    this.expandedDirectories.clear();
    this.files.set([]);
    this.allLoadsSettled.set(false);

    this.pendingSubdirectoryRestoration = previouslyExpanded;
    for (const dir of previouslyExpanded) {
      this.expandedDirectories.add(dir);
    }

    this.rootRequests$.next();
  }

  evictDirectory(directoryPath: string): void {
    const normalized = this.normalizePath(directoryPath);
    const prefix = `${normalized}/`;
    for (const key of [...this.expandedDirectories]) {
      if (key === normalized || key.startsWith(prefix)) {
        this.expandedDirectories.delete(key);
      }
    }
  }

  loadDirectoryChildren(node: TreeNode<FileNodeData>): void {
    const path = this.normalizePath(node.data?.filePath);
    if (!path || this.expandedDirectories.has(path)) {
      return;
    }

    this.expandedDirectories.add(path);

    if (this.hasDiscoveredChildren(path)) {
      return;
    }

    if (this.isDeletedDirectory(path) || this.isInsideDeletedSubtree(path)) {
      return;
    }

    this.subdirectoryRequests$.next(path);
  }

  addFile(
    parentNode: TreeNode<FileNodeData> | null,
    name: string
  ): Observable<string> {
    const dirPath = parentNode?.data?.filePath
      ? this.normalizePath(parentNode.data.filePath)
      : "";
    const relativeFilePath = dirPath ? `${dirPath}/${name}` : name;
    const absoluteFilePath = this.toAbsolutePath(relativeFilePath);
    return this.remoteClonedRepositoryService
      .writeRemoteFileContent({
        projectId: this.projectId(),
        remoteClonedRepositoryId: this.remoteRepositoryId(),
        filePath: absoluteFilePath,
        fileContent: "",
        checkRepositoryAvailability: true,
      })
      .pipe(
        concatMap(() =>
          this.remoteClonedRepositoryService.stageFileChanges({
            projectId: this.projectId(),
            remoteClonedRepositoryId: this.remoteRepositoryId(),
            filePaths: [absoluteFilePath],
            stageAll: false,
          })
        ),
        map(() => relativeFilePath),
        catchError((error: Error) => throwError(() => new Error(error.message)))
      );
  }

  addDirectory(
    parentNode: TreeNode<FileNodeData> | null,
    name: string
  ): Observable<void> {
    const dirPath = parentNode?.data?.filePath
      ? this.normalizePath(parentNode.data.filePath)
      : "";
    const relativeDirectoryPath = dirPath ? `${dirPath}/${name}` : name;
    return this.remoteClonedRepositoryService
      .createRemoteDirectory({
        projectId: this.projectId(),
        remoteClonedRepositoryId: this.remoteRepositoryId(),
        directoryPath: this.toAbsolutePath(relativeDirectoryPath),
        checkRepositoryAvailability: true,
      })
      .pipe(
        catchError((error: Error) => throwError(() => new Error(error.message)))
      );
  }

  deleteDirectory(directoryPath: string): Observable<void> {
    const absoluteDirectoryPath = this.toAbsolutePath(directoryPath);
    const shouldStageDirectory =
      this.shouldStageDirectoryDeletion(directoryPath);
    return this.remoteClonedRepositoryService
      .deleteRemoteDirectory({
        projectId: this.projectId(),
        remoteClonedRepositoryId: this.remoteRepositoryId(),
        directoryPath: absoluteDirectoryPath,
        checkRepositoryAvailability: true,
      })
      .pipe(
        concatMap(() => {
          if (!shouldStageDirectory) {
            return of(undefined);
          }

          return this.remoteClonedRepositoryService.stageFileChanges({
            projectId: this.projectId(),
            remoteClonedRepositoryId: this.remoteRepositoryId(),
            filePaths: [absoluteDirectoryPath],
            stageAll: false,
          });
        }),
        catchError((error: Error) => throwError(() => new Error(error.message)))
      );
  }

  deleteFile(filePath: string): Observable<void> {
    const absoluteFilePath = this.toAbsolutePath(filePath);
    const isNewFile = this.isNewlyAddedFile(filePath);
    return this.remoteClonedRepositoryService
      .deleteRemoteFile({
        projectId: this.projectId(),
        remoteClonedRepositoryId: this.remoteRepositoryId(),
        filePath: absoluteFilePath,
        checkRepositoryAvailability: true,
      })
      .pipe(
        concatMap(() => {
          if (isNewFile) {
            return of(undefined);
          }
          return this.remoteClonedRepositoryService.stageFileChanges({
            projectId: this.projectId(),
            remoteClonedRepositoryId: this.remoteRepositoryId(),
            filePaths: [absoluteFilePath],
            stageAll: false,
          });
        }),
        catchError((error: Error) => throwError(() => new Error(error.message)))
      );
  }

  private toAbsolutePath(relativePath: string): string {
    const base = this.repositoryBasePath();
    return base ? `${base}/${relativePath}` : relativePath;
  }

  private setupContextChangeListener(): void {
    effect(() => {
      const projectId = this.projectId();
      const remoteRepositoryId = this.remoteRepositoryId();
      if (!projectId || !remoteRepositoryId) {
        return;
      }
      this.expandedDirectories.clear();
      this.files.set([]);
      this.rootRequests$.next();
    });
  }

  private setupRootPipeline(): void {
    this.rootRequests$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => {
          this.loadFailed.set(false);
          this.loading.set(true);
          return this.fetchSourceTree(undefined, true).pipe(
            finalize(() => this.loading.set(false))
          );
        })
      )
      .subscribe((entries) => {
        this.files.set(entries.map((e) => this.mapEntry(e)));
        this.drainPendingSubdirectories();
        if (this.activeSubdirectoryLoads === 0) {
          this.allLoadsSettled.set(true);
        }
      });
  }

  private setupSubdirectoryPipeline(): void {
    this.subdirectoryRequests$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        mergeMap((directoryPath) => {
          this.activeSubdirectoryLoads++;
          this.loading.set(true);
          this.setDirectoryLoading(directoryPath, true);

          return this.fetchSourceTree(directoryPath).pipe(
            finalize(() => {
              this.activeSubdirectoryLoads--;
              this.setDirectoryLoading(directoryPath, false);
              if (this.activeSubdirectoryLoads === 0) {
                this.loading.set(false);
                this.allLoadsSettled.set(true);
              }
            }),
            map((entries) => ({ directoryPath, entries }))
          );
        })
      )
      .subscribe(({ entries }) => {
        this.mergeEntries(entries);
      });
  }

  private drainPendingSubdirectories(): void {
    const pending = this.pendingSubdirectoryRestoration;
    this.pendingSubdirectoryRestoration = [];
    for (const dir of pending) {
      this.subdirectoryRequests$.next(dir);
    }
  }

  private fetchSourceTree(
    directoryPath: string | undefined,
    isRootRequest: boolean = false
  ) {
    return this.remoteClonedRepositoryService
      .getRemoteRepositorySourceTree(
        this.projectId(),
        this.remoteRepositoryId(),
        directoryPath,
        FileManagementSourceTreeViewStateService.TREE_DEPTH_MIN,
        FileManagementSourceTreeViewStateService.TREE_DEPTH_MAX
      )
      .pipe(
        catchError((error: Error) => {
          if (isRootRequest) {
            this.loadFailed.set(true);
          }
          this.toastMessageService.showError(
            `Failed to load source tree: ${error.message}`,
            "Load Failed"
          );
          return of([] as SourceTreeEntryApiResponse[]);
        })
      );
  }

  private mergeEntries(entries: SourceTreeEntryApiResponse[]): void {
    const filesMap = this.buildFilesMap(this.files());
    for (const entry of entries) {
      const node = this.mapEntry(entry);
      filesMap.set(
        node.filePath,
        this.mergeFileNode(filesMap.get(node.filePath), node)
      );
    }
    this.files.set([...filesMap.values()]);
  }

  private setDirectoryLoading(path: string, isLoading: boolean): void {
    const normalizedPath = this.normalizePath(path);
    const filesMap = this.buildFilesMap(this.files());
    filesMap.set(
      normalizedPath,
      this.mergeFileNode(filesMap.get(normalizedPath), {
        filePath: normalizedPath,
        isDirectory: true,
        isLoading,
      })
    );
    this.files.set([...filesMap.values()]);
  }

  private mergeFileNode(
    existing: FileNodeData | undefined,
    incoming: Partial<FileNodeData> & { filePath: string }
  ): FileNodeData {
    return {
      filePath: incoming.filePath,
      isDirectory: incoming.isDirectory ?? existing?.isDirectory,
      isLoading: incoming.isLoading ?? existing?.isLoading,
      gitStatus: incoming.gitStatus ?? existing?.gitStatus,
      sizeInBytes: incoming.sizeInBytes ?? existing?.sizeInBytes,
      metadata: {
        ...(existing?.metadata ?? {}),
        ...(incoming.metadata ?? {}),
      },
    };
  }

  private hasDiscoveredChildren(directoryPath: string): boolean {
    const normalizedDirectoryPath = this.normalizePath(directoryPath);
    const prefix = `${normalizedDirectoryPath}/`;
    return this.files().some((file) => {
      const normalized = this.normalizePath(file.filePath);
      if (!normalized.startsWith(prefix)) {
        return false;
      }
      const relative = normalized.slice(prefix.length);
      return relative.length > 0 && !relative.includes("/");
    });
  }

  private isNewlyAddedFile(filePath: string): boolean {
    const normalized = this.normalizePath(filePath);
    const file = this.files().find(
      (f) => this.normalizePath(f.filePath) === normalized
    );
    return file?.gitStatus === GitFileStatus.Added;
  }

  private shouldStageDirectoryDeletion(directoryPath: string): boolean {
    const normalizedDirectoryPath = this.normalizePath(directoryPath);
    const prefix = `${normalizedDirectoryPath}/`;

    return this.files().some((file) => {
      if (file.isDirectory || !this.isChangedFileStatus(file.gitStatus)) {
        return false;
      }

      if (file.gitStatus === GitFileStatus.Added) {
        return false;
      }

      const normalizedPath = this.normalizePath(file.filePath);
      return normalizedPath.startsWith(prefix);
    });
  }

  private isChangedFileStatus(status: GitFileStatus | undefined): boolean {
    return (
      status !== undefined &&
      status !== GitFileStatus.Unknown &&
      status !== GitFileStatus.Unmodified
    );
  }

  private isDeletedDirectory(directoryPath: string): boolean {
    const file = this.files().find(
      (f) => this.normalizePath(f.filePath) === directoryPath
    );
    return file?.gitStatus === GitFileStatus.Deleted;
  }

  private isInsideDeletedSubtree(directoryPath: string): boolean {
    return this.files().some((file) => {
      if (!file.isDirectory || file.gitStatus !== GitFileStatus.Deleted) {
        return false;
      }

      const deletedPath = this.normalizePath(file.filePath);
      return (
        directoryPath === deletedPath ||
        directoryPath.startsWith(`${deletedPath}/`)
      );
    });
  }

  private buildFilesMap(files: FileNodeData[]): Map<string, FileNodeData> {
    const map = new Map<string, FileNodeData>();
    for (const file of files) {
      map.set(this.normalizePath(file.filePath), file);
    }
    return map;
  }

  private mapEntry(entry: SourceTreeEntryApiResponse): FileNodeData {
    return {
      filePath: this.normalizePath(entry.path),
      isDirectory: entry.directory,
      sizeInBytes: entry.pathSize,
      gitStatus: mapGitFileStatusCodeToGitFileStatus(String(entry.pathCode)),
      metadata: { pathCode: entry.pathCode },
    };
  }

  private normalizePath(path: string | undefined): string {
    if (!path) {
      return "";
    }
    return path.replace(/\\+/g, "/").replace(/\/$/, "");
  }
}
