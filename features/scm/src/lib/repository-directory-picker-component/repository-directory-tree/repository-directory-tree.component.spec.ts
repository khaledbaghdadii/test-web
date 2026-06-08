import { RepositoryDirectoryTreeComponent } from "./repository-directory-tree.component";
import { RepositoryDirectoryTreeInput } from "./repository-directory-tree-input";
import { of } from "rxjs";
import { TreeNode } from "primeng/api";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  DescribeRepositoryResponse,
  RepoItemType,
} from "../../describe-repository/describe-repository-response";

describe("Repository Directory Tree Component Test", () => {
  const dynamicDialogRef: any = {
    close: jest.fn(),
    destroy: jest.fn(),
  };
  let dynamicDialogConfig: any = {
    data: getRepositoryDirectoryTreeInput(),
  };
  const toastMessageService: ToastMessageService = {
    showError: jest.fn(),
  } as unknown as ToastMessageService;

  let repositoryDirectoryTreeComponent: RepositoryDirectoryTreeComponent;

  beforeEach(() => {
    repositoryDirectoryTreeComponent = new RepositoryDirectoryTreeComponent(
      dynamicDialogRef,
      dynamicDialogConfig,
      toastMessageService
    );
  });

  it("should create the tree node from the directories and files correctly", () => {
    repositoryDirectoryTreeComponent.ngOnInit();

    expect(repositoryDirectoryTreeComponent.directoriesTreeNode).toEqual(
      getTreeNodesWithFiles()
    );
  });

  it("should create the tree node from the directories correctly if should read files is false", () => {
    dynamicDialogConfig = {
      data: {
        directories: of(getDescribeRepositoryResponse()),
        preSelectedDirectory: "",
      },
    };
    repositoryDirectoryTreeComponent = new RepositoryDirectoryTreeComponent(
      dynamicDialogRef,
      dynamicDialogConfig,
      toastMessageService
    );
    repositoryDirectoryTreeComponent.ngOnInit();

    expect(repositoryDirectoryTreeComponent.directoriesTreeNode).toStrictEqual(
      getTreeNodesWithoutFiles()
    );
  });

  it("should pre select the correct directory and expand needed directories", () => {
    dynamicDialogConfig = {
      data: getRepositoryDirectoryTreeInputWithPreSelect(),
    };
    repositoryDirectoryTreeComponent = new RepositoryDirectoryTreeComponent(
      dynamicDialogRef,
      dynamicDialogConfig,
      toastMessageService
    );
    repositoryDirectoryTreeComponent.ngOnInit();

    expect(repositoryDirectoryTreeComponent.directoriesTreeNode).toStrictEqual(
      getTreeNodesExpanded()
    );
    expect(repositoryDirectoryTreeComponent.selectedDirectory).toEqual(
      getSelectedRepository()
    );
  });

  it("should not expand a directory if the pre selected name starts with its name", () => {
    dynamicDialogConfig = {
      data: getRepositoryDirectoryTreeInputWithPreSelectAndSimilarNames(),
    };
    repositoryDirectoryTreeComponent = new RepositoryDirectoryTreeComponent(
      dynamicDialogRef,
      dynamicDialogConfig,
      toastMessageService
    );
    repositoryDirectoryTreeComponent.ngOnInit();

    expect(repositoryDirectoryTreeComponent.directoriesTreeNode).toStrictEqual(
      getTreeNodesWithSimilarNames()
    );
    expect(repositoryDirectoryTreeComponent.selectedDirectory).toEqual(
      getAnotherSelectedRepository()
    );
  });

  it("should close the reference with correct selected item on select", () => {
    repositoryDirectoryTreeComponent.selectedDirectory = {
      data: "directory",
    };
    repositoryDirectoryTreeComponent.select();

    expect(dynamicDialogRef.close).toHaveBeenCalledWith("directory");
  });

  it("should destroy the reference on close", () => {
    repositoryDirectoryTreeComponent.close();

    expect(dynamicDialogRef.destroy).toHaveBeenCalled();
  });
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
