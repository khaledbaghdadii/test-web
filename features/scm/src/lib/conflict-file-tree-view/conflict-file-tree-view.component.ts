import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TreeNode } from "primeng/api";
import {
  GitFileTreeComponent,
  FileNodeData,
  FileOpenPredicate,
} from "@mxflow/ui/file-tree";
import { ToastMessageService } from "@mxflow/ui/alert";
import { catchError, finalize, of, Subject, switchMap } from "rxjs";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import { ConflictingFileMetadataApiResponse } from "../remote-cloned-repository/response/conflicting-files-metadata-api-response";
import {
  GitFileStatusCode,
  mapGitFileStatusCodeToGitFileStatus,
  resolveGitFileStatusCode,
} from "../remote-cloned-repository/model";

interface ConflictFileSelection {
  filePath: string;
  gitFileStatusCode: GitFileStatusCode;
}

@Component({
  selector: "mxevolve-conflict-file-tree-view",
  standalone: true,
  imports: [GitFileTreeComponent],
  providers: [RemoteClonedRepositoryService, ToastMessageService],
  templateUrl: "./conflict-file-tree-view.component.html",
})
export class ConflictFileTreeViewComponent {
  readonly projectId = input<string>("");
  readonly remoteRepositoryId = input<string>("");
  readonly reloadToken = input<unknown>(undefined);
  readonly showLoadingIndicator = input(true);

  readonly fileSelected = output<ConflictFileSelection>();
  readonly loaded = output<void>();

  readonly files = signal<FileNodeData[]>([]);
  readonly loading = signal(false);

  readonly openPredicate: FileOpenPredicate = (node) => {
    const fileData = node.data;
    if (!fileData || fileData.isDirectory) {
      return { allowed: true };
    }

    const metadata = fileData.metadata as
      | ConflictingFileMetadataApiResponse
      | undefined;
    const displayName = this.getDisplayName(fileData.filePath);
    const tooLargeField = this.findExceededSizeField(
      metadata,
      fileData.sizeInBytes
    );
    if (tooLargeField) {
      return {
        allowed: false,
        warningMessage: `"${displayName}" cannot be opened because ${tooLargeField} is greater than 1 MB.`,
      };
    }

    const blockedExtension = this.findBlockedExtension(fileData.filePath);
    if (blockedExtension) {
      return {
        allowed: false,
        warningMessage: `"${displayName}" cannot be opened because ${blockedExtension} files are not editable.`,
      };
    }

    return { allowed: true };
  };

  private readonly remoteClonedRepositoryService = inject(
    RemoteClonedRepositoryService
  );
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reloadRequests$ = new Subject<void>();

  private readonly maxFileSizeInBytes = 1_048_576;
  private readonly blockedExtensions = [
    ".tar.gz",
    ".jar",
    ".zip",
    ".tar",
    ".gz",
    ".dmp",
    "csv",
    ".xls",
    ".xlsx",
    ".xlsm",
  ];

  constructor() {
    effect(() => {
      const projectId = this.projectId();
      const remoteRepositoryId = this.remoteRepositoryId();
      this.reloadToken();

      if (projectId && remoteRepositoryId) {
        this.loadConflictingFiles();
      }
    });

    this.reloadRequests$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => {
          this.loading.set(true);
          return this.remoteClonedRepositoryService
            .getRebaseOperationInfo(this.projectId(), this.remoteRepositoryId())
            .pipe(
              catchError((error: Error) => {
                this.toastMessageService.showError(
                  `Failed to load conflicting files: ${error.message}`,
                  "Load Failed"
                );
                this.files.set([]);
                return of({ conflictingFiles: [] });
              }),
              finalize(() => this.loading.set(false))
            );
        })
      )
      .subscribe((response) => {
        this.files.set(this.toFileNodeData(response.conflictingFiles));
        this.loaded.emit();
      });
  }

  onTreeFileSelected(node: TreeNode<FileNodeData>): void {
    const metadata = node.data?.metadata as
      | ConflictingFileMetadataApiResponse
      | undefined;
    if (!node.data?.filePath || !metadata?.gitFileStatusCode) {
      return;
    }

    this.fileSelected.emit({
      filePath: node.data.filePath,
      gitFileStatusCode: resolveGitFileStatusCode(
        String(metadata.gitFileStatusCode)
      ),
    });
  }

  onTreeFileOpenBlocked(event: { result: { warningMessage?: string } }): void {
    this.toastMessageService.showError(
      event.result.warningMessage ?? "The selected file cannot be opened.",
      "File Open Blocked"
    );
  }

  private loadConflictingFiles(): void {
    this.reloadRequests$.next();
  }

  private toFileNodeData(
    conflictingFiles?: ConflictingFileMetadataApiResponse[] | null
  ): FileNodeData[] {
    const files = conflictingFiles ?? [];
    return files.map((file) => {
      const resolvedPath = file.newFilePath ?? file.filePath;
      return {
        filePath: resolvedPath,
        gitStatus: mapGitFileStatusCodeToGitFileStatus(
          String(file.gitFileStatusCode)
        ),
        sizeInBytes: Math.max(
          file.workspaceFileByteSize ?? 0,
          file.baseFileByteSize ?? 0,
          file.localFileByteSize ?? 0,
          file.remoteFileByteSize ?? 0
        ),
        metadata: file as unknown as Record<string, unknown>,
      };
    });
  }

  private getDisplayName(path: string): string {
    const normalized = path.replace(/\\+/g, "/");
    const parts = normalized.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? path;
  }

  private findBlockedExtension(filePath: string): string | null {
    const normalizedName = filePath.toLowerCase();
    return (
      this.blockedExtensions.find((extension) =>
        normalizedName.endsWith(extension)
      ) ?? null
    );
  }

  private findExceededSizeField(
    metadata: ConflictingFileMetadataApiResponse | undefined,
    fallbackSize: number | undefined
  ): string | null {
    if (!metadata) {
      return (fallbackSize ?? 0) > this.maxFileSizeInBytes ? "file size" : null;
    }

    const sizes: Array<[string, number]> = [
      ["workspaceFileByteSize", metadata.workspaceFileByteSize],
      ["baseFileByteSize", metadata.baseFileByteSize],
      ["localFileByteSize", metadata.localFileByteSize],
      ["remoteFileByteSize", metadata.remoteFileByteSize],
    ];

    const exceeded = sizes.find(([, size]) => size > this.maxFileSizeInBytes);
    return exceeded ? exceeded[0] : null;
  }
}
