import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  FileNodeData,
  FileOpenPredicate,
  GitFileTreeComponent,
} from "@mxflow/ui/file-tree";
import { ConfirmationService, TreeNode } from "primeng/api";
import { Button } from "primeng/button";
import { ConfirmDialog } from "primeng/confirmdialog";
import { Tooltip } from "primeng/tooltip";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import { GitFileStatusCode } from "../remote-cloned-repository/model";
import { FileManagementSourceTreeViewStateService } from "./state-service/file-management-source-tree-view-state.service";
import {
  FileManagementSourceTreeAddDialogComponent,
  SourceTreeAddRequest,
} from "./add-dialog-component/add-dialog.component";

interface SourceTreeFileSelection {
  filePath: string;
  gitFileStatusCode: GitFileStatusCode;
}

interface SourceTreeEntryDeletedEvent {
  path: string;
  type: "file" | "directory";
}

interface SourceTreeFileMetadata {
  gitFileStatusCode?: GitFileStatusCode;
  pathCode?: GitFileStatusCode;
  workspaceFileByteSize?: number;
  baseFileByteSize?: number;
  localFileByteSize?: number;
  remoteFileByteSize?: number;
  pathSize?: number;
  sizeInBytes?: number;
}

@Component({
  selector: "mxevolve-file-management-source-tree-view",
  standalone: true,
  imports: [
    GitFileTreeComponent,
    Button,
    Tooltip,
    ConfirmDialog,
    FileManagementSourceTreeAddDialogComponent,
  ],
  providers: [
    RemoteClonedRepositoryService,
    ToastMessageService,
    FileManagementSourceTreeViewStateService,
    ConfirmationService,
  ],
  templateUrl: "./file-management-source-tree-view.component.html",
})
export class FileManagementSourceTreeViewComponent {
  private readonly stateService = inject(
    FileManagementSourceTreeViewStateService
  );
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly gitFileTree = viewChild.required(GitFileTreeComponent);

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

  private readonly expandedKeysBeforeReload = signal<Record<
    string,
    boolean
  > | null>(null);
  private readonly selectedKeyBeforeReload = signal<string | null>(null);
  private readonly isReloading = signal(false);
  readonly showAddDialog = signal(false);

  readonly projectId = input<string>("");
  readonly remoteRepositoryId = input<string>("");
  readonly repositoryBasePath = input<string | null>(null);
  readonly selectionMode = input<"single" | "multiple" | "checkbox">("single");

  readonly repoName = computed(() => {
    const path = this.repositoryBasePath();
    if (!path) return "repository";
    const parts = path.replace(/\\/g, "/").split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "repository";
  });

  readonly displayFiles = computed((): FileNodeData[] => {
    const prefix = this.repoName();
    return this.files().map((f) => ({
      ...f,
      filePath: `${prefix}/${f.filePath}`,
    }));
  });

  readonly files = this.stateService.files;
  readonly loading = this.stateService.loading;
  readonly treeLoading = this.stateService.treeLoading;
  readonly loadFailed = this.stateService.loadFailed;
  readonly hasChanges = this.stateService.hasChanges;
  private readonly allLoadsSettled = this.stateService.allLoadsSettled;

  readonly fileSelected = output<SourceTreeFileSelection>();
  readonly directorySelected = output<TreeNode<FileNodeData>>();
  readonly sourceTreeRefreshRequested = output<void>();
  readonly entryDeleted = output<SourceTreeEntryDeletedEvent>();
  readonly fileCreationRequested = output<{
    filePath: string;
    content: string;
  }>();

