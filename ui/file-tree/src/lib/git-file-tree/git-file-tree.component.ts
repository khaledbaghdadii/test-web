import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
} from "@angular/core";
import { PrimeTemplate, TreeNode } from "primeng/api";
import { SkeletonModule } from "primeng/skeleton";
import { Tag } from "primeng/tag";
import { Tree } from "primeng/tree";
import { FileNodeData } from "../models/file-node-data.interface";
import {
  FileOpenPredicate,
  FileOpenResult,
} from "../models/file-open-predicate.type";
import { GitFileStatus } from "../models/git-file-status.enum";
import {
  GIT_FILE_STATUS_CONFIG,
  GitFileStatusConfig,
} from "../models/git-file-status-config";

@Component({
  selector: "mxevolve-git-file-tree",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Tree, PrimeTemplate, Tag, SkeletonModule],
  templateUrl: "./git-file-tree.component.html",
  host: {
    class: "block",
  },
})
export class GitFileTreeComponent {
  files = input.required<FileNodeData[]>();

  loading = input<boolean>(false);

  selectionMode = input<"single" | "multiple" | "checkbox">("single");

  /**
   * Optional predicate evaluated when a *file* node is selected.
   *
   * If the predicate returns `{ allowed: false }`, the component emits
   * `fileOpenBlocked` instead of `fileSelected`, letting the consumer
   * decide how to inform the user (toast, inline warning, etc.).
   */
  openPredicate = input<FileOpenPredicate | undefined>(undefined);

  fileSelected = output<TreeNode<FileNodeData>>();
  directorySelected = output<TreeNode<FileNodeData>>();
  directoryExpanded = output<TreeNode<FileNodeData>>();

  fileOpenBlocked = output<{
    node: TreeNode<FileNodeData>;
    result: FileOpenResult;
  }>();

  readonly selection = model<
    TreeNode<FileNodeData> | TreeNode<FileNodeData>[] | null
  >(null);

  protected readonly statusConfig = GIT_FILE_STATUS_CONFIG;
  protected readonly expandedKeys = signal<Record<string, boolean>>({});
  protected readonly treeNodes = computed<TreeNode<FileNodeData>[]>(() =>
    this.buildTreeNodes(this.files())
  );

  private readonly pendingSelectionKey = signal<string | null>(null);

  constructor() {
    this.setupDeferredSelectionEffect();
  }

  private setupDeferredSelectionEffect(): void {
    effect(() => {
      const key = this.pendingSelectionKey();
      const nodes = this.treeNodes();
      if (!key || nodes.length === 0) {
        return;
      }
      const node = this.findNodeByKey(nodes, key);
      if (node) {
        this.selection.set(node);
        this.pendingSelectionKey.set(null);
      }
    });
  }

  onNodeSelect(event: { node: TreeNode<FileNodeData> }): void {
    const node = event.node;

    if (this.isDirectory(node)) {
      const wasExpanded = node.expanded === true;
      if (wasExpanded) {
        this.collapseDirectory(node);
      } else {
        this.expandDirectory(node);
      }
      this.directorySelected.emit(node);
      if (!wasExpanded) {
        this.directoryExpanded.emit(node);
      }
      return;
    }

    const predicate = this.openPredicate();
    if (predicate) {
      const result = predicate(node);
      if (!result.allowed) {
        this.fileOpenBlocked.emit({ node, result });
        return;
      }
    }

    this.fileSelected.emit(node);
  }

  onNodeExpand(event: { node: TreeNode<FileNodeData> }): void {
    const node = event.node;
    node.expanded = true;
    this.setExpandedState(node, true);

    if (this.isDirectory(node)) {
      this.directoryExpanded.emit(node);
    }
  }

  onNodeCollapse(event: { node: TreeNode<FileNodeData> }): void {
    event.node.expanded = false;
    this.setExpandedState(event.node, false);
  }

  isNodeLoading(node: TreeNode<FileNodeData> | undefined): boolean {
    if (!node || !this.isDirectory(node)) {
      return false;
    }

    return node.data?.isLoading === true;
  }

  getStatusClass(status: GitFileStatus | undefined): string {
    if (!status) {
      return "";
    }
    return this.lookupConfig(status).nodeClass;
  }

