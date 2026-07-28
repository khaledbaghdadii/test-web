import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { TreeNode } from "primeng/api";
import { DynamicDialogConfig, DynamicDialogRef } from "primeng/dynamicdialog";
import { Subject, takeUntil } from "rxjs";
import { RepositoryDirectoryTreeInput } from "./repository-directory-tree-input";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  Directory,
  RepoItemType,
  RepositoryItem,
} from "../../describe-repository/describe-repository-response";

@Component({
  selector: "mxflow-repository-tree-component",
  templateUrl: "./repository-directory-tree.component.html",
  standalone: false,
})
export class RepositoryDirectoryTreeComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();

  input: RepositoryDirectoryTreeInput;

  isLoading = false;
  directoriesTreeNode: TreeNode[];
  selectedDirectory: any;

  private readonly dynamicDialogRef = inject(DynamicDialogRef);
  private readonly dynamicDialogConfig = inject(DynamicDialogConfig);
  private readonly toastMessageService = inject(ToastMessageService);

  ngOnInit(): void {
    this.input = this.dynamicDialogConfig.data;

    if (this.input) {
      this.waitForDirectoriesAndCreateTree();
    }
  }

  private waitForDirectoriesAndCreateTree() {
    this.isLoading = true;
    this.input.directories.pipe(takeUntil(this.destroy$)).subscribe({
      next: (describeRepositoryResponse) => {
        this.directoriesTreeNode = this.getTreeNodes(
          describeRepositoryResponse.repositoryItems,
          undefined,
          this.input.preSelectedDirectory
        );
        this.isLoading = false;
      },
      error: (error) => {
        this.toastMessageService.showError(
          this.input.failureMessageProvider(error),
          "Failed to load repository content."
        );
        this.close();
      },
    });
  }

  getTreeNodes(
    repositoryItems: RepositoryItem[],
    parentDirectory: string | undefined,
    preSelectedDirectory: string | undefined
  ): TreeNode[] {
    return repositoryItems
      .filter((repoItem) => this.shouldIncludeRepoItem(repoItem))
      .map((repoItem) => {
        const fullDirectoryName = this.getFullDirectoryName(
          parentDirectory,
          repoItem.name
        );
        const treeNode: TreeNode = this.getTreeNode(
          repoItem,
          fullDirectoryName,
          preSelectedDirectory
        );
        this.preSelectNodeIfPreSelected(treeNode);
        return treeNode;
      });
  }

  private shouldIncludeRepoItem(repoItem: RepositoryItem): boolean {
    if (repoItem.type === RepoItemType.DIRECTORY) {
      if (this.input.fileNameFilter) {
        return this.directoryContainsMatchingFile(repoItem);
      }
      return true;
    }
    if (!this.input.shouldReadFiles) {
      return false;
    }
    if (this.input.fileNameFilter) {
      return repoItem.name === this.input.fileNameFilter;
    }
    return true;
  }

  private directoryContainsMatchingFile(directory: Directory): boolean {
    return directory.children.some((child) => {
      if (child.type === RepoItemType.DIRECTORY) {
        return this.directoryContainsMatchingFile(child);
      }
      return child.name === this.input.fileNameFilter;
    });
  }

  private getTreeNode(
    repoItem: RepositoryItem,
    fullDirectoryName: string,
    preSelectedDirectory: string | undefined
  ) {
    if (repoItem.type === RepoItemType.DIRECTORY) {
      return {
        label: repoItem.name,
        data: fullDirectoryName,
        key: fullDirectoryName,
        expanded: this.isTreeNodeExpanded(fullDirectoryName),
        expandedIcon: "pi pi-folder-open",
        collapsedIcon: "pi pi-folder",
        children: this.getTreeNodes(
          repoItem.children,
          fullDirectoryName,
          preSelectedDirectory
        ),
        selectable: !this.input.shouldReadFiles,
      };
    } else {
      return {
        label: repoItem.name,
        data: fullDirectoryName,
        key: fullDirectoryName,
        collapsedIcon: "pi pi-file",
        children: undefined,
        leaf: true,
        selectable: this.input.shouldReadFiles,
      };
    }
  }

  getFullDirectoryName(
    parentDirectory: string | undefined,
    directoryName: string
  ): string {
    return parentDirectory
      ? parentDirectory + "/" + directoryName
      : directoryName;
  }

  isTreeNodeExpanded(fullDirectoryName: string) {
    return this.getPreSelectedPaths().some(
      (path) =>
        path !== fullDirectoryName &&
        path.startsWith(fullDirectoryName) &&
        path.charAt(fullDirectoryName.length) === "/"
    );
  }

  private getPreSelectedPaths(): string[] {
    if (this.input.multiSelection) {
      return this.input.preSelectedFiles ?? [];
    }
    return this.input.preSelectedDirectory
      ? [this.input.preSelectedDirectory]
      : [];
  }

  private preSelectNodeIfPreSelected(treeNode: TreeNode) {
    if (!this.getPreSelectedPaths().includes(treeNode.data)) {
      return;
    }
    if (this.input.multiSelection) {
      const currentSelection = Array.isArray(this.selectedDirectory)
        ? this.selectedDirectory
        : [];
      this.selectedDirectory = [...currentSelection, treeNode];
    } else {
      this.selectedDirectory = treeNode;
    }
  }

  select() {
    if (this.input?.multiSelection === true) {
      const selectedNodes = (this.selectedDirectory as TreeNode[]) ?? [];
      this.dynamicDialogRef.close(selectedNodes.map((node) => node.data));
    } else {
      this.dynamicDialogRef.close(this.selectedDirectory?.data);
    }
  }

  close() {
    this.dynamicDialogRef.destroy();
  }

  isDirectoryNotSelected(): boolean {
    if (Array.isArray(this.selectedDirectory)) {
      return this.selectedDirectory.length === 0;
    }
    return this.selectedDirectory === undefined;
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
