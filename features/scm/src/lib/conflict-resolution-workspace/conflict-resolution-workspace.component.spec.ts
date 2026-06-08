import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NEVER, Observable, of, Subject, throwError, map } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";

import { ConflictResolutionWorkspaceComponent } from "./conflict-resolution-workspace.component";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import { ConflictFileTreeViewComponent } from "../conflict-file-tree-view/conflict-file-tree-view.component";
import { FileConflictResolverComponent } from "../file-conflict-resolver/file-conflict-resolver.component";
import { GitFileStatusCode } from "../remote-cloned-repository/model/git-file-status-code.enum";
import { RebaseState } from "../remote-cloned-repository/response/get-rebase-operation-info-api-response";
import { ConflictingFileMetadataApiResponse } from "../remote-cloned-repository/response/./conflicting-files-metadata-api-response";

interface ConflictFileSelection {
  filePath: string;
  gitFileStatusCode: GitFileStatusCode;
}

interface MockRepositoryStateResponse {
  rebaseInProgress: boolean;
  sourceBranchName: string;
  targetBranchName: string;
  rebaseState?: RebaseState;
  rebaseOperations: unknown[];
  conflictingFiles?: ConflictingFileMetadataApiResponse[];
}

describe("ConflictResolutionWorkspaceComponent", () => {
  const PROJECT_ID = "project-1";
  const REMOTE_REPOSITORY_ID = "repo-1";
  const ERROR_MESSAGE = "boom";

  const rebaseInProgressState = {
    rebaseInProgress: true,
    sourceBranchName: "feature/x",
    targetBranchName: "main",
    rebaseState: RebaseState.TECHNICAL_REBASE_IN_CONFLICT,
    rebaseOperations: [],
  };

  const remoteServiceMock: {
    getRebaseOperationInfo: jest.Mock;
    continueRebase: jest.Mock;
    getConflictingFiles: jest.Mock;
  } = {
    getRebaseOperationInfo: jest.fn(),

    continueRebase: jest.fn(),
    getConflictingFiles: jest.fn(),
  };

  const toastServiceMock = {
    showSuccess: jest.fn(),
    showError: jest.fn(),
  };

  let fixture: ComponentFixture<ConflictResolutionWorkspaceComponent>;
  let component: ConflictResolutionWorkspaceComponent;

  const buildFixtureWith = async (
    stateReturn: Observable<MockRepositoryStateResponse>,
    conflictingFiles: ConflictingFileMetadataApiResponse[] = []
  ): Promise<void> => {
    const stateWithFiles = stateReturn.pipe(
      map((state) => ({ ...state, conflictingFiles }))
    );

    remoteServiceMock.getRebaseOperationInfo.mockReturnValue(stateWithFiles);

    await TestBed.configureTestingModule({
      imports: [ConflictResolutionWorkspaceComponent],
    })
      .overrideComponent(ConflictResolutionWorkspaceComponent, {
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
      .overrideComponent(ConflictFileTreeViewComponent, {
        set: { template: "", imports: [], providers: [] },
      })
      .overrideComponent(FileConflictResolverComponent, {
        set: { template: "", imports: [], providers: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ConflictResolutionWorkspaceComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput(
      "remoteClonedRepositoryId",
      REMOTE_REPOSITORY_ID
    );
    fixture.detectChanges();
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("repository state resource", () => {
    it("should expose rebase-in-progress state when service returns it", async () => {
      await buildFixtureWith(of(rebaseInProgressState));

      expect(remoteServiceMock.getRebaseOperationInfo).toHaveBeenCalledWith(
        PROJECT_ID,
        REMOTE_REPOSITORY_ID
      );
      expect(component.rebaseInProgress()).toBe(true);
      expect(component.isCheckingState()).toBe(false);
      expect(component.stateErrorMessage()).toBeNull();
    });

    it("should expose error message when state request fails", async () => {
      await buildFixtureWith(throwError(() => new Error(ERROR_MESSAGE)));

      expect(component.stateErrorMessage()).toBe(ERROR_MESSAGE);
    });

    it("should report no rebase in progress when state lacks rebase", async () => {
      await buildFixtureWith(
        of({ ...rebaseInProgressState, rebaseInProgress: false })
      );

      expect(component.rebaseInProgress()).toBe(false);
    });

    it("should derive the ready view state when rebase is in progress", async () => {
      await buildFixtureWith(of(rebaseInProgressState));

      expect(component.viewState()).toBe("ready");
    });

    it("should derive the error view state when state request fails", async () => {
      await buildFixtureWith(throwError(() => new Error(ERROR_MESSAGE)));

      expect(component.viewState()).toBe("error");
    });

    it("should derive the no-rebase view state when no rebase is active", async () => {
      await buildFixtureWith(
        of({ ...rebaseInProgressState, rebaseInProgress: false })
      );

      expect(component.viewState()).toBe("no-rebase");
    });
  });

  describe("file selection", () => {
    it("should store selected file when onFileSelected is called", async () => {
      await buildFixtureWith(of(rebaseInProgressState));
      const selection: ConflictFileSelection = {
        filePath: "src/a.ts",
        gitFileStatusCode: GitFileStatusCode.BOTH_MODIFIED,
      };

      component.onFileSelected(selection);

      expect(component.selectedFile()).toEqual(selection);
    });

    it("should clear selected file when onFileResolved is called", async () => {
      await buildFixtureWith(of(rebaseInProgressState));
      component.onFileSelected({
        filePath: "src/a.ts",
        gitFileStatusCode: GitFileStatusCode.BOTH_MODIFIED,
      });

      component.onFileResolved();

      expect(component.selectedFile()).toBeNull();
    });

    it("should bump treeReloadToken when onFileResolved is called", async () => {
      await buildFixtureWith(of(rebaseInProgressState));
      const tokenBefore = component.treeReloadToken();

      component.onFileResolved();

      expect(component.treeReloadToken()).toBe(tokenBefore + 1);
    });
  });

  describe("remainingConflictCount and allConflictsResolved", () => {
    it("should report zero remaining conflicts when tree has no files", async () => {
      await buildFixtureWith(of(rebaseInProgressState), []);

      expect(component.remainingConflictCount()).toBe(0);
      expect(component.allConflictsResolved()).toBe(true);
    });

    it("should report file count from the tree when files exist", async () => {
      await buildFixtureWith(of(rebaseInProgressState), [
        {
          filePath: "a.ts",
          workspaceFileByteSize: 1,
          baseFileByteSize: 1,
          localFileByteSize: 1,
          remoteFileByteSize: 1,
          gitFileStatusCode: GitFileStatusCode.BOTH_MODIFIED,
        },
        {
          filePath: "b.ts",
          workspaceFileByteSize: 1,
          baseFileByteSize: 1,
          localFileByteSize: 1,
          remoteFileByteSize: 1,
          gitFileStatusCode: GitFileStatusCode.BOTH_MODIFIED,
        },
      ]);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.remainingConflictCount()).toBe(2);
      expect(component.allConflictsResolved()).toBe(false);
    });

    it("should ignore non-conflict statuses when counting remaining conflicts", async () => {
      await buildFixtureWith(of(rebaseInProgressState), [
        {
          filePath: "a.ts",
          workspaceFileByteSize: 1,
          baseFileByteSize: 1,
          localFileByteSize: 1,
          remoteFileByteSize: 1,
          gitFileStatusCode: GitFileStatusCode.BOTH_MODIFIED,
        },
        {
          filePath: "artifact.jar",
          workspaceFileByteSize: 1,
          baseFileByteSize: -1,
          localFileByteSize: -1,
          remoteFileByteSize: -1,
          gitFileStatusCode: GitFileStatusCode.UNTRACKED,
        },
      ]);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.remainingConflictCount()).toBe(1);
      expect(component.allConflictsResolved()).toBe(false);
    });

    it("should expose the resolved empty-selection message when no conflicts remain", async () => {
      await buildFixtureWith(of(rebaseInProgressState), []);

      expect(component.emptySelectionMessage()).toBe(
        'All conflicts are resolved. Click "Apply Fixes" below to continue the rebase.'
      );
    });

    it("should expose the file-selection prompt when conflicts remain", async () => {
      await buildFixtureWith(of(rebaseInProgressState), [
        {
          filePath: "a.ts",
          workspaceFileByteSize: 1,
          baseFileByteSize: 1,
          localFileByteSize: 1,
          remoteFileByteSize: 1,
          gitFileStatusCode: GitFileStatusCode.BOTH_MODIFIED,
        },
      ]);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.emptySelectionMessage()).toBe(
        "Select a file from the tree to resolve its conflicts."
      );
    });
  });

  describe("template states", () => {
    it("should render the loading skeleton while state is being checked", async () => {
      await buildFixtureWith(NEVER);
      fixture.detectChanges();

      const loadingSkeleton = fixture.nativeElement.querySelector(
        '[data-testid="conflict-resolution-workspace-loading"]'
      );

      expect(component.viewState()).toBe("checking");
      expect(loadingSkeleton).toBeTruthy();
    });

    it("should render the error branch when state loading fails", async () => {
      await buildFixtureWith(throwError(() => new Error(ERROR_MESSAGE)));
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(ERROR_MESSAGE);
    });

    it("should render the no-rebase branch when no rebase is active", async () => {
      await buildFixtureWith(
        of({ ...rebaseInProgressState, rebaseInProgress: false })
      );
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(
        "No rebase is currently in progress for this repository."
      );
    });

    it("should render the empty-selection prompt in the ready branch when no file is selected", async () => {
      await buildFixtureWith(of(rebaseInProgressState), [
        {
          filePath: "a.ts",
          workspaceFileByteSize: 1,
          baseFileByteSize: 1,
          localFileByteSize: 1,
          remoteFileByteSize: 1,
          gitFileStatusCode: GitFileStatusCode.BOTH_MODIFIED,
        },
      ]);
      await fixture.whenStable();
      fixture.detectChanges();

      const emptySelectionElement = fixture.nativeElement.querySelector(
        '[data-testid="conflict-resolution-workspace-empty-selection"]'
      );

      expect(emptySelectionElement).toBeTruthy();
      expect(emptySelectionElement.textContent).toContain(
        "Select a file from the tree to resolve its conflicts."
      );
    });
  });

  describe("applyFixesDisabled", () => {
    it("should disable when rebase is not in progress", async () => {
      await buildFixtureWith(
        of({ ...rebaseInProgressState, rebaseInProgress: false })
      );

      expect(component.applyFixesDisabled()).toBe(true);
    });

    it("should disable when conflicts remain", async () => {
      await buildFixtureWith(of(rebaseInProgressState), [
        {
          filePath: "a.ts",
          workspaceFileByteSize: 1,
          baseFileByteSize: 1,
          localFileByteSize: 1,
          remoteFileByteSize: 1,
          gitFileStatusCode: GitFileStatusCode.BOTH_MODIFIED,
        },
      ]);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.applyFixesDisabled()).toBe(true);
    });

    it("should enable when rebase is in progress and no conflicts remain", async () => {
      await buildFixtureWith(of(rebaseInProgressState), []);

      expect(component.applyFixesDisabled()).toBe(false);
    });
  });

  describe("applyFixes", () => {
    it("should do nothing when disabled", async () => {
      await buildFixtureWith(
        of({ ...rebaseInProgressState, rebaseInProgress: false })
      );

      component.applyFixes();

      expect(remoteServiceMock.continueRebase).not.toHaveBeenCalled();
      expect(component.isApplyingFixes()).toBe(false);
    });

    it("should call continueRebase, refresh rebase info, emit closed and show success toast on success", async () => {
      await buildFixtureWith(of(rebaseInProgressState), []);
      remoteServiceMock.continueRebase.mockReturnValue(of(undefined));
      const closedSpy = jest.fn();
      component.closed.subscribe(closedSpy);

      component.applyFixes();

      expect(remoteServiceMock.continueRebase).toHaveBeenCalledWith(
        PROJECT_ID,
        REMOTE_REPOSITORY_ID
      );
      expect(remoteServiceMock.getRebaseOperationInfo).toHaveBeenCalledTimes(2);
      expect(remoteServiceMock.getRebaseOperationInfo).toHaveBeenLastCalledWith(
        PROJECT_ID,
        REMOTE_REPOSITORY_ID
      );
      expect(toastServiceMock.showSuccess).toHaveBeenCalledWith(
        "Your updates were applied successfully."
      );
      expect(closedSpy).toHaveBeenCalledTimes(1);
      expect(component.isApplyingFixes()).toBe(false);
    });

    it("should keep apply fixes loading active until continue rebase completes", async () => {
      await buildFixtureWith(of(rebaseInProgressState), []);
      const continueRebaseSubject = new Subject<void>();
      remoteServiceMock.continueRebase.mockReturnValue(continueRebaseSubject);

      component.applyFixes();

      expect(component.isApplyingFixes()).toBe(true);

      continueRebaseSubject.next();
      continueRebaseSubject.complete();

      expect(component.isApplyingFixes()).toBe(false);
    });

    it("should show error toast and keep view when continueRebase fails", async () => {
      await buildFixtureWith(of(rebaseInProgressState), []);
      remoteServiceMock.continueRebase.mockReturnValue(
        throwError(() => new Error(ERROR_MESSAGE))
      );
      const closedSpy = jest.fn();
      component.closed.subscribe(closedSpy);

      component.applyFixes();

      expect(toastServiceMock.showError).toHaveBeenCalledWith(
        ERROR_MESSAGE,
        "Apply Fixes Failed"
      );
      expect(remoteServiceMock.getRebaseOperationInfo).toHaveBeenCalledTimes(1);
      expect(closedSpy).not.toHaveBeenCalled();
      expect(component.isApplyingFixes()).toBe(false);
    });
  });
});
