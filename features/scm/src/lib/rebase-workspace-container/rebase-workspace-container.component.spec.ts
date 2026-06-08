import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA, signal } from "@angular/core";
import { By } from "@angular/platform-browser";
import { DomTestUtils } from "@mxevolve/testing";

import { RebaseWorkspaceContainerComponent } from "./rebase-workspace-container.component";
import { RebaseWorkspaceStateService } from "./rebase-workspace-state.service";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import { ScmManagementService } from "../scm-management.service";
import { ConflictResolverComponent } from "../remote-cloned-repository/conflict-resolver/conflict-resolver.component";
import { TechnicalConflictResolverComponent } from "../remote-cloned-repository/technical-conflict-resolver/technical-conflict-resolver.component";
import { ToastMessageService } from "@mxflow/ui/alert";
import { RebaseWorkspaceState } from "./model/rebase-state";
import { RebaseOperation } from "./model/rebase-operation";

describe("RebaseWorkspaceContainerComponent", () => {
  const PROJECT_ID = "project-1";
  const CLONED_REPOSITORY_ID = "remote-repo-1";
  const PROJECT_REPOSITORY_ID = "repo-1";
  const SOURCE_BRANCH = "feature-branch";

  let component: RebaseWorkspaceContainerComponent;
  let fixture: ComponentFixture<RebaseWorkspaceContainerComponent>;
  let mockStateService: {
    initialize: jest.Mock;
    startRebase: jest.Mock;
    refreshState: jest.Mock;
    isLoading: ReturnType<typeof signal<boolean>>;
    isRefreshing: ReturnType<typeof signal<boolean>>;
    isRebaseStarting: ReturnType<typeof signal<boolean>>;
    isRebaseInProgress: ReturnType<typeof signal<boolean>>;
    isButtonDisabled: ReturnType<typeof signal<boolean>>;
    rebaseState: ReturnType<typeof signal<RebaseWorkspaceState | null>>;
    targetBranchName: ReturnType<typeof signal<string | null>>;
    errorMessage: ReturnType<typeof signal<string | null>>;
    displaySourceBranch: ReturnType<typeof signal<string>>;
    displayTargetBranch: ReturnType<typeof signal<string>>;
    lastOperation: ReturnType<typeof signal<RebaseOperation | null>>;
    isLastOperationSuccess: ReturnType<typeof signal<boolean>>;
    isInMxtestConflict: ReturnType<typeof signal<boolean>>;
    isInTechnicalConflict: ReturnType<typeof signal<boolean>>;
    bundleContent: ReturnType<typeof signal<string>>;
  };

  const getRebaseButton = () =>
    DomTestUtils.getElementByTestId(fixture, "rebase-button");

  const getRefreshButton = () =>
    DomTestUtils.getElementByTestId(fixture, "refresh-button");

  const getConflictResolver = () =>
    DomTestUtils.getElementByType(fixture, ConflictResolverComponent);

  const getTechnicalConflictResolver = () =>
    DomTestUtils.getElementByType(fixture, TechnicalConflictResolverComponent);

  beforeEach(async () => {
    mockStateService = {
      initialize: jest.fn(),
      startRebase: jest.fn(),
      refreshState: jest.fn(),
      isLoading: signal(false),
      isRefreshing: signal(false),
      isRebaseStarting: signal(false),
      isRebaseInProgress: signal(false),
      isButtonDisabled: signal(false),
      rebaseState: signal(null),
      targetBranchName: signal(null),
      errorMessage: signal(null),
      displaySourceBranch: signal(SOURCE_BRANCH),
      displayTargetBranch: signal("main"),
      lastOperation: signal(null),
      isLastOperationSuccess: signal(false),
      isInMxtestConflict: signal(false),
      isInTechnicalConflict: signal(false),
      bundleContent: signal(""),
    };

    await TestBed.configureTestingModule({
      imports: [RebaseWorkspaceContainerComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(RebaseWorkspaceContainerComponent, {
        set: {
          providers: [
            {
              provide: RebaseWorkspaceStateService,
              useValue: mockStateService,
            },
            { provide: RemoteClonedRepositoryService, useValue: {} },
            { provide: ScmManagementService, useValue: {} },
          ],
        },
      })
      .overrideComponent(ConflictResolverComponent, {
        set: {
          providers: [
            { provide: RemoteClonedRepositoryService, useValue: {} },
            { provide: ToastMessageService, useValue: {} },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RebaseWorkspaceContainerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("clonedRepositoryId", CLONED_REPOSITORY_ID);
    fixture.componentRef.setInput("projectRepositoryId", PROJECT_REPOSITORY_ID);
    fixture.componentRef.setInput("sourceBranchName", SOURCE_BRANCH);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("ngOnInit", () => {
    it("should initialize state service with input values", () => {
      fixture.detectChanges();

      expect(mockStateService.initialize).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        clonedRepositoryId: CLONED_REPOSITORY_ID,
        projectRepositoryId: PROJECT_REPOSITORY_ID,
        sourceBranchName: SOURCE_BRANCH,
      });
    });
  });

  describe("Rebase button", () => {
    it("should be rendered when not loading", () => {
      expect(getRebaseButton().isRendered()).toBe(true);
    });

    it("should not be rendered while loading", () => {
      mockStateService.isLoading.set(true);

      expect(getRebaseButton().isRendered()).toBe(false);
    });

    it("should delegate startRebase to state service", () => {
      component.startRebase();

      expect(mockStateService.startRebase).toHaveBeenCalled();
    });
  });

  describe("Refresh button", () => {
    it("should be rendered when rebase is in progress", () => {
      mockStateService.isRebaseInProgress.set(true);

      expect(getRefreshButton().isRendered()).toBe(true);
    });

    it("should not be rendered when no rebase in progress", () => {
      mockStateService.isRebaseInProgress.set(false);

      expect(getRefreshButton().isRendered()).toBe(false);
    });

    it("should delegate refreshState to state service", () => {
      component.refreshState();

      expect(mockStateService.refreshState).toHaveBeenCalled();
    });
  });

  describe("MxTest conflict resolver", () => {
    it("should be rendered when in conflict", () => {
      mockStateService.rebaseState.set({
        rebaseInProgress: true,
        sourceBranchName: SOURCE_BRANCH,
        targetBranchName: "main",
        rebaseOperations: [],
      });
      mockStateService.isInMxtestConflict.set(true);

      expect(getConflictResolver().isRendered()).toBe(true);
    });

    it("should not be rendered when not in conflict", () => {
      mockStateService.rebaseState.set({
        rebaseInProgress: false,
        sourceBranchName: SOURCE_BRANCH,
        targetBranchName: "main",
        rebaseOperations: [],
      });
      mockStateService.isInMxtestConflict.set(false);

      expect(getConflictResolver().isRendered()).toBe(false);
    });
  });

  describe("Technical conflict resolver", () => {
    it("should be rendered when in technical conflict", () => {
      mockStateService.rebaseState.set({
        rebaseInProgress: true,
        sourceBranchName: SOURCE_BRANCH,
        targetBranchName: "main",
        rebaseOperations: [],
      });
      mockStateService.isInTechnicalConflict.set(true);

      expect(getTechnicalConflictResolver().isRendered()).toBe(true);
    });

    it("should not be rendered when not in technical conflict", () => {
      mockStateService.rebaseState.set({
        rebaseInProgress: false,
        sourceBranchName: SOURCE_BRANCH,
        targetBranchName: "main",
        rebaseOperations: [],
      });
      mockStateService.isInTechnicalConflict.set(false);

      expect(getTechnicalConflictResolver().isRendered()).toBe(false);
    });

    it("should refresh state when technical conflict resolver is closed", () => {
      mockStateService.rebaseState.set({
        rebaseInProgress: true,
        sourceBranchName: SOURCE_BRANCH,
        targetBranchName: "main",
        rebaseOperations: [],
      });
      mockStateService.isInTechnicalConflict.set(true);
      fixture.detectChanges();

      const technicalResolver = fixture.debugElement.query(
        By.directive(TechnicalConflictResolverComponent)
      ).componentInstance as TechnicalConflictResolverComponent;

      technicalResolver.closed.emit();

      expect(mockStateService.refreshState).toHaveBeenCalledTimes(1);
    });
  });
});
