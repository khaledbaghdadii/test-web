import { Component, OnDestroy, OnInit } from "@angular/core";
import { TreeNode } from "primeng/api";
import { DynamicDialogConfig, DynamicDialogRef } from "primeng/dynamicdialog";
import { Subject, takeUntil } from "rxjs";
import { RepositoryDirectoryTreeInput } from "./repository-directory-tree-input";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  RepoItemType,
  RepositoryItem,
} from "../../describe-repository/describe-repository-response";

@Component({
  selector: "mxflow-repository-tree-component",
  templateUrl: "./repository-directory-tree.component.html",
  standalone: false,
})
export class RepositoryDirectoryTreeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject();

  input: RepositoryDirectoryTreeInput;

  isLoading = false;
  directoriesTreeNode: TreeNode[];
  selectedDirectory: any;

  constructor(
    private dynamicDialogRef: DynamicDialogRef,
    private dynamicDialogConfig: DynamicDialogConfig,
    private toastMessageService: ToastMessageService
  ) {}

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
      .filter((repoItem) =>
        !this.input.shouldReadFiles
          ? repoItem.type === RepoItemType.DIRECTORY
          : true
      )
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
    return (
      this.input.preSelectedDirectory !== undefined &&
      this.input.preSelectedDirectory !== fullDirectoryName &&
      this.input.preSelectedDirectory.startsWith(fullDirectoryName) &&
      this.input.preSelectedDirectory.charAt(fullDirectoryName.length) === "/"
    );
  }

  private preSelectNodeIfPreSelected(treeNode: TreeNode) {
    if (
      this.input.preSelectedDirectory &&
      this.input.preSelectedDirectory == treeNode.data
    ) {
      this.selectedDirectory = treeNode;
    }
  }

  select() {
    this.dynamicDialogRef.close(this.selectedDirectory?.data);
  }

  close() {
    this.dynamicDialogRef.destroy();
  }

  isDirectoryNotSelected(): boolean {
    return this.selectedDirectory === undefined;
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
