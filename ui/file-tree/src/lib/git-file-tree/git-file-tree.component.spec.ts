import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TreeNode } from "primeng/api";

import { GitFileTreeComponent } from "./git-file-tree.component";
import { FileNodeData } from "../models/file-node-data.interface";
import { GitFileStatus } from "../models/git-file-status.enum";
import {
  FileOpenPredicate,
  FileOpenResult,
} from "../models/file-open-predicate.type";

function fileNode(
  overrides: Partial<FileNodeData> & { filePath: string }
): TreeNode<FileNodeData> {
  const label =
    overrides.filePath.split(/[\\/]/).filter(Boolean).pop() ??
    overrides.filePath;
  return {
    label,
    leaf: true,
    data: {
      ...overrides,
      filePath: overrides.filePath,
      isDirectory: false,
    },
  };
}

function buildSampleFiles(): FileNodeData[] {
  return [
    {
      filePath: "src/main.ts",
      isDirectory: false,
      gitStatus: GitFileStatus.Modified,
      sizeInBytes: 512,
    },
    {
      filePath: "src/index.html",
      isDirectory: false,
      gitStatus: GitFileStatus.Unmodified,
      sizeInBytes: 256,
    },
    {
      filePath: "src/archive.jar",
      isDirectory: false,
      sizeInBytes: 2_000_000,
    },
    {
      filePath: "README.md",
      isDirectory: false,
      gitStatus: GitFileStatus.Added,
      sizeInBytes: 1024,
    },
  ];
}

function buildFilesWithoutDirectoryHints(): FileNodeData[] {
  return [
    {
      filePath: "src/app",
    },
    {
      filePath: "src/app/main.ts",
      sizeInBytes: 512,
    },
  ];
}

function extractTreeNodes(
  component: GitFileTreeComponent
): TreeNode<FileNodeData>[] {
  return (
    component as unknown as { treeNodes: () => TreeNode<FileNodeData>[] }
  ).treeNodes();
}

function extractExpandedKeys(
  component: GitFileTreeComponent
): Record<string, boolean> {
  return (
    component as unknown as { expandedKeys: () => Record<string, boolean> }
  ).expandedKeys();
}

function findNodeByPath(
  nodes: TreeNode<FileNodeData>[],
  path: string
): TreeNode<FileNodeData> | undefined {
  for (const node of nodes) {
    if (node.data?.filePath === path) {
      return node;
    }
    if (node.children?.length) {
      const child = findNodeByPath(node.children, path);
      if (child) {
        return child;
      }
    }
  }
  return undefined;
}

