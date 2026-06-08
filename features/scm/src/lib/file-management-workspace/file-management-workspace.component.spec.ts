import { Component, input, output, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { of } from "rxjs";
import { SplitterModule } from "primeng/splitter";
import { GitFileStatusCode } from "../remote-cloned-repository/model";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import {
  RemoteClonedRepositoryState,
  RemoteClonedRepositoryStateApiResponse,
} from "../remote-cloned-repository/response/get-remote-cloned-repository-state-api-response";
import { FileManagementWorkspaceComponent } from "./file-management-workspace.component";

@Component({
  selector: "mxevolve-file-management-source-tree-view",
  standalone: true,
  template: "",
})
class MockFileManagementSourceTreeViewComponent {
  readonly projectId = input.required<string>();
  readonly remoteRepositoryId = input.required<string>();
  readonly repositoryBasePath = input<string | null>(null);
  readonly treeLoading = signal(false);
  readonly loadFailed = signal(false);
  readonly hasChanges = signal(false);
  readonly fileSelected = output<{
    filePath: string;
    gitFileStatusCode: GitFileStatusCode;
  }>();
  readonly entryDeleted = output<{
    path: string;
    type: "file" | "directory";
  }>();
  readonly sourceTreeRefreshRequested = output<void>();

  readonly reload = jest.fn();
}

@Component({
  selector: "mxevolve-file-editor-view",
  standalone: true,
  template: "",
})
class MockFileEditorViewComponent {
  readonly projectId = input.required<string>();
  readonly repositoryId = input.required<string>();
  readonly filePath = input.required<string>();
  readonly reloadToken = input(0);
  readonly fileSaved = output<void>();
  readonly fileRestored = output<void>();
}

@Component({
  selector: "mxevolve-push-changes-dialog",
  standalone: true,
  template: "",
})
class MockPushChangesDialogComponent {
  readonly projectId = input.required<string>();
  readonly repositoryId = input.required<string>();
  readonly branchName = input.required<string>();
  readonly disabled = input(false);
  readonly disabledTooltip = input("No modified files to push");
  readonly pushSucceeded = output<void>();
}

describe("FileManagementWorkspaceComponent", () => {
  let component: FileManagementWorkspaceComponent;
  let fixture: ComponentFixture<FileManagementWorkspaceComponent>;
  let mockSourceTree: MockFileManagementSourceTreeViewComponent;

  const PROJECT_ID = "project-1";
  const REPOSITORY_ID = "repo-1";
  const BRANCH_NAME = "feature/branch-1";

  const mockRepoService = {
    getRemoteClonedRepositoryState: jest.fn().mockReturnValue(
      of<RemoteClonedRepositoryStateApiResponse>({
        remoteClonedRepositoryState: RemoteClonedRepositoryState.AVAILABLE,
      })
    ),
  } satisfies Pick<
    RemoteClonedRepositoryService,
    "getRemoteClonedRepositoryState"
  >;

  beforeEach(async () => {
    mockRepoService.getRemoteClonedRepositoryState.mockReturnValue(
      of<RemoteClonedRepositoryStateApiResponse>({
        remoteClonedRepositoryState: RemoteClonedRepositoryState.AVAILABLE,
      })
    );

    await TestBed.configureTestingModule({
      imports: [FileManagementWorkspaceComponent],
    })
      .overrideComponent(FileManagementWorkspaceComponent, {
        set: {
          imports: [
            SplitterModule,
            MockFileManagementSourceTreeViewComponent,
            MockFileEditorViewComponent,
            MockPushChangesDialogComponent,
          ],
          providers: [
            {
              provide: RemoteClonedRepositoryService,
              useValue: mockRepoService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FileManagementWorkspaceComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("repositoryId", REPOSITORY_ID);
    fixture.componentRef.setInput("branchName", BRANCH_NAME);
    fixture.detectChanges();

    mockSourceTree = fixture.debugElement.query(
      By.css("mxevolve-file-management-source-tree-view")
    ).componentInstance as MockFileManagementSourceTreeViewComponent;

    jest.clearAllMocks();
  });

  it("should update selected file when file is selected", () => {
    const selection = {
      filePath: "src/main.ts",
      gitFileStatusCode: GitFileStatusCode.WORKTREE_MODIFIED,
    };

    component.onFileSelected(selection);

    expect(component["selectedFile"]()).toEqual(selection);
  });

  it("should refresh tree preserving selection when file is saved", () => {
    component.onFileSaved();

    expect(mockSourceTree.reload).toHaveBeenCalledTimes(1);
    expect(mockSourceTree.reload).not.toHaveBeenCalledWith(
      expect.objectContaining({ preserveSelection: false })
    );
  });

  it("should refresh tree preserving selection when file is restored", () => {
    component.onFileRestored();

    expect(mockSourceTree.reload).toHaveBeenCalledTimes(1);
    expect(mockSourceTree.reload).not.toHaveBeenCalledWith(
      expect.objectContaining({ preserveSelection: false })
    );
  });

  it("should refresh tree when source tree refresh is requested", () => {
    component.onSourceTreeRefreshRequested();

    expect(mockSourceTree.reload).toHaveBeenCalledTimes(1);
  });

  it("should keep selected file when it is deleted from source tree", () => {
    const selection = {
      filePath: "src/main.ts",
      gitFileStatusCode: GitFileStatusCode.WORKTREE_MODIFIED,
    };
    component.onFileSelected(selection);

    component.onTreeEntryDeleted({ path: "src/main.ts", type: "file" });

    expect(component["selectedFile"]()).toEqual(selection);
    expect(mockSourceTree.reload).toHaveBeenCalledWith({
      preserveSelection: false,
    });
  });

  it("should clear selected file when its parent directory is deleted from the source tree", () => {
    component.onFileSelected({
      filePath: "src/main.ts",
      gitFileStatusCode: GitFileStatusCode.WORKTREE_MODIFIED,
    });

    component.onTreeEntryDeleted({ path: "src", type: "directory" });

    expect(component["selectedFile"]()).toBeNull();
  });

  it("should pass repositoryBasePath down to the source tree", () => {
    fixture.componentRef.setInput("repositoryBasePath", "/repos/myapp");
    fixture.detectChanges();

    const sourceTreeEl = fixture.debugElement.query(
      By.css("mxevolve-file-management-source-tree-view")
    ).componentInstance as MockFileManagementSourceTreeViewComponent;

    expect(sourceTreeEl.repositoryBasePath()).toBe("/repos/myapp");
  });

  it("should emit pushSucceeded and refresh tree when push succeeds", () => {
    const emitSpy = jest.fn<void, []>();
    component.pushSucceeded.subscribe(emitSpy);

    component.onPushSucceeded();

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(mockSourceTree.reload).toHaveBeenCalledTimes(1);
  });

  describe("isPushDisabled", () => {
    it("should be disabled when source tree has not yet loaded any changes", () => {
      expect(component["isRepositoryAvailable"]()).toBe(true);
      expect(component["isPushDisabled"]()).toBe(true);
    });

    it("should be disabled when repo is not available", () => {
      mockRepoService.getRemoteClonedRepositoryState.mockReturnValue(
        of<RemoteClonedRepositoryStateApiResponse>({
          remoteClonedRepositoryState: RemoteClonedRepositoryState.IN_USE,
        })
      );
      fixture.componentRef.setInput("repositoryId", "repo-2");
      fixture.detectChanges();

      expect(component["isRepositoryAvailable"]()).toBe(false);
      expect(component["isPushDisabled"]()).toBe(true);
      expect(component["pushDisabledTooltip"]()).toBe(
        "Repository is not available"
      );
    });

    it("should be disabled when repo is available but tree has no changes", () => {
      mockSourceTree.hasChanges.set(false);
      fixture.detectChanges();

      expect(component["isRepositoryAvailable"]()).toBe(true);
      expect(component["isPushDisabled"]()).toBe(true);
      expect(component["pushDisabledTooltip"]()).toBe(
        "No modified files to push"
      );
    });

    it("should be enabled when repo is available and tree has changes", () => {
      mockRepoService.getRemoteClonedRepositoryState.mockReturnValue(
        of<RemoteClonedRepositoryStateApiResponse>({
          remoteClonedRepositoryState: RemoteClonedRepositoryState.AVAILABLE,
        })
      );
      fixture.componentRef.setInput("repositoryId", "repo-available");
      fixture.detectChanges();

      mockSourceTree.hasChanges.set(true);
      fixture.detectChanges();

      expect(component["isRepositoryAvailable"]()).toBe(true);
      expect(component["hasChanges"]()).toBe(true);
      expect(component["isPushDisabled"]()).toBe(false);
    });
  });
});
