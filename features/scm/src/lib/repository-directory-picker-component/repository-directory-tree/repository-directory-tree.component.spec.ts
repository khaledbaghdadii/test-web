import { RepositoryDirectoryTreeComponent } from "./repository-directory-tree.component";
import { RepositoryDirectoryTreeInput } from "./repository-directory-tree-input";
import { of, throwError } from "rxjs";
import { TreeNode } from "primeng/api";
import { DynamicDialogConfig, DynamicDialogRef } from "primeng/dynamicdialog";
import { ToastMessageService } from "@mxflow/ui/alert";
import { TestBed } from "@angular/core/testing";
import {
  DescribeRepositoryResponse,
  RepoItemType,
} from "../../describe-repository/describe-repository-response";

type MockDynamicDialogRef = jest.Mocked<
  Pick<DynamicDialogRef, "close" | "destroy">
>;

describe("Repository Directory Tree Component Test", () => {
  let dynamicDialogRef: MockDynamicDialogRef;
  let toastMessageService: ToastMessageService;

  beforeEach(() => {
    dynamicDialogRef = {
      close: jest.fn(),
      destroy: jest.fn(),
    } as unknown as MockDynamicDialogRef;
    toastMessageService = {
      showError: jest.fn(),
    } as unknown as ToastMessageService;
  });

  function createComponent(
    input?: Partial<RepositoryDirectoryTreeInput>
  ): RepositoryDirectoryTreeComponent {
    TestBed.configureTestingModule({
      providers: [
        RepositoryDirectoryTreeComponent,
        { provide: DynamicDialogRef, useValue: dynamicDialogRef },
        { provide: DynamicDialogConfig, useValue: { data: input } },
        { provide: ToastMessageService, useValue: toastMessageService },
      ],
    });
    const component = TestBed.inject(RepositoryDirectoryTreeComponent);
    if (input) {
      component.input = input as RepositoryDirectoryTreeInput;
    }
    return component;
  }

  function initComponent(
    input: Partial<RepositoryDirectoryTreeInput>
  ): RepositoryDirectoryTreeComponent {
    const component = createComponent(input);
    component.ngOnInit();
    return component;
  }

  it("should not build any nodes when no input is provided", () => {
    const component = initComponent(
      undefined as unknown as RepositoryDirectoryTreeInput
    );

    expect(component.directoriesTreeNode).toBeUndefined();
  });

  it("should build directory and file nodes when reading files", () => {
    const component = initComponent(getRepositoryDirectoryTreeInput());

    expect(component.directoriesTreeNode).toEqual(getTreeNodesWithFiles());
  });

  it("should build only directory nodes when not reading files", () => {
    const component = initComponent({
      directories: of(getDescribeRepositoryResponse()),
      preSelectedDirectory: "",
    });

    expect(component.directoriesTreeNode).toStrictEqual(
      getTreeNodesWithoutFiles()
    );
  });

  it("should pre select and expand the pre selected directory", () => {
    const component = initComponent(
      getRepositoryDirectoryTreeInputWithPreSelect()
    );

    expect(component.directoriesTreeNode).toStrictEqual(getTreeNodesExpanded());
    expect(component.selectedDirectory).toEqual(getSelectedRepository());
  });

  it("should not expand a directory whose name only prefixes the pre selected name", () => {
    const component = initComponent(
      getRepositoryDirectoryTreeInputWithPreSelectAndSimilarNames()
    );

    expect(component.directoriesTreeNode).toStrictEqual(
      getTreeNodesWithSimilarNames()
    );
    expect(component.selectedDirectory).toEqual(getAnotherSelectedRepository());
  });

  it("should pre select and expand the pre selected file in single selection mode", () => {
    const component = initComponent({
      directories: of(getDescribeRepositoryResponse()),
      failureMessageProvider: () => "",
      shouldReadFiles: true,
      multiSelection: false,
      preSelectedDirectory: "dir1/file1",
    });

    expect(component.directoriesTreeNode[0].expanded).toBe(true);
    expect(component.directoriesTreeNode[1].expanded).toBe(false);
    expect(component.directoriesTreeNode[2].expanded).toBe(false);
    expect(component.selectedDirectory.data).toEqual("dir1/file1");
  });

  it("should pre select and expand all pre selected files in multi selection mode", () => {
    const component = initComponent({
      directories: of(getDescribeRepositoryResponse()),
      failureMessageProvider: () => "",
      shouldReadFiles: true,
      multiSelection: true,
      preSelectedFiles: ["dir1/file1", "dir3/file3"],
    });

    expect(component.directoriesTreeNode[0].expanded).toBe(true);
    expect(component.directoriesTreeNode[1].expanded).toBe(false);
    expect(component.directoriesTreeNode[2].expanded).toBe(true);
    expect(
      (component.selectedDirectory as TreeNode[]).map((node) => node.data)
    ).toEqual(["dir1/file1", "dir3/file3"]);
  });

  it("should show an error and close the dialog when loading directories fails", () => {
    initComponent({
      directories: throwError(() => new Error("boom")),
      failureMessageProvider: () => "failure message",
    });

    expect(toastMessageService.showError).toHaveBeenCalledWith(
      "failure message",
      "Failed to load repository content."
    );
    expect(dynamicDialogRef.destroy).toHaveBeenCalled();
  });

  it("should close with the selected directory data in single selection mode", () => {
    const component = createComponent();
    component.selectedDirectory = { data: "directory" };

    component.select();

    expect(dynamicDialogRef.close).toHaveBeenCalledWith("directory");
  });

  it("should close with undefined in single selection mode when nothing is selected", () => {
    const component = createComponent();
    component.selectedDirectory = undefined;

    component.select();

    expect(dynamicDialogRef.close).toHaveBeenCalledWith(undefined);
  });

  it("should destroy the dialog reference on close", () => {
    const component = createComponent();

    component.close();

    expect(dynamicDialogRef.destroy).toHaveBeenCalled();
  });

  it("should keep only matching files and their parent directory when filtering by filename", () => {
    const component = initComponent({
      directories: of(getDescribeRepositoryResponse()),
      preSelectedDirectory: "",
      failureMessageProvider: () => "",
      shouldReadFiles: true,
      fileNameFilter: "file1",
    });

    expect(component.directoriesTreeNode).toStrictEqual(
      getTreeNodesFilteredByFileName()
    );
  });

  it("should keep nested directories that contain a matching file when filtering by filename", () => {
    const component = initComponent({
      directories: of(getNestedDescribeRepositoryResponse()),
      preSelectedDirectory: "",
      failureMessageProvider: () => "",
      shouldReadFiles: true,
      fileNameFilter: "target.json",
    });

    expect(component.directoriesTreeNode).toStrictEqual(
      getNestedTreeNodesFilteredByFileName()
    );
  });

  it("should close with the selected items data in multi selection mode", () => {
    const component = createComponent({ multiSelection: true });
    component.selectedDirectory = [
      { data: "dir1/file1" },
      { data: "dir2/file2" },
    ];

    component.select();

    expect(dynamicDialogRef.close).toHaveBeenCalledWith([
      "dir1/file1",
      "dir2/file2",
    ]);
  });

  it("should close with an empty array in multi selection mode when nothing is selected", () => {
    const component = createComponent({ multiSelection: true });
    component.selectedDirectory = undefined;

    component.select();

    expect(dynamicDialogRef.close).toHaveBeenCalledWith([]);
  });

  it.each<[string, TreeNode | TreeNode[] | undefined, boolean]>([
    ["an empty array", [], true],
    ["a populated array", [{ data: "dir1/file1" }], false],
    ["undefined", undefined, true],
    ["a single selected directory", { data: "dir1" }, false],
  ])(
    "should evaluate isDirectoryNotSelected for %s",
    (_caseName, selection, expected) => {
      const component = createComponent();
      component.selectedDirectory = selection;

      expect(component.isDirectoryNotSelected()).toBe(expected);
    }
  );
});