  readonly openPredicate: FileOpenPredicate = (node) => {
    const fileData = node.data;
    if (!fileData || fileData.isDirectory) {
      return { allowed: true };
    }

    const metadata = fileData.metadata as SourceTreeFileMetadata | undefined;
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

  selectedDirectory: TreeNode<FileNodeData> | null = null;
  selectedNode: TreeNode<FileNodeData> | null = null;
  errorMessage: string | undefined;

  constructor() {
    effect(() => {
      this.stateService.setContext(
        this.projectId(),
        this.remoteRepositoryId(),
        this.repositoryBasePath()
      );
    });

    this.setupSelectionRestorationEffect();
  }

  private setupSelectionRestorationEffect(): void {
    effect(() => {
      const isReloading = this.isReloading();
      const allLoadsSettled = this.allLoadsSettled();
      const savedKeys = this.expandedKeysBeforeReload();

      if (!isReloading || !allLoadsSettled || !savedKeys) {
        return;
      }

      this.gitFileTree().setExpandedKeys(savedKeys);
      this.gitFileTree().setSelectedKey(this.selectedKeyBeforeReload());
      this.isReloading.set(false);
      this.expandedKeysBeforeReload.set(null);
      this.selectedKeyBeforeReload.set(null);
    });
  }

  onFileNodeSelected(node: TreeNode<FileNodeData>): void {
    const fileData = node.data;
    if (!fileData?.filePath || fileData.isDirectory) {
      return;
    }

    const metadata = fileData.metadata as SourceTreeFileMetadata | undefined;
    const gitFileStatusCode = metadata?.gitFileStatusCode ?? metadata?.pathCode;
    if (!gitFileStatusCode) {
      return;
    }

    const stripped = this.strippedNode(node);
    this.selectedNode = stripped;
    this.selectedDirectory = null;

    this.fileSelected.emit({
      filePath:
        stripped.data?.filePath ?? this.stripRepoPrefix(fileData.filePath),
      gitFileStatusCode,
    });
  }

  openAddDialog(): void {
    this.showAddDialog.set(true);
  }

  closeAddDialog(): void {
    this.showAddDialog.set(false);
  }

  onAddRequested(request: SourceTreeAddRequest): void {
    this.confirmAdd(this.selectedDirectory, request);
  }

  onDeleteButtonClicked(): void {
    const node = this.selectedNode;
    if (!node?.data?.filePath) {
      return;
    }

    const targetPath = node.data.filePath;
    const isDirectory = !!node.data.isDirectory;

    this.confirmationService.confirm({
      header: isDirectory ? "Delete Directory" : "Delete File",
      message: isDirectory
        ? `Are you sure you want to delete "${targetPath}" with all its content?`
        : `Are you sure you want to delete file "${targetPath}"?`,
      icon: "pi pi-exclamation-triangle text-red-500",
      acceptLabel: "Delete",
      rejectLabel: "Cancel",
      acceptButtonStyleClass: "p-button-danger",
      accept: () => {
        const deleteRequest = isDirectory
          ? this.stateService.deleteDirectory(targetPath)
          : this.stateService.deleteFile(targetPath);

        deleteRequest.subscribe({
          next: () => {
            if (this.selectedDirectory?.data?.filePath === targetPath) {
              this.selectedDirectory = null;
            }
            if (this.selectedNode?.data?.filePath === targetPath) {
              this.selectedNode = null;
            }
            if (isDirectory) {
              this.stateService.evictDirectory(targetPath);
            }
            this.toastMessageService.showSuccess(
              isDirectory
                ? "Directory deleted successfully."
                : "File deleted successfully.",
              "Success"
            );
            this.entryDeleted.emit({
              path: targetPath,
              type: isDirectory ? "directory" : "file",
            });
            this.sourceTreeRefreshRequested.emit();
          },
          error: (error: Error) => {
            this.toastMessageService.showError(error.message, "Delete Failed");
          },
        });
      },
    });
  }

  onDirectoryNodeSelected(node: TreeNode<FileNodeData>): void {
    if (node.data?.filePath === this.repoName()) {
      this.selectedDirectory = null;
      this.selectedNode = null;
      return;
    }
    const stripped = this.strippedNode(node);
    this.selectedDirectory = stripped;
    this.selectedNode = stripped;
    this.directorySelected.emit(stripped);
    this.stateService.loadDirectoryChildren(stripped);
  }

  onDirectoryNodeExpanded(node: TreeNode<FileNodeData>): void {
    if (node.data?.filePath === this.repoName()) {
      return;
    }
    this.stateService.loadDirectoryChildren(this.strippedNode(node));
  }

  reload(options: { preserveSelection?: boolean } = {}): void {
    const { preserveSelection = true } = options;
    this.expandedKeysBeforeReload.set(this.gitFileTree().getExpandedKeys());
    this.selectedKeyBeforeReload.set(
      preserveSelection ? this.gitFileTree().getSelectedKey() : null
    );
    this.isReloading.set(true);
    this.stateService.reload();
  }

  onTreeFileOpenBlocked(event: { result: { warningMessage?: string } }): void {
    this.toastMessageService.clearErrors();
    this.toastMessageService.showError(
      event.result.warningMessage ?? "The selected file cannot be opened.",
      "File Open Blocked"
    );
  }

  private stripRepoPrefix(filePath: string): string {
    const prefix = this.repoName() + "/";
    return filePath.startsWith(prefix)
      ? filePath.slice(prefix.length)
      : filePath;
  }

  private strippedNode(node: TreeNode<FileNodeData>): TreeNode<FileNodeData> {
    if (!node.data) return node;
    return {
      ...node,
      data: {
        ...node.data,
        filePath: this.stripRepoPrefix(node.data.filePath),
      },
    };
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
    metadata: SourceTreeFileMetadata | undefined,
    fallbackSize: number | undefined
  ): string | null {
    if (!metadata) {
      return (fallbackSize ?? 0) > this.maxFileSizeInBytes ? "file size" : null;
    }

    const sizes: Array<[string, number]> = [
      ["workspaceFileByteSize", metadata.workspaceFileByteSize ?? 0],
      ["baseFileByteSize", metadata.baseFileByteSize ?? 0],
      ["localFileByteSize", metadata.localFileByteSize ?? 0],
      ["remoteFileByteSize", metadata.remoteFileByteSize ?? 0],
      ["pathSize", metadata.pathSize ?? 0],
      ["sizeInBytes", metadata.sizeInBytes ?? 0],
    ];

    const exceeded = sizes.find(([, size]) => size > this.maxFileSizeInBytes);
    if (exceeded) {
      return exceeded[0];
    }

    return (fallbackSize ?? 0) > this.maxFileSizeInBytes ? "file size" : null;
  }

  private confirmAdd(
    node: TreeNode<FileNodeData> | null,
    request: SourceTreeAddRequest
  ): void {
    const trimmedName = request.name.trim();

    const siblings = node
      ? node.children ?? []
      : this.stateService
          .files()
          .filter((f) => !f.filePath.includes("/"))
          .map((f) => ({ label: f.filePath }));

    const existingNode = siblings.find(
      (child) => (child.label ?? "") === trimmedName
    );

    if (existingNode) {
      this.toastMessageService.showError(
        "file/directory already exists under this path",
        "Error"
      );
      return;
    }

    if (request.type === "file") {
      this.stateService.addFile(node, trimmedName).subscribe({
        next: (filePath) => {
          this.toastMessageService.showSuccess(
            "File created successfully.",
            "Success"
          );
          this.sourceTreeRefreshRequested.emit();
          this.fileCreationRequested.emit({
            filePath,
            content: "",
          });
        },
        error: (error: Error) => {
          this.toastMessageService.showError(error.message, "Create Failed");
        },
      });
    } else {
      this.stateService.addDirectory(node, trimmedName).subscribe({
        next: () => {
          this.toastMessageService.showSuccess(
            "Directory created successfully.",
            "Success"
          );
          this.sourceTreeRefreshRequested.emit();
        },
        error: (error: Error) => {
          this.toastMessageService.showError(error.message, "Create Failed");
        },
      });
    }

    this.closeAddDialog();
  }
}
