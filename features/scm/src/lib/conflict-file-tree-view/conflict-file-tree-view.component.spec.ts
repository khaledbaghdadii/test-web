import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { TreeNode } from "primeng/api";
import { ToastMessageService } from "@mxflow/ui/alert";
import { FileNodeData } from "@mxflow/ui/file-tree";

import { ConflictFileTreeViewComponent } from "./conflict-file-tree-view.component";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import { GitFileStatusCode } from "../remote-cloned-repository/model";
import { ConflictingFileMetadataApiResponse } from "../remote-cloned-repository/response/conflicting-files-metadata-api-response";

describe("ConflictFileTreeViewComponent", () => {
  let component: ConflictFileTreeViewComponent;
  let fixture: ComponentFixture<ConflictFileTreeViewComponent>;

  const remoteServiceMock = {
    getRebaseOperationInfo: jest.fn(),
  };

  const toastServiceMock = {
    showError: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConflictFileTreeViewComponent],
    })
      .overrideComponent(ConflictFileTreeViewComponent, {
        set: {
          providers: [
            {
              provide: RemoteClonedRepositoryService,
              useValue: remoteServiceMock,
            },
            { provide: ToastMessageService, useValue: toastServiceMock },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ConflictFileTreeViewComponent);
    component = fixture.componentInstance;
    jest.clearAllMocks();
  });

  it("should load and map conflicting files when inputs are provided", () => {
    remoteServiceMock.getRebaseOperationInfo.mockReturnValue(
      of({
        conflictingFiles: [
          {
            filePath: "src/app/main.ts",
            workspaceFileByteSize: 120,
            baseFileByteSize: 100,
            localFileByteSize: 110,
            remoteFileByteSize: 115,
            gitFileStatusCode: GitFileStatusCode.BOTH_MODIFIED,
          },
        ],
      })
    );

    fixture.componentRef.setInput("projectId", "project-1");
    fixture.componentRef.setInput("remoteRepositoryId", "repo-1");
    fixture.detectChanges();

    expect(remoteServiceMock.getRebaseOperationInfo).toHaveBeenCalledWith(
      "project-1",
      "repo-1"
    );
    expect(component.files()).toHaveLength(1);
    expect(component.files()[0].filePath).toBe("src/app/main.ts");
    expect(component.files()[0].gitStatus).toBe("CONFLICTED");
  });

  it("should prefer newFilePath over filePath when mapping conflicting files", () => {
    remoteServiceMock.getRebaseOperationInfo.mockReturnValue(
      of({
        conflictingFiles: [
          {
            filePath: "src/app/old-name.ts",
            newFilePath: "src/app/new-name.ts",
            workspaceFileByteSize: 120,
            baseFileByteSize: 100,
            localFileByteSize: 110,
            remoteFileByteSize: 115,
            gitFileStatusCode: GitFileStatusCode.BOTH_MODIFIED,
          },
        ],
      })
    );

    fixture.componentRef.setInput("projectId", "project-1");
    fixture.componentRef.setInput("remoteRepositoryId", "repo-1");
    fixture.detectChanges();

    expect(component.files()).toHaveLength(1);
    expect(component.files()[0].filePath).toBe("src/app/new-name.ts");
    expect(component.files()[0].filePath).not.toBe("src/app/old-name.ts");
  });

  it("should fetch conflicting files again when reloadToken changes", () => {
    remoteServiceMock.getRebaseOperationInfo.mockReturnValue(
      of({
        conflictingFiles: [],
      })
    );

    fixture.componentRef.setInput("projectId", "project-1");
    fixture.componentRef.setInput("remoteRepositoryId", "repo-1");
    fixture.detectChanges();

    expect(remoteServiceMock.getRebaseOperationInfo).toHaveBeenCalledTimes(1);
    expect(remoteServiceMock.getRebaseOperationInfo).toHaveBeenNthCalledWith(
      1,
      "project-1",
      "repo-1"
    );

    fixture.componentRef.setInput("reloadToken", 1);
    fixture.detectChanges();

    expect(remoteServiceMock.getRebaseOperationInfo).toHaveBeenCalledTimes(2);
    expect(remoteServiceMock.getRebaseOperationInfo).toHaveBeenNthCalledWith(
      2,
      "project-1",
      "repo-1"
    );
  });

  it("should not fetch until both projectId and remoteRepositoryId are provided", () => {
    remoteServiceMock.getRebaseOperationInfo.mockReturnValue(
      of({
        conflictingFiles: [],
      })
    );

    fixture.componentRef.setInput("projectId", "project-1");
    fixture.detectChanges();

    expect(remoteServiceMock.getRebaseOperationInfo).not.toHaveBeenCalled();

    fixture.componentRef.setInput("remoteRepositoryId", "repo-1");
    fixture.detectChanges();

    expect(remoteServiceMock.getRebaseOperationInfo).toHaveBeenCalledTimes(1);
    expect(remoteServiceMock.getRebaseOperationInfo).toHaveBeenCalledWith(
      "project-1",
      "repo-1"
    );
  });

  it("should fetch conflicting files again when projectId changes", () => {
    remoteServiceMock.getRebaseOperationInfo.mockReturnValue(
      of({
        conflictingFiles: [],
      })
    );

    fixture.componentRef.setInput("projectId", "project-1");
    fixture.componentRef.setInput("remoteRepositoryId", "repo-1");
    fixture.detectChanges();

    expect(remoteServiceMock.getRebaseOperationInfo).toHaveBeenCalledTimes(1);
    expect(remoteServiceMock.getRebaseOperationInfo).toHaveBeenNthCalledWith(
      1,
      "project-1",
      "repo-1"
    );

    fixture.componentRef.setInput("projectId", "project-2");
    fixture.detectChanges();

    expect(remoteServiceMock.getRebaseOperationInfo).toHaveBeenCalledTimes(2);
    expect(remoteServiceMock.getRebaseOperationInfo).toHaveBeenNthCalledWith(
      2,
      "project-2",
      "repo-1"
    );
  });

  it("should emit selected file path and status code", () => {
    const emitSpy = jest.fn();
    component.fileSelected.subscribe(emitSpy);

    const node: TreeNode<FileNodeData> = {
      data: {
        filePath: "src/app/main.ts",
        metadata: { gitFileStatusCode: GitFileStatusCode.BOTH_MODIFIED },
      },
    };

    component.onTreeFileSelected(node);

    expect(emitSpy).toHaveBeenCalledWith({
      filePath: "src/app/main.ts",
      gitFileStatusCode: GitFileStatusCode.BOTH_MODIFIED,
    });
  });

  it("should block file open when one size field exceeds 1 MB", () => {
    const node: TreeNode<FileNodeData> = {
      data: {
        filePath: "src/app/main.ts",
        isDirectory: false,
        metadata: {
          workspaceFileByteSize: 120,
          baseFileByteSize: 100,
          localFileByteSize: 2_000_000,
          remoteFileByteSize: 115,
        },
      },
    };
    const result = component.openPredicate(node);

    expect(result.allowed).toBe(false);
    expect(result.warningMessage).toContain("localFileByteSize");
  });

  it("should allow file open when tree node has no data", () => {
    const node = {} as TreeNode<FileNodeData>;

    const result = component.openPredicate(node);

    expect(result.allowed).toBe(true);
  });

  it("should allow file open for directories", () => {
    const node: TreeNode<FileNodeData> = {
      data: {
        filePath: "src/app",
        isDirectory: true,
      },
    };

    const result = component.openPredicate(node);

    expect(result.allowed).toBe(true);
  });

  it("should block file open for blocked extensions", () => {
    const node: TreeNode<FileNodeData> = {
      data: {
        filePath: "archive.tar.gz",
        isDirectory: false,
      },
    };
    const result = component.openPredicate(node);

    expect(result.allowed).toBe(false);
    expect(result.warningMessage).toContain(".tar.gz");
  });

  it("should show toast when file open is blocked", () => {
    component.onTreeFileOpenBlocked({
      result: { warningMessage: "Too large" },
    });

    expect(toastServiceMock.showError).toHaveBeenCalledWith(
      "Too large",
      "File Open Blocked"
    );
  });

  it("should show toast and clear files when loading conflicting files fails", () => {
    remoteServiceMock.getRebaseOperationInfo.mockReturnValue(
      throwError(() => new Error("boom"))
    );

    fixture.componentRef.setInput("projectId", "project-1");
    fixture.componentRef.setInput("remoteRepositoryId", "repo-1");
    fixture.detectChanges();

    expect(toastServiceMock.showError).toHaveBeenCalledWith(
      "Failed to load conflicting files: boom",
      "Load Failed"
    );
    expect(component.files()).toEqual([]);
  });

  it("should map missing size fields to zero while preserving max available size", () => {
    const fileWithPartialSizes = {
      filePath: "src/app/main.ts",
      workspaceFileByteSize: undefined,
      baseFileByteSize: undefined,
      localFileByteSize: 42,
      remoteFileByteSize: undefined,
      gitFileStatusCode: GitFileStatusCode.BOTH_MODIFIED,
    } as unknown as ConflictingFileMetadataApiResponse;

    remoteServiceMock.getRebaseOperationInfo.mockReturnValue(
      of({ conflictingFiles: [fileWithPartialSizes] })
    );

    fixture.componentRef.setInput("projectId", "project-1");
    fixture.componentRef.setInput("remoteRepositoryId", "repo-1");
    fixture.detectChanges();

    expect(component.files()).toHaveLength(1);
    expect(component.files()[0].sizeInBytes).toBe(42);
  });

  it("should map sizeInBytes to zero when all backend size fields are missing", () => {
    const fileWithNoSizes = {
      filePath: "src/app/empty.ts",
      workspaceFileByteSize: undefined,
      baseFileByteSize: undefined,
      localFileByteSize: undefined,
      remoteFileByteSize: undefined,
      gitFileStatusCode: GitFileStatusCode.BOTH_MODIFIED,
    } as unknown as ConflictingFileMetadataApiResponse;

    remoteServiceMock.getRebaseOperationInfo.mockReturnValue(
      of({ conflictingFiles: [fileWithNoSizes] })
    );

    fixture.componentRef.setInput("projectId", "project-1");
    fixture.componentRef.setInput("remoteRepositoryId", "repo-1");
    fixture.detectChanges();

    expect(component.files()).toHaveLength(1);
    expect(component.files()[0].sizeInBytes).toBe(0);
  });
});