function getRepositoryDirectoryTreeInput(): RepositoryDirectoryTreeInput {
  return {
    directories: of(getDescribeRepositoryResponse()),
    preSelectedDirectory: "",
    failureMessageProvider: () => "",
    shouldReadFiles: true,
  };
}

function getRepositoryDirectoryTreeInputWithPreSelect(): RepositoryDirectoryTreeInput {
  return {
    directories: of(getDescribeRepositoryResponse()),
    preSelectedDirectory: "dir1/subDir1",
    failureMessageProvider: () => "",
  };
}

function getRepositoryDirectoryTreeInputWithPreSelectAndSimilarNames(): RepositoryDirectoryTreeInput {
  return {
    directories: of(getDescribeRepositoryResponseWithSimilarNames()),
    preSelectedDirectory: "directoryDuplicate",
    failureMessageProvider: () => "",
  };
}

function getDescribeRepositoryResponse(): DescribeRepositoryResponse {
  return {
    repositoryItems: [
      {
        parentPath: "",
        name: "dir1",
        children: [
          {
            parentPath: "dir1",
            name: "subDir1",
            children: [],
            type: RepoItemType.DIRECTORY,
          },
          {
            parentPath: "dir1",
            name: "file1",
            type: RepoItemType.FILE,
          },
        ],
        type: RepoItemType.DIRECTORY,
      },
      {
        parentPath: "",
        name: "dir2",
        children: [
          {
            parentPath: "dir2",
            name: "subDir2",
            children: [],
            type: RepoItemType.DIRECTORY,
          },
        ],
        type: RepoItemType.DIRECTORY,
      },
      {
        parentPath: "",
        name: "dir3",
        children: [
          {
            parentPath: "dir3",
            name: "file3",
            type: RepoItemType.FILE,
          },
        ],
        type: RepoItemType.DIRECTORY,
      },
      {
        parentPath: "",
        name: "file",
        type: RepoItemType.FILE,
      },
    ],
  };
}

