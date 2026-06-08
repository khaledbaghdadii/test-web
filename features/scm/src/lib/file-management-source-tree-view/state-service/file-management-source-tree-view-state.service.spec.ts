import { TestBed } from "@angular/core/testing";
import { firstValueFrom, of, Subject, throwError } from "rxjs";
import { TreeNode } from "primeng/api";
import { FileNodeData, GitFileStatus } from "@mxflow/ui/file-tree";
import { ToastMessageService } from "@mxflow/ui/alert";

import { FileManagementSourceTreeViewStateService } from "./file-management-source-tree-view-state.service";
import { RemoteClonedRepositoryService } from "../../remote-cloned-repository/remote-cloned-repository.service";
import { GitFileStatusCode } from "../../remote-cloned-repository/model";

describe("FileManagementSourceTreeViewStateService", () => {
  let service: FileManagementSourceTreeViewStateService;

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
    writeRemoteFileContent: jest.fn(),
    createRemoteDirectory: jest.fn(),
    deleteRemoteDirectory: jest.fn(),
    deleteRemoteFile: jest.fn(),
    stageFileChanges: jest.fn(),
  };

  const toastServiceMock = {
    showError: jest.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FileManagementSourceTreeViewStateService,
        {
          provide: RemoteClonedRepositoryService,
          useValue: remoteServiceMock,
        },
        {
          provide: ToastMessageService,
          useValue: toastServiceMock,
        },
      ],
    });

    service = TestBed.inject(FileManagementSourceTreeViewStateService);
    jest.clearAllMocks();
  });

  it("should load root source tree when context is set", () => {
    remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
      of([SRC_DIRECTORY_ENTRY])
    );

    service.setContext(PROJECT_ID, REPOSITORY_ID);
    TestBed.tick();

    expect(
      remoteServiceMock.getRemoteRepositorySourceTree
    ).toHaveBeenCalledWith(
      PROJECT_ID,
      REPOSITORY_ID,
      undefined,
      TREE_DEPTH_MIN,
      TREE_DEPTH_MAX
    );
    expect(service.files()).toHaveLength(1);
    expect(service.files()[0]).toMatchObject({
      filePath: "src",
      isDirectory: true,
      gitStatus: GitFileStatus.Unknown,
    });
  });

  it("should merge subdirectory children when directory is expanded", () => {
    remoteServiceMock.getRemoteRepositorySourceTree
      .mockReturnValueOnce(of([SRC_DIRECTORY_ENTRY]))
      .mockReturnValueOnce(of([MAIN_FILE_ENTRY]));

    service.setContext(PROJECT_ID, REPOSITORY_ID);
    TestBed.tick();

    service.loadDirectoryChildren(SRC_DIR_NODE);

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
    expect(service.files().map((f) => f.filePath)).toEqual([
      "src",
      "src/main.ts",
    ]);
  });

  it("should skip fetch when directory children are already discovered", () => {
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

    service.setContext(PROJECT_ID, REPOSITORY_ID);
    TestBed.tick();

    service.loadDirectoryChildren(SRC_DIR_NODE);

    expect(
      remoteServiceMock.getRemoteRepositorySourceTree
    ).toHaveBeenCalledTimes(1);
  });

  it("should track pre-loaded directory in expanded set so reload re-fetches its children", () => {
    const SRC_DIR1_ENTRY = {
      path: "src/dir1",
      pathCode: GitFileStatusCode.UNKNOWN,
      pathSize: 0,
      directory: true,
    };
    const SRC_DIR1_FILE_ENTRY = {
      path: "src/dir1/file.ts",
      pathCode: GitFileStatusCode.WORKTREE_MODIFIED,
      pathSize: 10,
      directory: false,
    };

    remoteServiceMock.getRemoteRepositorySourceTree
      .mockReturnValueOnce(of([SRC_DIRECTORY_ENTRY, SRC_DIR1_ENTRY]))
      .mockReturnValueOnce(of([SRC_DIRECTORY_ENTRY, SRC_DIR1_ENTRY]))
      .mockReturnValueOnce(of([SRC_DIR1_FILE_ENTRY]));

    service.setContext(PROJECT_ID, REPOSITORY_ID);
    TestBed.tick();

    // Children of src are pre-loaded from root, so no extra fetch
    service.loadDirectoryChildren(SRC_DIR_NODE);
    expect(
      remoteServiceMock.getRemoteRepositorySourceTree
    ).toHaveBeenCalledTimes(1);

    // After reload, src is in expandedDirectories and its children are re-fetched
    service.reload();
    expect(
      remoteServiceMock.getRemoteRepositorySourceTree
    ).toHaveBeenCalledTimes(3);
    expect(service.files().map((f) => f.filePath)).toContain(
      "src/dir1/file.ts"
    );
  });

  it("should skip fetch when directory was already requested", () => {
    remoteServiceMock.getRemoteRepositorySourceTree
      .mockReturnValueOnce(of([SRC_DIRECTORY_ENTRY]))
      .mockReturnValueOnce(of([]));

    service.setContext(PROJECT_ID, REPOSITORY_ID);
    TestBed.tick();

    service.loadDirectoryChildren(SRC_DIR_NODE);
    service.loadDirectoryChildren(SRC_DIR_NODE);

    expect(
      remoteServiceMock.getRemoteRepositorySourceTree
    ).toHaveBeenCalledTimes(2);
  });

  it("should show treeLoading only during initial root load", () => {
    const rootEntries$ = new Subject<(typeof SRC_DIRECTORY_ENTRY)[]>();
    remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
      rootEntries$
    );

    service.setContext(PROJECT_ID, REPOSITORY_ID);
    TestBed.tick();

    expect(service.treeLoading()).toBe(true);

    rootEntries$.next([SRC_DIRECTORY_ENTRY]);
    rootEntries$.complete();

    expect(service.treeLoading()).toBe(false);
  });

  it("should mark directory as loading during subdirectory fetch", () => {
    const subEntries$ = new Subject<(typeof MAIN_FILE_ENTRY)[]>();
    remoteServiceMock.getRemoteRepositorySourceTree
      .mockReturnValueOnce(of([SRC_DIRECTORY_ENTRY]))
      .mockReturnValueOnce(subEntries$);

    service.setContext(PROJECT_ID, REPOSITORY_ID);
    TestBed.tick();

    service.loadDirectoryChildren(SRC_DIR_NODE);

    expect(service.files().find((f) => f.filePath === "src")?.isLoading).toBe(
      true
    );
    expect(service.treeLoading()).toBe(false);

    subEntries$.next([MAIN_FILE_ENTRY]);
    subEntries$.complete();

    expect(service.files().find((f) => f.filePath === "src")?.isLoading).toBe(
      false
    );
  });

  it("should show error toast when source tree fetch fails", () => {
    remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
      throwError(() => new Error("Network error"))
    );

    service.setContext(PROJECT_ID, REPOSITORY_ID);
    TestBed.tick();

    expect(toastServiceMock.showError).toHaveBeenCalledWith(
      "Failed to load source tree: Network error",
      "Load Failed"
    );
    expect(service.files()).toEqual([]);
    expect(service.loading()).toBe(false);
    expect(service.loadFailed()).toBe(true);
  });

  it("should reload root and restore previously expanded subdirectories", () => {
    remoteServiceMock.getRemoteRepositorySourceTree
      .mockReturnValueOnce(of([SRC_DIRECTORY_ENTRY]))
      .mockReturnValueOnce(of([MAIN_FILE_ENTRY]))
      .mockReturnValueOnce(of([SRC_DIRECTORY_ENTRY]))
      .mockReturnValueOnce(
        of([
          MAIN_FILE_ENTRY,
          {
            path: "src/new.ts",
            pathCode: GitFileStatusCode.UNKNOWN,
            pathSize: 10,
            directory: false,
          },
        ])
      );

    service.setContext(PROJECT_ID, REPOSITORY_ID);
    TestBed.tick();

    service.loadDirectoryChildren(SRC_DIR_NODE);

    expect(service.files().map((f) => f.filePath)).toContain("src/main.ts");

    service.reload();

    expect(service.files().map((f) => f.filePath)).toContain("src/main.ts");
    expect(service.files().map((f) => f.filePath)).toContain("src/new.ts");
    expect(
      remoteServiceMock.getRemoteRepositorySourceTree
    ).toHaveBeenCalledTimes(4);
  });

  it("should restore multiple expanded directories after reload", () => {
    remoteServiceMock.getRemoteRepositorySourceTree
      .mockReturnValueOnce(of([SRC_DIRECTORY_ENTRY, TESTS_DIRECTORY_ENTRY]))
      .mockReturnValueOnce(of([MAIN_FILE_ENTRY]))
      .mockReturnValueOnce(
        of([
          {
            path: "tests/unit.ts",
            pathCode: GitFileStatusCode.UNKNOWN,
            pathSize: 10,
            directory: false,
          },
        ])
      )
      .mockReturnValueOnce(of([SRC_DIRECTORY_ENTRY, TESTS_DIRECTORY_ENTRY]))
      .mockReturnValueOnce(of([MAIN_FILE_ENTRY]))
      .mockReturnValueOnce(
        of([
          {
            path: "tests/unit.ts",
            pathCode: GitFileStatusCode.UNKNOWN,
            pathSize: 10,
            directory: false,
          },
        ])
      );

    service.setContext(PROJECT_ID, REPOSITORY_ID);
    TestBed.tick();

    service.loadDirectoryChildren(SRC_DIR_NODE);
    service.loadDirectoryChildren({
      data: { filePath: "tests", isDirectory: true },
    } as TreeNode<FileNodeData>);

    service.reload();

    const filePaths = service.files().map((f) => f.filePath);
    expect(filePaths).toContain("src/main.ts");
    expect(filePaths).toContain("tests/unit.ts");
    expect(
      remoteServiceMock.getRemoteRepositorySourceTree
    ).toHaveBeenCalledTimes(6);
  });

  it("should not load when context is incomplete", () => {
    service.setContext("", REPOSITORY_ID);
    TestBed.tick();

    expect(
      remoteServiceMock.getRemoteRepositorySourceTree
    ).not.toHaveBeenCalled();
  });

  describe("allLoadsSettled signal", () => {
    it("should set allLoadsSettled to true after root load when no subdirectories are pending", () => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
        of([SRC_DIRECTORY_ENTRY])
      );

      service.setContext(PROJECT_ID, REPOSITORY_ID);
      TestBed.tick();

      expect(service.allLoadsSettled()).toBe(true);
    });

    it("should reset allLoadsSettled to false when reload is called", () => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
        of([SRC_DIRECTORY_ENTRY])
      );

      service.setContext(PROJECT_ID, REPOSITORY_ID);
      TestBed.tick();
      expect(service.allLoadsSettled()).toBe(true);

      const reloadEntries$ = new Subject<(typeof SRC_DIRECTORY_ENTRY)[]>();
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
        reloadEntries$
      );

      service.reload();

      expect(service.allLoadsSettled()).toBe(false);
    });

    it("should set allLoadsSettled to true only after all subdirectory loads finish", () => {
      const subEntries$ = new Subject<(typeof MAIN_FILE_ENTRY)[]>();
      remoteServiceMock.getRemoteRepositorySourceTree
        .mockReturnValueOnce(of([SRC_DIRECTORY_ENTRY]))
        .mockReturnValueOnce(of([MAIN_FILE_ENTRY]))
        .mockReturnValueOnce(of([SRC_DIRECTORY_ENTRY]))
        .mockReturnValueOnce(subEntries$);

      service.setContext(PROJECT_ID, REPOSITORY_ID);
      TestBed.tick();

      service.loadDirectoryChildren(SRC_DIR_NODE);

      service.reload();

      expect(service.allLoadsSettled()).toBe(false);

      subEntries$.next([MAIN_FILE_ENTRY]);
      subEntries$.complete();

      expect(service.allLoadsSettled()).toBe(true);
    });
  });

  describe("setContext with repositoryBasePath", () => {
    it("should prefix absolute paths with repositoryBasePath when set", async () => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(of([]));
      remoteServiceMock.writeRemoteFileContent.mockReturnValue(of(undefined));
      remoteServiceMock.stageFileChanges.mockReturnValue(of(undefined));

      service.setContext(PROJECT_ID, REPOSITORY_ID, "/repos/myapp");
      TestBed.tick();

      await firstValueFrom(service.addFile(SRC_DIR_NODE, "main.ts"));

      expect(remoteServiceMock.writeRemoteFileContent).toHaveBeenCalledWith(
        expect.objectContaining({ filePath: "/repos/myapp/src/main.ts" })
      );
      expect(remoteServiceMock.stageFileChanges).toHaveBeenCalledWith(
        expect.objectContaining({ filePaths: ["/repos/myapp/src/main.ts"] })
      );
    });

    it("should not prefix paths when repositoryBasePath is not set", async () => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(of([]));
      remoteServiceMock.writeRemoteFileContent.mockReturnValue(of(undefined));
      remoteServiceMock.stageFileChanges.mockReturnValue(of(undefined));

      service.setContext(PROJECT_ID, REPOSITORY_ID);
      TestBed.tick();

      await firstValueFrom(service.addFile(SRC_DIR_NODE, "main.ts"));

      expect(remoteServiceMock.writeRemoteFileContent).toHaveBeenCalledWith(
        expect.objectContaining({ filePath: "src/main.ts" })
      );
      expect(remoteServiceMock.stageFileChanges).toHaveBeenCalledWith(
        expect.objectContaining({ filePaths: ["src/main.ts"] })
      );
    });
  });

  describe("addFile", () => {
    beforeEach(() => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(of([]));
      remoteServiceMock.stageFileChanges.mockReturnValue(of(undefined));
      service.setContext(PROJECT_ID, REPOSITORY_ID);
      TestBed.tick();
    });

    it("should write file under parent directory, stage it, and return the relative path", async () => {
      remoteServiceMock.writeRemoteFileContent.mockReturnValue(of(undefined));

      const result = await firstValueFrom(
        service.addFile(SRC_DIR_NODE, "main.ts")
      );

      expect(result).toBe("src/main.ts");
      expect(remoteServiceMock.writeRemoteFileContent).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        filePath: "src/main.ts",
        fileContent: "",
        checkRepositoryAvailability: true,
      });
      expect(remoteServiceMock.stageFileChanges).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        filePaths: ["src/main.ts"],
        stageAll: false,
      });
    });

    it("should write file at root when parent node is null, stage it, and return the relative path", async () => {
      remoteServiceMock.writeRemoteFileContent.mockReturnValue(of(undefined));

      const result = await firstValueFrom(service.addFile(null, "readme.md"));

      expect(result).toBe("readme.md");
      expect(remoteServiceMock.writeRemoteFileContent).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        filePath: "readme.md",
        fileContent: "",
        checkRepositoryAvailability: true,
      });
      expect(remoteServiceMock.stageFileChanges).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        filePaths: ["readme.md"],
        stageAll: false,
      });
    });

    it("should propagate error when writeRemoteFileContent fails", async () => {
      remoteServiceMock.writeRemoteFileContent.mockReturnValue(
        throwError(() => new Error("write failed"))
      );

      await expect(
        firstValueFrom(service.addFile(SRC_DIR_NODE, "main.ts"))
      ).rejects.toMatchObject({ message: "write failed" });

      expect(remoteServiceMock.stageFileChanges).not.toHaveBeenCalled();
    });

    it("should propagate error when stageFileChanges fails", async () => {
      remoteServiceMock.writeRemoteFileContent.mockReturnValue(of(undefined));
      remoteServiceMock.stageFileChanges.mockReturnValue(
        throwError(() => new Error("stage failed"))
      );

      await expect(
        firstValueFrom(service.addFile(SRC_DIR_NODE, "main.ts"))
      ).rejects.toMatchObject({ message: "stage failed" });
    });
  });

  describe("addDirectory", () => {
    beforeEach(() => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(of([]));
      service.setContext(PROJECT_ID, REPOSITORY_ID);
      TestBed.tick();
    });

    it("should create directory under parent directory", async () => {
      remoteServiceMock.createRemoteDirectory.mockReturnValue(of(undefined));

      await firstValueFrom(service.addDirectory(SRC_DIR_NODE, "components"));

      expect(remoteServiceMock.createRemoteDirectory).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        directoryPath: "src/components",
        checkRepositoryAvailability: true,
      });
    });

    it("should create directory at root when parent node is null", async () => {
      remoteServiceMock.createRemoteDirectory.mockReturnValue(of(undefined));

      await firstValueFrom(service.addDirectory(null, "newdir"));

      expect(remoteServiceMock.createRemoteDirectory).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        directoryPath: "newdir",
        checkRepositoryAvailability: true,
      });
    });

    it("should propagate error when createRemoteDirectory fails", async () => {
      remoteServiceMock.createRemoteDirectory.mockReturnValue(
        throwError(() => new Error("mkdir failed"))
      );

      await expect(
        firstValueFrom(service.addDirectory(SRC_DIR_NODE, "components"))
      ).rejects.toMatchObject({ message: "mkdir failed" });
    });
  });

  describe("deleteDirectory", () => {
    beforeEach(() => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(of([]));
      remoteServiceMock.stageFileChanges.mockReturnValue(of(undefined));
    });

    it("should delete directory at the given path without staging when no files under it are changed", async () => {
      remoteServiceMock.deleteRemoteDirectory.mockReturnValue(of(undefined));
      service.setContext(PROJECT_ID, REPOSITORY_ID);
      TestBed.tick();

      await firstValueFrom(service.deleteDirectory("src/components"));

      expect(remoteServiceMock.deleteRemoteDirectory).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        directoryPath: "src/components",
        checkRepositoryAvailability: true,
      });
      expect(remoteServiceMock.stageFileChanges).not.toHaveBeenCalled();
    });

    it("should stage deleted directory when a file under it is changed", async () => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
        of([
          {
            path: "src/components",
            pathCode: GitFileStatusCode.UNKNOWN,
            pathSize: 0,
            directory: true,
          },
          {
            path: "src/components/main.ts",
            pathCode: GitFileStatusCode.WORKTREE_MODIFIED,
            pathSize: 10,
            directory: false,
          },
        ])
      );
      remoteServiceMock.deleteRemoteDirectory.mockReturnValue(of(undefined));
      service.setContext(PROJECT_ID, REPOSITORY_ID);
      TestBed.tick();

      await firstValueFrom(service.deleteDirectory("src/components"));

      expect(remoteServiceMock.stageFileChanges).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        filePaths: ["src/components"],
        stageAll: false,
      });
    });

    it("should prefix path with repositoryBasePath when set", async () => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
        of([
          {
            path: "src/components/main.ts",
            pathCode: GitFileStatusCode.WORKTREE_MODIFIED,
            pathSize: 10,
            directory: false,
          },
        ])
      );
      remoteServiceMock.deleteRemoteDirectory.mockReturnValue(of(undefined));
      service.setContext(PROJECT_ID, REPOSITORY_ID, "/repos/myapp");
      TestBed.tick();

      await firstValueFrom(service.deleteDirectory("src/components"));

      expect(remoteServiceMock.deleteRemoteDirectory).toHaveBeenCalledWith(
        expect.objectContaining({
          directoryPath: "/repos/myapp/src/components",
        })
      );
      expect(remoteServiceMock.stageFileChanges).toHaveBeenCalledWith(
        expect.objectContaining({
          filePaths: ["/repos/myapp/src/components"],
          stageAll: false,
        })
      );
    });

    it("should delete directory without staging when all files under it are newly added", async () => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
        of([
          {
            path: "src/components",
            pathCode: GitFileStatusCode.UNKNOWN,
            pathSize: 0,
            directory: true,
          },
          {
            path: "src/components/new-file.ts",
            pathCode: GitFileStatusCode.INDEX_ADDED,
            pathSize: 10,
            directory: false,
          },
        ])
      );
      remoteServiceMock.deleteRemoteDirectory.mockReturnValue(of(undefined));
      service.setContext(PROJECT_ID, REPOSITORY_ID);
      TestBed.tick();

      await firstValueFrom(service.deleteDirectory("src/components"));

      expect(remoteServiceMock.deleteRemoteDirectory).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        directoryPath: "src/components",
        checkRepositoryAvailability: true,
      });
      expect(remoteServiceMock.stageFileChanges).not.toHaveBeenCalled();
    });

    it("should propagate error when deleteRemoteDirectory fails", async () => {
      remoteServiceMock.deleteRemoteDirectory.mockReturnValue(
        throwError(() => new Error("delete failed"))
      );
      service.setContext(PROJECT_ID, REPOSITORY_ID);
      TestBed.tick();

      await expect(
        firstValueFrom(service.deleteDirectory("src/components"))
      ).rejects.toMatchObject({ message: "delete failed" });

      expect(remoteServiceMock.stageFileChanges).not.toHaveBeenCalled();
    });

    it("should propagate error when stageFileChanges fails", async () => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
        of([
          {
            path: "src/components/main.ts",
            pathCode: GitFileStatusCode.WORKTREE_MODIFIED,
            pathSize: 10,
            directory: false,
          },
        ])
      );
      remoteServiceMock.deleteRemoteDirectory.mockReturnValue(of(undefined));
      remoteServiceMock.stageFileChanges.mockReturnValue(
        throwError(() => new Error("stage failed"))
      );
      service.setContext(PROJECT_ID, REPOSITORY_ID);
      TestBed.tick();

      await expect(
        firstValueFrom(service.deleteDirectory("src/components"))
      ).rejects.toMatchObject({ message: "stage failed" });
    });
  });

  describe("deleteFile", () => {
    beforeEach(() => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(of([]));
      remoteServiceMock.stageFileChanges.mockReturnValue(of(undefined));
      service.setContext(PROJECT_ID, REPOSITORY_ID);
      TestBed.tick();
    });

    it("should delete file at the given path and stage deletion", async () => {
      remoteServiceMock.deleteRemoteFile.mockReturnValue(of(undefined));

      await firstValueFrom(service.deleteFile("src/main.ts"));

      expect(remoteServiceMock.deleteRemoteFile).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        filePath: "src/main.ts",
        checkRepositoryAvailability: true,
      });
      expect(remoteServiceMock.stageFileChanges).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        filePaths: ["src/main.ts"],
        stageAll: false,
      });
    });

    it("should prefix path with repositoryBasePath when set", async () => {
      remoteServiceMock.deleteRemoteFile.mockReturnValue(of(undefined));
      service.setContext(PROJECT_ID, REPOSITORY_ID, "/repos/myapp");
      TestBed.tick();

      await firstValueFrom(service.deleteFile("src/main.ts"));

      expect(remoteServiceMock.deleteRemoteFile).toHaveBeenCalledWith(
        expect.objectContaining({
          filePath: "/repos/myapp/src/main.ts",
        })
      );
      expect(remoteServiceMock.stageFileChanges).toHaveBeenCalledWith(
        expect.objectContaining({
          filePaths: ["/repos/myapp/src/main.ts"],
          stageAll: false,
        })
      );
    });

    it("should propagate error when deleteRemoteFile fails", async () => {
      remoteServiceMock.deleteRemoteFile.mockReturnValue(
        throwError(() => new Error("delete failed"))
      );

      await expect(
        firstValueFrom(service.deleteFile("src/main.ts"))
      ).rejects.toMatchObject({ message: "delete failed" });

      expect(remoteServiceMock.stageFileChanges).not.toHaveBeenCalled();
    });

    it("should propagate error when stageFileChanges fails", async () => {
      remoteServiceMock.deleteRemoteFile.mockReturnValue(of(undefined));
      remoteServiceMock.stageFileChanges.mockReturnValue(
        throwError(() => new Error("stage failed"))
      );

      await expect(
        firstValueFrom(service.deleteFile("src/main.ts"))
      ).rejects.toMatchObject({ message: "stage failed" });
    });
  });

  describe("evictDirectory", () => {
    beforeEach(() => {
      remoteServiceMock.getRemoteRepositorySourceTree
        .mockReturnValueOnce(of([SRC_DIRECTORY_ENTRY, TESTS_DIRECTORY_ENTRY]))
        .mockReturnValueOnce(of([MAIN_FILE_ENTRY]));

      service.setContext(PROJECT_ID, REPOSITORY_ID);
      TestBed.tick();
      service.loadDirectoryChildren(SRC_DIR_NODE);
    });

    it("should prevent the evicted directory from being re-fetched on reload", () => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
        of([TESTS_DIRECTORY_ENTRY])
      );

      service.evictDirectory("src");
      remoteServiceMock.getRemoteRepositorySourceTree.mockClear();
      service.reload();

      const subDirPaths =
        remoteServiceMock.getRemoteRepositorySourceTree.mock.calls
          .filter((c) => c[2] !== undefined)
          .map((c) => c[2]);
      expect(subDirPaths).not.toContain("src");
    });

    it("should also evict child directories of the deleted path", () => {
      // Expand a child of src
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValueOnce(
        of([
          {
            path: "src/nested",
            pathCode: GitFileStatusCode.UNKNOWN,
            pathSize: 0,
            directory: true,
          },
        ])
      );
      service.loadDirectoryChildren({
        data: { filePath: "src/nested", isDirectory: true },
      } as TreeNode<FileNodeData>);

      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
        of([TESTS_DIRECTORY_ENTRY])
      );

      service.evictDirectory("src");
      remoteServiceMock.getRemoteRepositorySourceTree.mockClear();
      service.reload();

      const subDirPaths =
        remoteServiceMock.getRemoteRepositorySourceTree.mock.calls
          .filter((c) => c[2] !== undefined)
          .map((c) => c[2]);
      expect(subDirPaths).not.toContain("src");
      expect(subDirPaths).not.toContain("src/nested");
    });
  });

  describe("hasChanges", () => {
    it("should return false when all files have Unknown status", () => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
        of([SRC_DIRECTORY_ENTRY])
      );

      service.setContext(PROJECT_ID, REPOSITORY_ID);
      TestBed.tick();

      expect(service.hasChanges()).toBe(false);
    });

    it("should return true when a file has a changed status", () => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
        of([MAIN_FILE_ENTRY])
      );

      service.setContext(PROJECT_ID, REPOSITORY_ID);
      TestBed.tick();

      expect(service.hasChanges()).toBe(true);
    });

    it("should return true when a directory has a changed status", () => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
        of([
          {
            path: "src",
            pathCode: GitFileStatusCode.INDEX_DELETED,
            pathSize: 0,
            directory: true,
          },
        ])
      );

      service.setContext(PROJECT_ID, REPOSITORY_ID);
      TestBed.tick();

      expect(service.hasChanges()).toBe(true);
    });
  });

  describe("loadDirectoryChildren with deleted paths", () => {
    it("should skip fetch for a nested directory under a deleted ancestor", () => {
      remoteServiceMock.getRemoteRepositorySourceTree.mockReturnValue(
        of([
          {
            path: "tpk_654_oracle",
            pathCode: GitFileStatusCode.INDEX_DELETED,
            pathSize: 96,
            directory: true,
          },
          {
            path: "tpk_654_oracle/mx3_core",
            pathCode: GitFileStatusCode.INDEX_DELETED,
            pathSize: 21,
            directory: true,
          },
          {
            path: "tpk_654_oracle/mx3_core/app_dir/fs/public/mxres/common/dbconfig/mxservercredential.mxres",
            pathCode: GitFileStatusCode.INDEX_DELETED,
            pathSize: 0,
            directory: false,
          },
        ])
      );

      service.setContext(PROJECT_ID, REPOSITORY_ID);
      TestBed.tick();

      service.loadDirectoryChildren({
        data: {
          filePath: "tpk_654_oracle/mx3_core/app_dir/fs/public/mxres/common",
          isDirectory: true,
        },
      } as TreeNode<FileNodeData>);

      expect(
        remoteServiceMock.getRemoteRepositorySourceTree
      ).toHaveBeenCalledTimes(1);
    });
  });
});
