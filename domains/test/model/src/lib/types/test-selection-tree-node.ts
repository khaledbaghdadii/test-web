export interface TestSelectionTreeNode {
  id: string;
  name: string;
  parentId: string | null;
  children: TestSelectionTreeNode[];
  type: string;
}