function getDescribeRepositoryResponseWithSimilarNames(): DescribeRepositoryResponse {
  return {
    repositoryItems: [
      {
        parentPath: "",
        name: "directory",
        children: [],
        type: RepoItemType.DIRECTORY,
      },
      {
        parentPath: "",
        name: "directoryDuplicate",
        children: [],
        type: RepoItemType.DIRECTORY,
      },
    ],
  };
}

function getTreeNodesWithFiles(): TreeNode[] {
  return [
    {
      label: "dir1",
      data: "dir1",
      key: "dir1",
      expanded: false,
      expandedIcon: "pi pi-folder-open",
      collapsedIcon: "pi pi-folder",
      children: [
        {
          label: "subDir1",
          data: "dir1/subDir1",
          key: "dir1/subDir1",
          expanded: false,
          expandedIcon: "pi pi-folder-open",
          collapsedIcon: "pi pi-folder",
          children: [],
          selectable: false,
        },
        {
          label: "file1",
          data: "dir1/file1",
          key: "dir1/file1",
          collapsedIcon: "pi pi-file",
          leaf: true,
          selectable: true,
        },
      ],
      selectable: false,
    },
    {
      label: "dir2",
      data: "dir2",
      key: "dir2",
      expanded: false,
      expandedIcon: "pi pi-folder-open",
      collapsedIcon: "pi pi-folder",
      children: [
        {
          label: "subDir2",
          data: "dir2/subDir2",
          key: "dir2/subDir2",
          expanded: false,
          expandedIcon: "pi pi-folder-open",
          collapsedIcon: "pi pi-folder",
          children: [],
          selectable: false,
        },
      ],
      selectable: false,
    },
    {
      label: "dir3",
      data: "dir3",
      key: "dir3",
      expanded: false,
      expandedIcon: "pi pi-folder-open",
      collapsedIcon: "pi pi-folder",
      children: [
        {
          label: "file3",
          data: "dir3/file3",
          key: "dir3/file3",
          collapsedIcon: "pi pi-file",
          leaf: true,
          selectable: true,
        },
      ],
      selectable: false,
    },
    {
      label: "file",
      data: "file",
      key: "file",
      collapsedIcon: "pi pi-file",
      leaf: true,
      selectable: true,
    },
  ];
}

function getTreeNodesWithoutFiles(): TreeNode[] {
  return [
    {
      label: "dir1",
      data: "dir1",
      key: "dir1",
      expanded: false,
      expandedIcon: "pi pi-folder-open",
      collapsedIcon: "pi pi-folder",
      children: [
        {
          label: "subDir1",
          data: "dir1/subDir1",
          key: "dir1/subDir1",
          expanded: false,
          expandedIcon: "pi pi-folder-open",
          collapsedIcon: "pi pi-folder",
          children: [],
          selectable: true,
        },
      ],
      selectable: true,
    },
    {
      label: "dir2",
      data: "dir2",
      key: "dir2",
      expanded: false,
      expandedIcon: "pi pi-folder-open",
      collapsedIcon: "pi pi-folder",
      children: [
        {
          label: "subDir2",
          data: "dir2/subDir2",
          key: "dir2/subDir2",
          expanded: false,
          expandedIcon: "pi pi-folder-open",
          collapsedIcon: "pi pi-folder",
          children: [],
          selectable: true,
        },
      ],
      selectable: true,
    },
    {
      label: "dir3",
      data: "dir3",
      key: "dir3",
      expanded: false,
      expandedIcon: "pi pi-folder-open",
      collapsedIcon: "pi pi-folder",
      children: [],
      selectable: true,
    },
  ];
}

