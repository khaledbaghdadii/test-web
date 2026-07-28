import { TreeNode } from "primeng/api";
import { FileNodeData } from "./file-node-data.interface";

export interface FileOpenResult {
  allowed: boolean;
  warningMessage?: string;
}

export type FileOpenPredicate = (
  node: TreeNode<FileNodeData>
) => FileOpenResult;