describe("GitFileTreeComponent", () => {
  let component: GitFileTreeComponent;
  let fixture: ComponentFixture<GitFileTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GitFileTreeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GitFileTreeComponent);
    component = fixture.componentInstance;
  });

  describe("rendering", () => {
    it("should create the component", () => {
      fixture.componentRef.setInput("files", []);
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it("should accept flat files via the files input", () => {
      const files = buildSampleFiles();
      fixture.componentRef.setInput("files", files);
      fixture.detectChanges();
      expect(component.files()).toEqual(files);
    });

    it("should derive hierarchical tree nodes from flat file paths", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      const tree = extractTreeNodes(component);
      expect(tree.map((node) => node.label)).toEqual(["src", "README.md"]);

      const srcDirectory = findNodeByPath(tree, "src");
      expect(srcDirectory?.data?.isDirectory).toBe(true);

      const mainTs = findNodeByPath(tree, "src/main.ts");
      expect(mainTs?.leaf).toBe(true);
    });

    it("should infer directories when isDirectory is missing", () => {
      fixture.componentRef.setInput("files", buildFilesWithoutDirectoryHints());
      fixture.detectChanges();

      const tree = extractTreeNodes(component);
      const inferredDirectory = findNodeByPath(tree, "src/app");
      const inferredFile = findNodeByPath(tree, "src/app/main.ts");

      expect(inferredDirectory?.data?.isDirectory).toBe(true);
      expect(inferredDirectory?.leaf).toBe(false);
      expect(inferredFile?.data?.isDirectory).toBe(false);
      expect(inferredFile?.leaf).toBe(true);
    });
  });

  describe("file selection", () => {
    it("should emit fileSelected when a file node is selected", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      const emitSpy = jest.fn();
      component.fileSelected.subscribe(emitSpy);

      const fileToSelect = findNodeByPath(
        extractTreeNodes(component),
        "README.md"
      )!;
      component.onNodeSelect({ node: fileToSelect });

      expect(emitSpy).toHaveBeenCalledWith(fileToSelect);
    });

    it("should NOT emit fileSelected when a directory node is selected", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      const emitSpy = jest.fn();
      component.fileSelected.subscribe(emitSpy);

      const dirNode = findNodeByPath(extractTreeNodes(component), "src")!;
      component.onNodeSelect({ node: dirNode });

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it("should emit directorySelected when a directory node is selected", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      const fileSelectedSpy = jest.fn();
      const directorySelectedSpy = jest.fn();
      component.fileSelected.subscribe(fileSelectedSpy);
      component.directorySelected.subscribe(directorySelectedSpy);

      const dirNode = findNodeByPath(extractTreeNodes(component), "src")!;
      component.onNodeSelect({ node: dirNode });

      expect(fileSelectedSpy).not.toHaveBeenCalled();
      expect(directorySelectedSpy).toHaveBeenCalledWith(dirNode);
    });

    it("should expand a directory when the directory node is selected", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      const expandedSpy = jest.fn();
      component.directoryExpanded.subscribe(expandedSpy);

      const dirNode = findNodeByPath(extractTreeNodes(component), "src")!;
      expect(dirNode.expanded).not.toBe(true);

      component.onNodeSelect({ node: dirNode });

      expect(dirNode.expanded).toBe(true);
      expect(extractExpandedKeys(component)).toEqual(
        expect.objectContaining({ src: true })
      );
      expect(expandedSpy).toHaveBeenCalledWith(dirNode);
    });

    it("should collapse a directory when it is selected again", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      const expandedSpy = jest.fn();
      component.directoryExpanded.subscribe(expandedSpy);

      const dirNode = findNodeByPath(extractTreeNodes(component), "src")!;

      component.onNodeSelect({ node: dirNode });
      expect(dirNode.expanded).toBe(true);
      expect(extractExpandedKeys(component)).toEqual(
        expect.objectContaining({ src: true })
      );

      component.onNodeSelect({ node: dirNode });
      expect(dirNode.expanded).toBe(false);
      expect(extractExpandedKeys(component)).not.toEqual(
        expect.objectContaining({ src: true })
      );
      expect(expandedSpy).toHaveBeenCalledTimes(1);
    });

    it("should emit directoryExpanded when a directory node is expanded", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      const directoryExpandedSpy = jest.fn();
      component.directoryExpanded.subscribe(directoryExpandedSpy);

      const dirNode = findNodeByPath(extractTreeNodes(component), "src")!;
      component.onNodeExpand({ node: dirNode });

      expect(directoryExpandedSpy).toHaveBeenCalledWith(dirNode);
    });
  });

  describe("expansion state", () => {
    it("should keep expanded directories expanded when files input updates", () => {
      fixture.componentRef.setInput("files", [
        { filePath: "src", isDirectory: true },
      ]);
      fixture.detectChanges();

      const srcNode = findNodeByPath(extractTreeNodes(component), "src")!;
      component.onNodeExpand({ node: srcNode });

      fixture.componentRef.setInput("files", [
        { filePath: "src", isDirectory: true },
        { filePath: "src/main.ts", isDirectory: false },
      ]);
      fixture.detectChanges();

      expect(extractExpandedKeys(component)).toEqual(
        expect.objectContaining({ src: true })
      );
    });
  });

  describe("directory loading", () => {
    it("should report loading only for directories flagged with isLoading", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      const srcNode = findNodeByPath(extractTreeNodes(component), "src")!;
      const fileNode = findNodeByPath(
        extractTreeNodes(component),
        "README.md"
      )!;

      srcNode.data = {
        ...(srcNode.data ?? { filePath: "src", isDirectory: true }),
        isLoading: true,
      };

      expect(component.isNodeLoading(srcNode)).toBe(true);
      expect(component.isNodeLoading(fileNode)).toBe(false);
    });
  });

  describe("open predicate", () => {
    it("should emit fileSelected when predicate allows", () => {
      const allowAll: FileOpenPredicate = () => ({ allowed: true });

      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.componentRef.setInput("openPredicate", allowAll);
      fixture.detectChanges();

      const selectedSpy = jest.fn();
      component.fileSelected.subscribe(selectedSpy);

      const fileNode = findNodeByPath(
        extractTreeNodes(component),
        "README.md"
      )!;
      component.onNodeSelect({ node: fileNode });

      expect(selectedSpy).toHaveBeenCalledWith(fileNode);
    });

    it("should emit fileOpenBlocked when predicate blocks", () => {
      const blockResult: FileOpenResult = {
        allowed: false,
        warningMessage: "File too large",
      };
      const blockAll: FileOpenPredicate = () => blockResult;

      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.componentRef.setInput("openPredicate", blockAll);
      fixture.detectChanges();

      const selectedSpy = jest.fn();
      const blockedSpy = jest.fn();
      component.fileSelected.subscribe(selectedSpy);
      component.fileOpenBlocked.subscribe(blockedSpy);

      const fileNode = findNodeByPath(
        extractTreeNodes(component),
        "README.md"
      )!;
      component.onNodeSelect({ node: fileNode });

      expect(selectedSpy).not.toHaveBeenCalled();
      expect(blockedSpy).toHaveBeenCalledWith({
        node: fileNode,
        result: blockResult,
      });
    });

    it("should evaluate predicate with the selected node", () => {
      const maxSizePredicate: FileOpenPredicate = (node) => ({
        allowed: (node.data?.sizeInBytes ?? 0) <= 1_048_576,
        warningMessage: "File exceeds 1 MB.",
      });

      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.componentRef.setInput("openPredicate", maxSizePredicate);
      fixture.detectChanges();

      const blockedSpy = jest.fn();
      component.fileOpenBlocked.subscribe(blockedSpy);

      // archive.jar is 2 MB → should be blocked
      const largeFile = findNodeByPath(
        extractTreeNodes(component),
        "src/archive.jar"
      )!;
      component.onNodeSelect({ node: largeFile });

      expect(blockedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          result: expect.objectContaining({ allowed: false }),
        })
      );
    });

    it("should pass through when no predicate is provided", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      const selectedSpy = jest.fn();
      component.fileSelected.subscribe(selectedSpy);

      const fileNode = findNodeByPath(
        extractTreeNodes(component),
        "README.md"
      )!;
      component.onNodeSelect({ node: fileNode });

      expect(selectedSpy).toHaveBeenCalledWith(fileNode);
    });
  });

  describe("git status helpers", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("files", []);
      fixture.detectChanges();
    });

    it("should return the correct CSS class for a known status", () => {
      expect(component.getStatusClass(GitFileStatus.Modified)).toBe(
        "text-yellow-500"
      );
      expect(component.getStatusClass(GitFileStatus.Conflicted)).toBe(
        "text-red-500"
      );
    });

    it("should force changed directories to blue class", () => {
      const changedDirectoryNode: TreeNode<FileNodeData> = {
        label: "src",
        data: {
          filePath: "src",
          isDirectory: true,
          gitStatus: GitFileStatus.Modified,
        },
      };

      expect(component.getNodeClass(changedDirectoryNode)).toBe(
        "text-blue-500"
      );
    });

    it("should keep unknown directories with empty class", () => {
      const unknownDirectoryNode: TreeNode<FileNodeData> = {
        label: "src",
        data: {
          filePath: "src",
          isDirectory: true,
          gitStatus: GitFileStatus.Unknown,
        },
      };

      expect(component.getNodeClass(unknownDirectoryNode)).toBe("");
    });

    it("should return an empty string for undefined status", () => {
      expect(component.getStatusClass(undefined)).toBe("");
    });

    it("should return the correct indicator letter", () => {
      expect(component.getStatusIndicator(GitFileStatus.Modified)).toBe("M");
      expect(component.getStatusIndicator(GitFileStatus.Conflicted)).toBe("!");
      expect(component.getStatusIndicator(GitFileStatus.Added)).toBe("N");
    });

    it("should return the correct label", () => {
      expect(component.getStatusLabel(GitFileStatus.Staged)).toBe("Staged");
      expect(component.getStatusLabel(GitFileStatus.Deleted)).toBe("Deleted");
    });

    it("should return the correct tag severity", () => {
      expect(component.getStatusSeverity(GitFileStatus.Modified)).toBe("warn");
      expect(component.getStatusSeverity(GitFileStatus.Conflicted)).toBe(
        "danger"
      );
      expect(component.getStatusSeverity(undefined)).toBe("secondary");
    });

    it("should identify visible status correctly", () => {
      const modifiedNode = fileNode({
        filePath: "a.ts",
        gitStatus: GitFileStatus.Modified,
      });
      const modifiedDirectoryNode: TreeNode<FileNodeData> = {
        label: "src",
        data: {
          filePath: "src",
          isDirectory: true,
          gitStatus: GitFileStatus.Modified,
        },
      };
      const unmodifiedNode = fileNode({
        filePath: "b.ts",
        gitStatus: GitFileStatus.Unmodified,
      });
      const noStatusNode = fileNode({ filePath: "c.ts" });
      const unknownNode = fileNode({
        filePath: "d.ts",
        gitStatus: GitFileStatus.Unknown,
      });

      expect(component.hasVisibleStatus(modifiedNode)).toBe(true);
      expect(component.hasVisibleStatus(modifiedDirectoryNode)).toBe(false);
      expect(component.hasVisibleStatus(unmodifiedNode)).toBe(false);
      expect(component.hasVisibleStatus(noStatusNode)).toBe(false);
      expect(component.hasVisibleStatus(unknownNode)).toBe(false);
    });

    it("should return file status class when node is a file", () => {
      const modifiedFileNode: TreeNode<FileNodeData> = {
        label: "main.ts",
        data: {
          filePath: "src/main.ts",
          isDirectory: false,
          gitStatus: GitFileStatus.Modified,
        },
      };

      expect(component.getNodeClass(modifiedFileNode)).toBe("text-yellow-500");
    });

    it("should return empty string when directory has no gitStatus", () => {
      const directoryWithoutStatus: TreeNode<FileNodeData> = {
        label: "lib",
        data: {
          filePath: "lib",
          isDirectory: true,
        },
      };

      expect(component.getNodeClass(directoryWithoutStatus)).toBe("");
    });

    it("should mark directory blue when it has a changed descendant", () => {
      const parentDirectory: TreeNode<FileNodeData> = {
        label: "src",
        data: {
          filePath: "src",
          isDirectory: true,
        },
        children: [
          {
            label: "deleted.txt",
            data: {
              filePath: "src/deleted.txt",
              isDirectory: false,
              gitStatus: GitFileStatus.Deleted,
            },
          },
        ],
      };

      expect(component.getNodeClass(parentDirectory)).toBe("text-blue-500");
    });

    it("should mark directory blue when it has a deeply nested changed descendant", () => {
      const parentDirectory: TreeNode<FileNodeData> = {
        label: "root",
        data: {
          filePath: "root",
          isDirectory: true,
        },
        children: [
          {
            label: "nested",
            data: {
              filePath: "root/nested",
              isDirectory: true,
            },
            children: [
              {
                label: "file.txt",
                data: {
                  filePath: "root/nested/file.txt",
                  isDirectory: false,
                  gitStatus: GitFileStatus.Deleted,
                },
              },
            ],
          },
        ],
      };

      expect(component.getNodeClass(parentDirectory)).toBe("text-blue-500");
    });
  });

  describe("node collapse", () => {
    it("should set expanded to false when node is collapsed", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      const dirNode = findNodeByPath(extractTreeNodes(component), "src")!;
      component.onNodeExpand({ node: dirNode });
      expect(extractExpandedKeys(component)).toEqual(
        expect.objectContaining({ src: true })
      );

      component.onNodeCollapse({ node: dirNode });

      expect(dirNode.expanded).toBe(false);
      expect(extractExpandedKeys(component)["src"]).toBeUndefined();
    });
  });

  describe("expanded keys API", () => {
    it("should return a copy of expanded keys when getExpandedKeys is called", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      const dirNode = findNodeByPath(extractTreeNodes(component), "src")!;
      component.onNodeExpand({ node: dirNode });

      const keys = component.getExpandedKeys();

      expect(keys).toEqual({ src: true });
      keys["src"] = false;
      expect(component.getExpandedKeys()).toEqual({ src: true });
    });

    it("should replace all expanded keys when setExpandedKeys is called", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      component.setExpandedKeys({ src: true, "src/nested": true });

      expect(component.getExpandedKeys()).toEqual({
        src: true,
        "src/nested": true,
      });
    });
  });

  describe("selected key API", () => {
    it("should return null when no selection exists", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      expect(component.getSelectedKey()).toBeNull();
    });

    it("should return the key of the currently selected node", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      const fileNode = findNodeByPath(
        extractTreeNodes(component),
        "README.md"
      )!;
      component.selection.set(fileNode);

      expect(component.getSelectedKey()).toBe("README.md");
    });

    it("should return null when selection is an array", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      const fileNode = findNodeByPath(
        extractTreeNodes(component),
        "README.md"
      )!;
      component.selection.set([fileNode]);

      expect(component.getSelectedKey()).toBeNull();
    });

    it("should set selection to a node with the given key when setSelectedKey is called", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      component.setSelectedKey("README.md");

      expect(component.getSelectedKey()).toBe("README.md");
    });

    it("should clear selection when setSelectedKey is called with null", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      component.setSelectedKey("README.md");
      component.setSelectedKey(null);

      expect(component.getSelectedKey()).toBeNull();
    });

    it("should defer selection when key is not yet in the tree", () => {
      fixture.componentRef.setInput("files", []);
      fixture.detectChanges();

      component.setSelectedKey("src/main.ts");

      expect(component.getSelectedKey()).toBeNull();

      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      expect(component.getSelectedKey()).toBe("src/main.ts");
    });

    it("should resolve deferred selection when matching files arrive", () => {
      fixture.componentRef.setInput("files", [
        { filePath: "README.md", isDirectory: false },
      ]);
      fixture.detectChanges();

      component.setSelectedKey("src/main.ts");
      expect(component.getSelectedKey()).toBeNull();

      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      expect(component.getSelectedKey()).toBe("src/main.ts");
    });

    it("should clear pending selection when setSelectedKey is called with null", () => {
      fixture.componentRef.setInput("files", []);
      fixture.detectChanges();

      component.setSelectedKey("src/main.ts");
      component.setSelectedKey(null);

      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      expect(component.getSelectedKey()).toBeNull();
    });
  });

  describe("node expand for non-directory", () => {
    it("should not emit directoryExpanded when a non-directory node is expanded", () => {
      fixture.componentRef.setInput("files", buildSampleFiles());
      fixture.detectChanges();

      const directoryExpandedSpy = jest.fn();
      component.directoryExpanded.subscribe(directoryExpandedSpy);

      const fileNode = findNodeByPath(
        extractTreeNodes(component),
        "README.md"
      )!;
      component.onNodeExpand({ node: fileNode });

      expect(directoryExpandedSpy).not.toHaveBeenCalled();
    });
  });

  describe("isNodeLoading edge cases", () => {
    it("should return false when node is undefined", () => {
      fixture.componentRef.setInput("files", []);
      fixture.detectChanges();

      expect(component.isNodeLoading(undefined)).toBe(false);
    });

    it("should return false when node data is undefined", () => {
      fixture.componentRef.setInput("files", []);
      fixture.detectChanges();

      const nodeWithoutData: TreeNode<FileNodeData> = {
        label: "empty",
        data: undefined,
      };

      expect(component.isNodeLoading(nodeWithoutData)).toBe(false);
    });
  });

  describe("tree building edge cases", () => {
    it("should normalize backslash paths when building tree nodes", () => {
      fixture.componentRef.setInput("files", [
        { filePath: "src\\app\\main.ts", isDirectory: false },
      ]);
      fixture.detectChanges();

      const tree = extractTreeNodes(component);
      const srcNode = tree.find((n) => n.key === "src");
      const appNode = srcNode?.children?.find((n) => n.key === "src/app");
      const mainTs = appNode?.children?.find(
        (n) => n.key === "src/app/main.ts"
      );

      expect(mainTs).toBeDefined();
      expect(mainTs?.label).toBe("main.ts");
    });

    it("should skip files with empty filePath when building tree", () => {
      fixture.componentRef.setInput("files", [
        { filePath: "", isDirectory: false },
        { filePath: "valid.ts", isDirectory: false },
      ]);
      fixture.detectChanges();

      const tree = extractTreeNodes(component);

      expect(tree).toHaveLength(1);
      expect(tree[0].label).toBe("valid.ts");
    });

    it("should sort directories before files at the same level", () => {
      fixture.componentRef.setInput("files", [
        { filePath: "zebra.ts", isDirectory: false },
        { filePath: "alpha/file.ts", isDirectory: false },
        { filePath: "beta.ts", isDirectory: false },
      ]);
      fixture.detectChanges();

      const tree = extractTreeNodes(component);
      const labels = tree.map((n) => n.label);

      expect(labels).toEqual(["alpha", "beta.ts", "zebra.ts"]);
    });

    it("should sort files alphabetically within the same level", () => {
      fixture.componentRef.setInput("files", [
        { filePath: "c.ts", isDirectory: false },
        { filePath: "a.ts", isDirectory: false },
        { filePath: "b.ts", isDirectory: false },
      ]);
      fixture.detectChanges();

      const tree = extractTreeNodes(component);
      const labels = tree.map((n) => n.label);

      expect(labels).toEqual(["a.ts", "b.ts", "c.ts"]);
    });
  });

  describe("loading state", () => {
    it("should expose loading input as true when set", () => {
      fixture.componentRef.setInput("files", []);
      fixture.componentRef.setInput("loading", true);
      fixture.detectChanges();

      expect(component.loading()).toBe(true);
    });

    it("should default loading to false", () => {
      fixture.componentRef.setInput("files", []);
      fixture.detectChanges();

      expect(component.loading()).toBe(false);
    });
  });

  describe("selection mode", () => {
    it("should default selectionMode to single", () => {
      fixture.componentRef.setInput("files", []);
      fixture.detectChanges();

      expect(component.selectionMode()).toBe("single");
    });

    it("should accept multiple as selectionMode", () => {
      fixture.componentRef.setInput("files", []);
      fixture.componentRef.setInput("selectionMode", "multiple");
      fixture.detectChanges();

      expect(component.selectionMode()).toBe("multiple");
    });
  });
});