  getNodeClass(node: TreeNode<FileNodeData>): string {
    const status = node.data?.gitStatus;
    if (node.data?.isDirectory === true) {
      if (
        (status != null && status !== GitFileStatus.Unknown) ||
        this.hasChangedDescendant(node)
      ) {
        return "text-blue-500";
      }
      return "";
    }

    return this.getStatusClass(status);
  }

  getStatusLabel(status: GitFileStatus | undefined): string {
    if (!status) {
      return "";
    }
    return this.lookupConfig(status).label;
  }

  getStatusIndicator(status: GitFileStatus | undefined): string {
    if (!status) {
      return "";
    }
    return this.lookupConfig(status).indicator;
  }

  getStatusSeverity(
    status: GitFileStatus | undefined
  ): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    if (!status) {
      return "secondary";
    }
    return this.lookupConfig(status).badgeSeverity;
  }

  hasVisibleStatus(node: TreeNode<FileNodeData>): boolean {
    if (node.data?.isDirectory === true) {
      return false;
    }

    const status = node.data?.gitStatus;
    return this.getStatusIndicator(status).trim().length > 0;
  }

  getExpandedKeys(): Record<string, boolean> {
    return { ...this.expandedKeys() };
  }

  setExpandedKeys(keys: Record<string, boolean>): void {
    this.expandedKeys.set(keys);
  }

  getSelectedKey(): string | null {
    const sel = this.selection();
    if (!sel || Array.isArray(sel)) {
      return null;
    }
    return sel.key ?? null;
  }

  setSelectedKey(key: string | null): void {
    if (!key) {
      this.selection.set(null);
      this.pendingSelectionKey.set(null);
      return;
    }
    const node = this.findNodeByKey(this.treeNodes(), key);
    if (node) {
      this.selection.set(node);
      this.pendingSelectionKey.set(null);
    } else {
      this.pendingSelectionKey.set(key);
    }
  }

  private findNodeByKey(
    nodes: TreeNode<FileNodeData>[],
    key: string
  ): TreeNode<FileNodeData> | undefined {
    for (const node of nodes) {
      if (node.key === key) return node;
      if (node.children) {
        const found = this.findNodeByKey(node.children, key);
        if (found) return found;
      }
    }
    return undefined;
  }

  private isDirectory(node: TreeNode<FileNodeData> | undefined): boolean {
    return node?.data?.isDirectory === true;
  }

  private hasChangedDescendant(node: TreeNode<FileNodeData>): boolean {
    if (!node.children) {
      return false;
    }
    for (const child of node.children) {
      const s = child.data?.gitStatus;
      if (
        s != null &&
        s !== GitFileStatus.Unknown &&
        s !== GitFileStatus.Unmodified
      ) {
        return true;
      }
      if (this.hasChangedDescendant(child)) {
        return true;
      }
    }
    return false;
  }

  private lookupConfig(status: GitFileStatus): GitFileStatusConfig {
    return (
      this.statusConfig[status] ?? {
        nodeClass: "",
        label: "",
        indicator: "",
        badgeSeverity: "secondary",
      }
    );
  }

  private expandDirectory(node: TreeNode<FileNodeData>): void {
    node.expanded = true;
    node.leaf = false;
    this.setExpandedState(node, true);
  }

  private collapseDirectory(node: TreeNode<FileNodeData>): void {
    node.expanded = false;
    node.leaf = false;
    this.setExpandedState(node, false);
  }

  private setExpandedState(
    node: TreeNode<FileNodeData>,
    isExpanded: boolean
  ): void {
    const key = String(node.key ?? node.data?.filePath ?? "");
    if (!key) {
      return;
    }
    this.expandedKeys.update((current) => {
      if (isExpanded) {
        if (current[key]) {
          return current;
        }
        return { ...current, [key]: true };
      }
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  private buildTreeNodes(files: FileNodeData[]): TreeNode<FileNodeData>[] {
    const roots: TreeNode<FileNodeData>[] = [];
    const index = new Map<string, TreeNode<FileNodeData>>();

    for (const file of files) {
      const parts = this.extractPathParts(file.filePath);
      if (parts.length === 0) {
        continue;
      }

      let parentPath = "";
      let parentNode: TreeNode<FileNodeData> | undefined;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const currentPath = parentPath ? `${parentPath}/${part}` : part;
        const isLeaf = this.isLeafIndex(i, parts.length);

        const node = this.getOrCreateNode({
          index,
          roots,
          parentNode,
          currentPath,
          part,
          isLeaf,
          file,
        });

        this.applyLeafMetadata({ node, isLeaf, file, currentPath, part });
        parentPath = currentPath;
        parentNode = node;
      }
    }

    this.sortTreeNodes(roots);
    return roots;
  }

  private extractPathParts(filePath: string): string[] {
    return filePath.replace(/\\+/g, "/").split("/").filter(Boolean);
  }

  private getDisplayName(path: string): string {
    const parts = this.extractPathParts(path);
    return parts[parts.length - 1] ?? path;
  }

  private isLeafIndex(index: number, length: number): boolean {
    return index === length - 1;
  }

  private getOrCreateNode(params: {
    index: Map<string, TreeNode<FileNodeData>>;
    roots: TreeNode<FileNodeData>[];
    parentNode?: TreeNode<FileNodeData>;
    currentPath: string;
    part: string;
    isLeaf: boolean;
    file: FileNodeData;
  }): TreeNode<FileNodeData> {
    const { index, roots, parentNode, currentPath, part, isLeaf, file } =
      params;

    let node = index.get(currentPath);
    if (node) {
      return node;
    }

    node = isLeaf
      ? this.createLeafNode(currentPath, file)
      : this.createDirectoryNode(currentPath, part);

    index.set(currentPath, node);
    this.attachNode(node, parentNode, roots);
    return node;
  }

  private createDirectoryNode(
    path: string,
    name: string
  ): TreeNode<FileNodeData> {
    return {
      key: path,
      label: name,
      expanded: this.expandedKeys()[path],
      loading: false,
      data: {
        filePath: path,
        isDirectory: true,
      },
      children: [],
    };
  }

  private createLeafNode(
    path: string,
    file: FileNodeData
  ): TreeNode<FileNodeData> {
    return {
      key: path,
      label: this.getDisplayName(file.filePath),
      data: { ...file },
      children: [],
    };
  }

  private attachNode(
    node: TreeNode<FileNodeData>,
    parentNode: TreeNode<FileNodeData> | undefined,
    roots: TreeNode<FileNodeData>[]
  ): void {
    if (!parentNode) {
      roots.push(node);
      return;
    }

    parentNode.children ??= [];
    parentNode.children.push(node);
  }

  private applyLeafMetadata(params: {
    node: TreeNode<FileNodeData>;
    isLeaf: boolean;
    file: FileNodeData;
    currentPath: string;
    part: string;
  }): void {
    const { node, isLeaf, file, currentPath, part } = params;

    if (!isLeaf) {
      this.markAsDirectory(node, currentPath, part);
      return;
    }

    node.label = this.getDisplayName(file.filePath);
    node.data = { ...file };

    const shouldBeDirectory =
      file.isDirectory === true || (node.children?.length ?? 0) > 0;

    if (shouldBeDirectory) {
      this.markAsDirectory(node, currentPath, part, file);
      return;
    }

    node.data = { ...node.data, isDirectory: false };
    node.leaf = true;
  }

  private markAsDirectory(
    node: TreeNode<FileNodeData>,
    path: string,
    name: string,
    source?: FileNodeData
  ): void {
    node.label = name;
    node.data = {
      ...(source ?? node.data),
      filePath: path,
      isDirectory: true,
    };
    node.leaf = false;
    node.expanded = this.expandedKeys()[path];
    node.loading = this.getDirectoryLoadingState(node.data);
  }

  private getDirectoryLoadingState(data: FileNodeData | undefined): boolean {
    return data?.isLoading === true;
  }

  private sortTreeNodes(nodes: TreeNode<FileNodeData>[]): void {
    nodes.sort((a, b) => {
      const aDir = a.data?.isDirectory === true;
      const bDir = b.data?.isDirectory === true;
      if (aDir !== bDir) {
        return aDir ? -1 : 1;
      }

      return (a.label ?? "").localeCompare(b.label ?? "", undefined, {
        sensitivity: "base",
      });
    });

    for (const node of nodes) {
      if (node.children?.length) {
        this.sortTreeNodes(node.children);
      }
    }
  }
}
