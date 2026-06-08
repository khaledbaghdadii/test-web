import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { of, Subject, throwError } from "rxjs";
import { ConfirmationService, TreeNode } from "primeng/api";
import { FileNodeData } from "@mxflow/ui/file-tree";
import { ToastMessageService } from "@mxflow/ui/alert";

import { FileManagementSourceTreeViewComponent } from "./file-management-source-tree-view.component";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import { GitFileStatusCode } from "../remote-cloned-repository/model";
import { FileManagementSourceTreeViewStateService } from "./state-service/file-management-source-tree-view-state.service";

describe("FileManagementSourceTreeViewComponent", () => {
  let component: FileManagementSourceTreeViewComponent;
  let fixture: ComponentFixture<FileManagementSourceTreeViewComponent>;

  const PROJECT_ID = "project-1";
  const REPOSITORY_ID = "repo-1";
  const TREE_DEPTH_MIN = 1;
  const TREE_DEPTH_MAX = 2;

  const SRC_DIRECTORY_ENTRY = {
    path: "src",
    pathCode: GitFileStatusCode.UNKNOWN,
    pathSize: 0,
    directory: true,
  };

  const TESTS_DIRECTORY_ENTRY = {
    path: "tests",
    pathCode: GitFileStatusCode.UNKNOWN,
    pathSize: 0,
    directory: true,
  };

  const MAIN_FILE_ENTRY = {
    path: "src/main.ts",
    pathCode: GitFileStatusCode.WORKTREE_MODIFIED,
    pathSize: 42,
    directory: false,
  };

  const SRC_DIR_NODE = {
    data: { filePath: "src", isDirectory: true },
  } as TreeNode<FileNodeData>;

  const remoteServiceMock = {
    getRemoteRepositorySourceTree: jest.fn(),
  };

  const toastServiceMock = {
    clearErrors: jest.fn(),
    showError: jest.fn(),
    showSuccess: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileManagementSourceTreeViewComponent],
    })
      .overrideComponent(FileManagementSourceTreeViewComponent, {
        set: {
          providers: [
            {
              provide: RemoteClonedRepositoryService,
              useValue: remoteServiceMock,
            },
            { provide: ToastMessageService, useValue: toastServiceMock },
            FileManagementSourceTreeViewStateService,
            ConfirmationService,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FileManagementSourceTreeViewComponent);
    component = fixture.componentInstance;
    jest.clearAllMocks();
  });

  it("should load root source tree when inputs are provided", () => {
    remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
      of([SRC_DIRECTORY_ENTRY])
    );

    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("remoteRepositoryId", REPOSITORY_ID);
    fixture.detectChanges();

    expect(
      remoteServiceMock.getRemoteRepositorySourceTree
    ).toHaveBeenCalledWith(
      PROJECT_ID,
      REPOSITORY_ID,
      undefined,
      TREE_DEPTH_MIN,
      TREE_DEPTH_MAX
    );
    expect(component.files()).toHaveLength(1);
    expect(component.files()[0].filePath).toBe("src");
    expect(component.files()[0].isDirectory).toBe(true);
  });

  it("should fetch and merge subdirectory entries when a directory is selected", () => {
    remoteServiceMock.getRemoteRepositorySourceTree
      .mockReturnValueOnce(of([SRC_DIRECTORY_ENTRY]))
      .mockReturnValueOnce(of([MAIN_FILE_ENTRY]));

    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("remoteRepositoryId", REPOSITORY_ID);
    fixture.detectChanges();

    component.onDirectoryNodeSelected(SRC_DIR_NODE);

    expect(
      remoteServiceMock.getRemoteRepositorySourceTree
    ).toHaveBeenNthCalledWith(
      2,
      PROJECT_ID,
      REPOSITORY_ID,
      "src",
      TREE_DEPTH_MIN,
      TREE_DEPTH_MAX
    );
    expect(component.files().map((f) => f.filePath)).toEqual([
      "src",
      "src/main.ts",
    ]);
  });

  it("should fetch subdirectory entries when a directory is expanded", () => {
    remoteServiceMock.getRemoteRepositorySourceTree
      .mockReturnValueOnce(of([SRC_DIRECTORY_ENTRY]))
      .mockReturnValueOnce(
        of([
          {
            path: "src/utils.ts",
            pathCode: GitFileStatusCode.WORKTREE_MODIFIED,
            pathSize: 12,
            directory: false,
          },
        ])
      );

    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("remoteRepositoryId", REPOSITORY_ID);
    fixture.detectChanges();

    component.onDirectoryNodeExpanded(SRC_DIR_NODE);

    expect(
      remoteServiceMock.getRemoteRepositorySourceTree
    ).toHaveBeenNthCalledWith(
      2,
      PROJECT_ID,
      REPOSITORY_ID,
      "src",
      TREE_DEPTH_MIN,
      TREE_DEPTH_MAX
    );
    expect(component.files().map((f) => f.filePath)).toEqual([
      "src",
      "src/utils.ts",
    ]);
  });

  it("should show tree loading only while root entries are loading", () => {
    const rootEntries$ = new Subject<(typeof SRC_DIRECTORY_ENTRY)[]>();
    remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
      rootEntries$
    );

    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("remoteRepositoryId", REPOSITORY_ID);
    fixture.detectChanges();

    expect(component.treeLoading()).toBe(true);

    rootEntries$.next([SRC_DIRECTORY_ENTRY]);
    rootEntries$.complete();

    expect(component.treeLoading()).toBe(false);
  });

  it("should mark directory as loading during subdirectory fetch", () => {
    const subEntries$ = new Subject<(typeof MAIN_FILE_ENTRY)[]>();
    remoteServiceMock.getRemoteRepositorySourceTree
      .mockReturnValueOnce(of([SRC_DIRECTORY_ENTRY]))
      .mockReturnValueOnce(subEntries$);

    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("remoteRepositoryId", REPOSITORY_ID);
    fixture.detectChanges();

    component.onDirectoryNodeSelected(SRC_DIR_NODE);

    expect(component.files().find((f) => f.filePath === "src")?.isLoading).toBe(
      true
    );
    expect(component.treeLoading()).toBe(false);

    subEntries$.next([MAIN_FILE_ENTRY]);
    subEntries$.complete();

    expect(component.files().find((f) => f.filePath === "src")?.isLoading).toBe(
      false
    );
  });

  it("should skip directory fetch when children are already discovered", () => {
    remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
      of([
        SRC_DIRECTORY_ENTRY,
        {
          path: "src/dir1",
          pathCode: GitFileStatusCode.UNKNOWN,
          pathSize: 0,
          directory: true,
        },
      ])
    );

    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("remoteRepositoryId", REPOSITORY_ID);
    fixture.detectChanges();

    component.onDirectoryNodeExpanded(SRC_DIR_NODE);

    expect(
      remoteServiceMock.getRemoteRepositorySourceTree
    ).toHaveBeenCalledTimes(1);
  });

  it("should emit file selection with path and status code", () => {
    const emitSpy = jest.fn();
    component.fileSelected.subscribe(emitSpy);

    component.onFileNodeSelected({
      data: {
        filePath: "src/app/main.ts",
        metadata: { pathCode: GitFileStatusCode.WORKTREE_MODIFIED },
      },
    } as TreeNode<FileNodeData>);

    expect(emitSpy).toHaveBeenCalledWith({
      filePath: "src/app/main.ts",
      gitFileStatusCode: GitFileStatusCode.WORKTREE_MODIFIED,
    });
  });

  it("should strip the repo name prefix from file path before emitting file selection", () => {
    const emitSpy = jest.fn();
    component.fileSelected.subscribe(emitSpy);

    component.onFileNodeSelected({
      data: {
        filePath: "repository/src/app/main.ts",
        metadata: { pathCode: GitFileStatusCode.WORKTREE_MODIFIED },
      },
    } as TreeNode<FileNodeData>);

    expect(emitSpy).toHaveBeenCalledWith({
      filePath: "src/app/main.ts",
      gitFileStatusCode: GitFileStatusCode.WORKTREE_MODIFIED,
    });
  });

  it("should not emit file selection when node has no path code", () => {
    const emitSpy = jest.fn();
    component.fileSelected.subscribe(emitSpy);

    component.onFileNodeSelected({
      data: { filePath: "src/file.ts", metadata: {} },
    } as TreeNode<FileNodeData>);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it("should not emit file selection when node is a directory", () => {
    const emitSpy = jest.fn();
    component.fileSelected.subscribe(emitSpy);

    component.onFileNodeSelected({
      data: { filePath: "src", isDirectory: true },
    } as TreeNode<FileNodeData>);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it("should block file open when size exceeds 1 MB", () => {
    const result = component.openPredicate({
      data: {
        filePath: "src/app/main.ts",
        isDirectory: false,
        sizeInBytes: 2_000_000,
      },
    } as TreeNode<FileNodeData>);

    expect(result.allowed).toBe(false);
    expect(result.warningMessage).toContain("greater than 1 MB");
  });

  it("should allow file open when node has no data", () => {
    const result = component.openPredicate({} as TreeNode<FileNodeData>);

    expect(result).toEqual({ allowed: true });
  });

  it("should allow file open when node is a directory", () => {
    const result = component.openPredicate({
      data: { filePath: "src", isDirectory: true },
    } as TreeNode<FileNodeData>);

    expect(result).toEqual({ allowed: true });
  });

  it.each([
    ["workspaceFileByteSize", { workspaceFileByteSize: 1_048_577 }],
    ["baseFileByteSize", { baseFileByteSize: 1_048_577 }],
    ["localFileByteSize", { localFileByteSize: 1_048_577 }],
    ["remoteFileByteSize", { remoteFileByteSize: 1_048_577 }],
    ["pathSize", { pathSize: 1_048_577 }],
    ["sizeInBytes", { sizeInBytes: 1_048_577 }],
  ] as const)(
    "should block file open when %s exceeds 1 MB",
    (fieldName, metadata) => {
      const result = component.openPredicate({
        data: {
          filePath: "src/app/main.ts",
          isDirectory: false,
          sizeInBytes: 42,
          metadata,
        },
      } as TreeNode<FileNodeData>);

      expect(result.allowed).toBe(false);
      expect(result.warningMessage).toContain(fieldName);
    }
  );

  it("should use fallback file size when metadata fields are all within limit", () => {
    const result = component.openPredicate({
      data: {
        filePath: "src/app/main.ts",
        isDirectory: false,
        sizeInBytes: 2_000_000,
        metadata: {
          workspaceFileByteSize: 120,
          baseFileByteSize: 100,
          localFileByteSize: 110,
          remoteFileByteSize: 115,
        },
      },
    } as TreeNode<FileNodeData>);

    expect(result.allowed).toBe(false);
    expect(result.warningMessage).toContain("file size");
  });

  it("should block file open for blocked extensions", () => {
    const result = component.openPredicate({
      data: { filePath: "archive.tar.gz", isDirectory: false },
    } as TreeNode<FileNodeData>);

    expect(result.allowed).toBe(false);
    expect(result.warningMessage).toContain(".tar.gz");
  });

  it("should show toast when file open is blocked", () => {
    component.onTreeFileOpenBlocked({
      result: { warningMessage: "Too large" },
    });

    expect(toastServiceMock.clearErrors).toHaveBeenCalledTimes(1);
    expect(toastServiceMock.showError).toHaveBeenCalledWith(
      "Too large",
      "File Open Blocked"
    );
    expect(
      toastServiceMock.clearErrors.mock.invocationCallOrder[0]
    ).toBeLessThan(toastServiceMock.showError.mock.invocationCallOrder[0]);
  });

  it("should show default toast message when warning message is absent", () => {
    component.onTreeFileOpenBlocked({ result: {} });

    expect(toastServiceMock.showError).toHaveBeenCalledWith(
      "The selected file cannot be opened.",
      "File Open Blocked"
    );
  });

  it("should delegate to state service when reload is called", () => {
    const stateService = (
      component as unknown as {
        stateService: FileManagementSourceTreeViewStateService;
      }
    ).stateService;
    const reloadSpy = jest
      .spyOn(stateService, "reload")
      .mockImplementation(() => undefined);

    component.reload();

    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it("should preserve and restore expansion state during reload", () => {
    const rootEntries$ = new Subject<(typeof SRC_DIRECTORY_ENTRY)[]>();
    remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
      rootEntries$
    );

    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("remoteRepositoryId", REPOSITORY_ID);
    fixture.detectChanges();

    rootEntries$.next([SRC_DIRECTORY_ENTRY, TESTS_DIRECTORY_ENTRY]);

    const gitFileTree = component["gitFileTree"]();
    gitFileTree.setExpandedKeys({ src: true, tests: true });
    expect(gitFileTree.getExpandedKeys()).toEqual({ src: true, tests: true });

    const reloadEntries$ = new Subject<(typeof SRC_DIRECTORY_ENTRY)[]>();
    remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
      reloadEntries$
    );

    component.reload();
    fixture.detectChanges();

    reloadEntries$.next([SRC_DIRECTORY_ENTRY, TESTS_DIRECTORY_ENTRY]);
    reloadEntries$.complete();
    fixture.detectChanges();

    expect(gitFileTree.getExpandedKeys()).toEqual({ src: true, tests: true });
  });

  it("should clear reload signals after expansion restoration completes", () => {
    const rootEntries$ = new Subject<(typeof SRC_DIRECTORY_ENTRY)[]>();
    remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
      rootEntries$
    );

    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("remoteRepositoryId", REPOSITORY_ID);
    fixture.detectChanges();

    rootEntries$.next([SRC_DIRECTORY_ENTRY]);

    const gitFileTree = component["gitFileTree"]();
    gitFileTree.setExpandedKeys({ src: true });

    const reloadEntries$ = new Subject<(typeof SRC_DIRECTORY_ENTRY)[]>();
    remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
      reloadEntries$
    );

    component.reload();
    fixture.detectChanges();

    reloadEntries$.next([SRC_DIRECTORY_ENTRY]);
    reloadEntries$.complete();
    fixture.detectChanges();

    const isReloading = (
      component as unknown as {
        isReloading: ReturnType<typeof signal<boolean>>;
      }
    ).isReloading;
    const expandedKeysBeforeReload = (
      component as unknown as {
        expandedKeysBeforeReload: ReturnType<
          typeof signal<Record<string, boolean> | null>
        >;
      }
    ).expandedKeysBeforeReload;

    expect(isReloading()).toBe(false);
    expect(expandedKeysBeforeReload()).toBeNull();
  });

  it("should preserve and restore selected file after reload", () => {
    remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
      of([SRC_DIRECTORY_ENTRY, MAIN_FILE_ENTRY])
    );

    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("remoteRepositoryId", REPOSITORY_ID);
    fixture.detectChanges();

    const gitFileTree = component["gitFileTree"]();
    gitFileTree.setSelectedKey("repository/src/main.ts");
    expect(gitFileTree.getSelectedKey()).toBe("repository/src/main.ts");

    remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
      of([SRC_DIRECTORY_ENTRY, MAIN_FILE_ENTRY])
    );

    component.reload();
    fixture.detectChanges();

    expect(gitFileTree.getSelectedKey()).toBe("repository/src/main.ts");
  });

  it("should restore selected file inside subdirectory after reload", () => {
    remoteServiceMock.getRemoteRepositorySourceTree
      .mockReturnValueOnce(of([SRC_DIRECTORY_ENTRY]))
      .mockReturnValueOnce(of([MAIN_FILE_ENTRY]));

    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("remoteRepositoryId", REPOSITORY_ID);
    fixture.detectChanges();

    component.onDirectoryNodeExpanded(SRC_DIR_NODE);
    fixture.detectChanges();

    const gitFileTree = component["gitFileTree"]();
    gitFileTree.setExpandedKeys({ src: true });
    gitFileTree.setSelectedKey("repository/src/main.ts");
    expect(gitFileTree.getSelectedKey()).toBe("repository/src/main.ts");

    const reloadRoot$ = new Subject<(typeof SRC_DIRECTORY_ENTRY)[]>();
    const reloadSub$ = new Subject<(typeof MAIN_FILE_ENTRY)[]>();
    remoteServiceMock.getRemoteRepositorySourceTree
      .mockReturnValueOnce(reloadRoot$)
      .mockReturnValueOnce(reloadSub$);

    component.reload();
    fixture.detectChanges();

    reloadRoot$.next([SRC_DIRECTORY_ENTRY]);
    reloadRoot$.complete();
    fixture.detectChanges();

    reloadSub$.next([MAIN_FILE_ENTRY]);
    reloadSub$.complete();
    fixture.detectChanges();

    expect(gitFileTree.getSelectedKey()).toBe("repository/src/main.ts");
  });

  describe("repoName", () => {
    it("should return 'repository' as default when repositoryBasePath is not set", () => {
      fixture.detectChanges();
      expect(component.repoName()).toBe("repository");
    });

    it("should return the last segment of repositoryBasePath", () => {
      fixture.componentRef.setInput("repositoryBasePath", "/data/repos/myrepo");
      fixture.detectChanges();
      expect(component.repoName()).toBe("myrepo");
    });
  });

  describe("displayFiles", () => {
    it("should prefix each file path with the repo name", () => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
        of([SRC_DIRECTORY_ENTRY])
      );
      fixture.componentRef.setInput("projectId", PROJECT_ID);
      fixture.componentRef.setInput("remoteRepositoryId", REPOSITORY_ID);
      fixture.detectChanges();

      expect(component.displayFiles()).toHaveLength(1);
      expect(component.displayFiles()[0].filePath).toBe("repository/src");
    });

    it("should use custom repoName when repositoryBasePath is set", () => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
        of([SRC_DIRECTORY_ENTRY])
      );
      fixture.componentRef.setInput("repositoryBasePath", "/repos/myapp");
      fixture.componentRef.setInput("projectId", PROJECT_ID);
      fixture.componentRef.setInput("remoteRepositoryId", REPOSITORY_ID);
      fixture.detectChanges();

      expect(component.displayFiles()[0].filePath).toBe("myapp/src");
    });
  });

  describe("openAddDialog and closeAddDialog", () => {
    it("should set showAddDialog to true when openAddDialog is called", () => {
      component.openAddDialog();
      expect(component.showAddDialog()).toBe(true);
    });

    it("should set showAddDialog to false when closeAddDialog is called", () => {
      component.openAddDialog();
      component.closeAddDialog();
      expect(component.showAddDialog()).toBe(false);
    });
  });

  describe("onDirectoryNodeSelected root node guard", () => {
    it("should set selectedDirectory to null and skip child loading when root node is selected", () => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
        of([SRC_DIRECTORY_ENTRY])
      );
      fixture.componentRef.setInput("projectId", PROJECT_ID);
      fixture.componentRef.setInput("remoteRepositoryId", REPOSITORY_ID);
      fixture.detectChanges();

      const rootNode = {
        data: { filePath: "repository", isDirectory: true },
      } as TreeNode<FileNodeData>;
      component.onDirectoryNodeSelected(rootNode);

      expect(component.selectedDirectory).toBeNull();
      expect(
        remoteServiceMock.getRemoteRepositorySourceTree
      ).toHaveBeenCalledTimes(1);
    });

    it("should store the stripped node as selectedDirectory for non-root nodes", () => {
      remoteServiceMock.getRemoteRepositorySourceTree
        .mockReturnValueOnce(of([SRC_DIRECTORY_ENTRY]))
        .mockReturnValueOnce(of([]));
      fixture.componentRef.setInput("projectId", PROJECT_ID);
      fixture.componentRef.setInput("remoteRepositoryId", REPOSITORY_ID);
      fixture.detectChanges();

      component.onDirectoryNodeSelected(SRC_DIR_NODE);

      expect(component.selectedDirectory?.data?.filePath).toBe("src");
    });
  });

  describe("onDirectoryNodeExpanded root node guard", () => {
    it("should not load children when root node is expanded", () => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
        of([SRC_DIRECTORY_ENTRY])
      );
      fixture.componentRef.setInput("projectId", PROJECT_ID);
      fixture.componentRef.setInput("remoteRepositoryId", REPOSITORY_ID);
      fixture.detectChanges();

      const rootNode = {
        data: { filePath: "repository", isDirectory: true },
      } as TreeNode<FileNodeData>;
      component.onDirectoryNodeExpanded(rootNode);

      expect(
        remoteServiceMock.getRemoteRepositorySourceTree
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("onDeleteButtonClicked", () => {
    let stateService: FileManagementSourceTreeViewStateService;
    let confirmationService: ConfirmationService;
    let capturedAccept: (() => void) | undefined;

    beforeEach(() => {
      stateService = fixture.debugElement.injector.get(
        FileManagementSourceTreeViewStateService
      );
      confirmationService =
        fixture.debugElement.injector.get(ConfirmationService);
      capturedAccept = undefined;
      jest
        .spyOn(confirmationService, "confirm")
        .mockImplementation((config) => {
          capturedAccept = config.accept as (() => void) | undefined;
        });
    });

    it("should open a confirmation dialog containing the directory name", () => {
      const dirNode = {
        data: { filePath: "src", isDirectory: true },
      } as TreeNode<FileNodeData>;
      component.selectedNode = dirNode;
      component.onDeleteButtonClicked();

      expect(confirmationService.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          header: "Delete Directory",
          message: expect.stringContaining("src"),
        })
      );
    });

    it("should delete the directory and emit sourceTreeRefreshRequested on confirm", () => {
      jest
        .spyOn(stateService, "deleteDirectory")
        .mockReturnValue(of(undefined));
      jest.spyOn(stateService, "evictDirectory").mockImplementation(() => {});
      const refreshSpy = jest.fn();
      const entryDeletedSpy = jest.fn();
      component.sourceTreeRefreshRequested.subscribe(refreshSpy);
      component.entryDeleted.subscribe(entryDeletedSpy);

      const dirNode = {
        data: { filePath: "src", isDirectory: true },
      } as TreeNode<FileNodeData>;
      component.selectedDirectory = dirNode;
      component.selectedNode = dirNode;
      component.onDeleteButtonClicked();
      capturedAccept?.();

      expect(stateService.deleteDirectory).toHaveBeenCalledWith("src");
      expect(stateService.evictDirectory).toHaveBeenCalledWith("src");
      expect(toastServiceMock.showSuccess).toHaveBeenCalledWith(
        "Directory deleted successfully.",
        "Success"
      );
      expect(entryDeletedSpy).toHaveBeenCalledWith({
        path: "src",
        type: "directory",
      });
      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(component.selectedDirectory).toBeNull();
      expect(component.selectedNode).toBeNull();
    });

    it("should delete the selected file and emit sourceTreeRefreshRequested on confirm", () => {
      jest.spyOn(stateService, "deleteFile").mockReturnValue(of(undefined));
      const refreshSpy = jest.fn();
      const entryDeletedSpy = jest.fn();
      component.sourceTreeRefreshRequested.subscribe(refreshSpy);
      component.entryDeleted.subscribe(entryDeletedSpy);

      const fileNode = {
        data: { filePath: "src/main.ts", isDirectory: false },
      } as TreeNode<FileNodeData>;
      component.selectedNode = fileNode;

      component.onDeleteButtonClicked();

      expect(confirmationService.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          header: "Delete File",
          message: expect.stringContaining("src/main.ts"),
        })
      );

      capturedAccept?.();

      expect(stateService.deleteFile).toHaveBeenCalledWith("src/main.ts");
      expect(toastServiceMock.showSuccess).toHaveBeenCalledWith(
        "File deleted successfully.",
        "Success"
      );
      expect(entryDeletedSpy).toHaveBeenCalledWith({
        path: "src/main.ts",
        type: "file",
      });
      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(component.selectedNode).toBeNull();
    });

    it("should show toast on delete error", () => {
      jest
        .spyOn(stateService, "deleteDirectory")
        .mockReturnValue(throwError(() => new Error("delete failed")));
      const dirNode = {
        data: { filePath: "src", isDirectory: true },
      } as TreeNode<FileNodeData>;
      component.selectedNode = dirNode;
      component.onDeleteButtonClicked();
      capturedAccept?.();

      expect(toastServiceMock.showError).toHaveBeenCalledWith(
        "delete failed",
        "Delete Failed"
      );
    });
  });

  describe("onAddRequested", () => {
    let stateService: FileManagementSourceTreeViewStateService;

    beforeEach(() => {
      stateService = fixture.debugElement.injector.get(
        FileManagementSourceTreeViewStateService
      );
    });

    it("should call stateService.addFile and emit both outputs when adding a file", () => {
      jest.spyOn(stateService, "addFile").mockReturnValue(of("src/newfile.ts"));
      const refreshSpy = jest.fn();
      const fileCreatedSpy = jest.fn();
      component.sourceTreeRefreshRequested.subscribe(refreshSpy);
      component.fileCreationRequested.subscribe(fileCreatedSpy);

      component.selectedDirectory = SRC_DIR_NODE;
      component.onAddRequested({ type: "file", name: "newfile.ts" });

      expect(stateService.addFile).toHaveBeenCalledWith(
        SRC_DIR_NODE,
        "newfile.ts"
      );
      expect(toastServiceMock.showSuccess).toHaveBeenCalledWith(
        "File created successfully.",
        "Success"
      );
      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(fileCreatedSpy).toHaveBeenCalledWith({
        filePath: "src/newfile.ts",
        content: "",
      });
      expect(component.showAddDialog()).toBe(false);
    });

    it("should call stateService.addDirectory and emit sourceTreeRefreshRequested when adding a directory", () => {
      jest.spyOn(stateService, "addDirectory").mockReturnValue(of(undefined));
      const refreshSpy = jest.fn();
      component.sourceTreeRefreshRequested.subscribe(refreshSpy);

      component.selectedDirectory = SRC_DIR_NODE;
      component.onAddRequested({ type: "directory", name: "newdir" });

      expect(stateService.addDirectory).toHaveBeenCalledWith(
        SRC_DIR_NODE,
        "newdir"
      );
      expect(toastServiceMock.showSuccess).toHaveBeenCalledWith(
        "Directory created successfully.",
        "Success"
      );
      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(component.showAddDialog()).toBe(false);
    });

    it("should show toast error when a sibling with the same name already exists", () => {
      const nodeWithChildren = {
        data: { filePath: "src", isDirectory: true },
        children: [{ label: "existing.ts" }],
      } as TreeNode<FileNodeData>;
      component.selectedDirectory = nodeWithChildren;

      component.onAddRequested({ type: "file", name: "existing.ts" });

      expect(toastServiceMock.showError).toHaveBeenCalledWith(
        "file/directory already exists under this path",
        "Error"
      );
    });

    it("should show toast on addFile error", () => {
      jest
        .spyOn(stateService, "addFile")
        .mockReturnValue(throwError(() => new Error("write failed")));
      component.selectedDirectory = SRC_DIR_NODE;

      component.onAddRequested({ type: "file", name: "newfile.ts" });

      expect(toastServiceMock.showError).toHaveBeenCalledWith(
        "write failed",
        "Create Failed"
      );
    });

    it("should show toast on addDirectory error", () => {
      jest
        .spyOn(stateService, "addDirectory")
        .mockReturnValue(throwError(() => new Error("mkdir failed")));
      component.selectedDirectory = SRC_DIR_NODE;

      component.onAddRequested({ type: "directory", name: "newdir" });

      expect(toastServiceMock.showError).toHaveBeenCalledWith(
        "mkdir failed",
        "Create Failed"
      );
    });
  });
});