function getTreeNodesExpanded(): TreeNode[] {
  return [
    {
      label: "dir1",
      data: "dir1",
      key: "dir1",
      expanded: true,
      expandedIcon: "pi pi-folder-open",
      collapsedIcon: "pi pi-folder",
      children: [
        {
          label: "subDir1",
          data: "dir1/subDir1",
          key: "dir1/subDir1",
          expanded: false,
          expandedIcon: "pi pi-folder-open",
          collapsedIcon: "pi pi-folder",
          children: [],
          selectable: true,
        },
      ],
      selectable: true,
    },
    {
      label: "dir2",
      data: "dir2",
      key: "dir2",
      expanded: false,
      expandedIcon: "pi pi-folder-open",
      collapsedIcon: "pi pi-folder",
      children: [
        {
          label: "subDir2",
          data: "dir2/subDir2",
          key: "dir2/subDir2",
          expanded: false,
          expandedIcon: "pi pi-folder-open",
          collapsedIcon: "pi pi-folder",
          children: [],
          selectable: true,
        },
      ],
      selectable: true,
    },
    {
      label: "dir3",
      data: "dir3",
      key: "dir3",
      expanded: false,
      expandedIcon: "pi pi-folder-open",
      collapsedIcon: "pi pi-folder",
      children: [],
      selectable: true,
    },
  ];
}

function getTreeNodesWithSimilarNames(): TreeNode[] {
  return [
    {
      label: "directory",
      data: "directory",
      key: "directory",
      expanded: false,
      expandedIcon: "pi pi-folder-open",
      collapsedIcon: "pi pi-folder",
      children: [],
      selectable: true,
    },
    {
      label: "directoryDuplicate",
      data: "directoryDuplicate",
      key: "directoryDuplicate",
      expanded: false,
      expandedIcon: "pi pi-folder-open",
      collapsedIcon: "pi pi-folder",
      children: [],
      selectable: true,
    },
  ];
}

function getSelectedRepository(): TreeNode {
  return {
    label: "subDir1",
    data: "dir1/subDir1",
    key: "dir1/subDir1",
    expanded: false,
    expandedIcon: "pi pi-folder-open",
    collapsedIcon: "pi pi-folder",
    children: [],
    selectable: true,
  };
}

function getAnotherSelectedRepository(): TreeNode {
  return {
    label: "directoryDuplicate",
    data: "directoryDuplicate",
    key: "directoryDuplicate",
    expanded: false,
    expandedIcon: "pi pi-folder-open",
    collapsedIcon: "pi pi-folder",
    children: [],
    selectable: true,
  };
}

function getNestedDescribeRepositoryResponse(): DescribeRepositoryResponse {
  return {
    repositoryItems: [
      {
        parentPath: "",
        name: "dirA",
        children: [
          {
            parentPath: "dirA",
            name: "subA",
            children: [
              {
                parentPath: "dirA/subA",
                name: "target.json",
                type: RepoItemType.FILE,
              },
            ],
            type: RepoItemType.DIRECTORY,
          },
        ],
        type: RepoItemType.DIRECTORY,
      },
      {
        parentPath: "",
        name: "dirB",
        children: [
          {
            parentPath: "dirB",
            name: "other.json",
            type: RepoItemType.FILE,
          },
        ],
        type: RepoItemType.DIRECTORY,
      },
    ],
  };
}

function getTreeNodesFilteredByFileName(): TreeNode[] {
  return [
    {
      label: "dir1",
      data: "dir1",
      key: "dir1",
      expanded: false,
      expandedIcon: "pi pi-folder-open",
      collapsedIcon: "pi pi-folder",
      children: [
        {
          label: "file1",
          data: "dir1/file1",
          key: "dir1/file1",
          collapsedIcon: "pi pi-file",
          children: undefined,
          leaf: true,
          selectable: true,
        },
      ],
      selectable: false,
    },
  ];
}

function getNestedTreeNodesFilteredByFileName(): TreeNode[] {
  return [
    {
      label: "dirA",
      data: "dirA",
      key: "dirA",
      expanded: false,
      expandedIcon: "pi pi-folder-open",
      collapsedIcon: "pi pi-folder",
      children: [
        {
          label: "subA",
          data: "dirA/subA",
          key: "dirA/subA",
          expanded: false,
          expandedIcon: "pi pi-folder-open",
          collapsedIcon: "pi pi-folder",
          children: [
            {
              label: "target.json",
              data: "dirA/subA/target.json",
              key: "dirA/subA/target.json",
              collapsedIcon: "pi pi-file",
              children: undefined,
              leaf: true,
              selectable: true,
            },
          ],
          selectable: false,
        },
      ],
      selectable: false,
    },
  ];
}
