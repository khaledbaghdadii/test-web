import { TestBed } from "@angular/core/testing";
import { DestroyRef } from "@angular/core";
import { of, throwError } from "rxjs";

import { RebaseWorkspaceStateService } from "./rebase-workspace-state.service";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import { ScmManagementService } from "../scm-management.service";
import { RebaseState } from "../remote-cloned-repository/response/get-rebase-operation-info-api-response";
import {
  RemoteClonedRepositoryOperationStatus,
  RemoteClonedRepositoryOperationType,
} from "../remote-cloned-repository/response/remote-cloned-repository-operation-api-response";
import { Developments } from "../development/developments";
import { Development } from "../development/development";
import { RebaseWorkspaceState } from "./model/rebase-state";
import { RebaseOperation } from "./model/rebase-operation";

describe("RebaseWorkspaceStateService", () => {
  const PROJECT_ID = "project-1";
  const CLONED_REPOSITORY_ID = "remote-repo-1";
  const PROJECT_REPOSITORY_ID = "repo-1";
  const SOURCE_BRANCH = "feature-branch";
  const TARGET_BRANCH = "main";

  const CONFIG = {
    projectId: PROJECT_ID,
    clonedRepositoryId: CLONED_REPOSITORY_ID,
    projectRepositoryId: PROJECT_REPOSITORY_ID,
    sourceBranchName: SOURCE_BRANCH,
  };

  let service: RebaseWorkspaceStateService;
  let mockRemoteClonedRepoService: {
    getRebaseOperationInfo: jest.Mock;
    startRemoteClonedRepositoryFunctionalTechnicalRebase: jest.Mock;
  };
  let mockScmManagementService: {
    getDevelopments: jest.Mock;
  };

  const createMockDevelopment = (
    overrides: Partial<Development> = {}
  ): Development => ({
    id: "dev-1",
    name: SOURCE_BRANCH,
    source: TARGET_BRANCH,
    projectId: PROJECT_ID,
    repository: {
      id: PROJECT_REPOSITORY_ID,
      url: "https://example.com/repo.git",
    },
    latestCommitId: "abc123",
    createdOn: "2026-01-01T00:00:00Z",
    parentCommitId: "def456",
    deleted: false,
    ...overrides,
  });

  const createMockDevelopments = (
    content: Development[] = [createMockDevelopment()]
  ): Developments => ({
    totalPages: 1,
    totalElements: content.length,
    size: content.length,
    content,
    empty: content.length === 0,
    last: true,
  });

  const createMockState = (
    overrides: Partial<RebaseWorkspaceState> = {}
  ): RebaseWorkspaceState => ({
    rebaseInProgress: false,
    sourceBranchName: SOURCE_BRANCH,
    targetBranchName: TARGET_BRANCH,
    rebaseOperations: [],
    ...overrides,
  });

  const createMockOperation = (
    overrides: Partial<RebaseOperation> = {}
  ): RebaseOperation => ({
    id: "op-1",
    type: RemoteClonedRepositoryOperationType.TECHNICAL_REBASE,
    status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
    ...overrides,
  });

  beforeEach(() => {
    mockRemoteClonedRepoService = {
      getRebaseOperationInfo: jest.fn().mockReturnValue(of(createMockState())),
      startRemoteClonedRepositoryFunctionalTechnicalRebase: jest
        .fn()
        .mockReturnValue(of(undefined)),
    };

    mockScmManagementService = {
      getDevelopments: jest.fn().mockReturnValue(of(createMockDevelopments())),
    };

    TestBed.configureTestingModule({
      providers: [
        RebaseWorkspaceStateService,
        {
          provide: RemoteClonedRepositoryService,
          useValue: mockRemoteClonedRepoService,
        },
        { provide: ScmManagementService, useValue: mockScmManagementService },
        DestroyRef,
      ],
    });

    service = TestBed.inject(RebaseWorkspaceStateService);
  });

  describe("initialize", () => {
    it("should call getDevelopments to resolve target branch", () => {
      service.initialize(CONFIG);

      expect(mockScmManagementService.getDevelopments).toHaveBeenCalledWith(
        PROJECT_ID,
        { repositoryId: PROJECT_REPOSITORY_ID, name: SOURCE_BRANCH }
      );
    });

    it("should resolve target branch from matching development source", () => {
      service.initialize(CONFIG);

      expect(service.targetBranchName()).toBe(TARGET_BRANCH);
    });

    it("should load rebase state after resolving target branch", () => {
      service.initialize(CONFIG);

      expect(
        mockRemoteClonedRepoService.getRebaseOperationInfo
      ).toHaveBeenCalledWith(PROJECT_ID, CLONED_REPOSITORY_ID);
    });

    it("should set rebase state on successful load", () => {
      const state = createMockState({ rebaseInProgress: true });
      mockRemoteClonedRepoService.getRebaseOperationInfo.mockReturnValue(
        of(state)
      );

      service.initialize(CONFIG);

      expect(service.rebaseState()).toEqual(state);
      expect(service.isLoading()).toBe(false);
    });

    it("should set targetBranchName to null when no matching development", () => {
      mockScmManagementService.getDevelopments.mockReturnValue(
        of(createMockDevelopments([]))
      );

      service.initialize(CONFIG);

      expect(service.targetBranchName()).toBeNull();
    });

    it("should set error on getDevelopments failure", () => {
      mockScmManagementService.getDevelopments.mockReturnValue(
        throwError(() => new Error("Network error"))
      );

      service.initialize(CONFIG);

      expect(service.errorMessage()).toBe("Network error");
      expect(service.isLoading()).toBe(false);
    });

    it("should set error on getRebaseOperationInfo failure", () => {
      mockRemoteClonedRepoService.getRebaseOperationInfo.mockReturnValue(
        throwError(() => new Error("State load error"))
      );

      service.initialize(CONFIG);

      expect(service.errorMessage()).toBe("State load error");
      expect(service.isLoading()).toBe(false);
    });
  });

  describe("computed signals", () => {
    beforeEach(() => {
      service.initialize(CONFIG);
    });

    describe("isRebaseInProgress", () => {
      it("should return true when rebase is in progress", () => {
        service.rebaseState.set(createMockState({ rebaseInProgress: true }));

        expect(service.isRebaseInProgress()).toBe(true);
      });

      it("should return false when no rebase in progress", () => {
        expect(service.isRebaseInProgress()).toBe(false);
      });

      it("should return false when state is null", () => {
        service.rebaseState.set(null);

        expect(service.isRebaseInProgress()).toBe(false);
      });
    });

    describe("isButtonDisabled", () => {
      it("should be disabled when rebase is in progress", () => {
        service.rebaseState.set(createMockState({ rebaseInProgress: true }));

        expect(service.isButtonDisabled()).toBe(true);
      });

      it("should be disabled when rebase is starting", () => {
        service.isRebaseStarting.set(true);

        expect(service.isButtonDisabled()).toBe(true);
      });

      it("should be disabled when target branch is not resolved", () => {
        service.targetBranchName.set(null);

        expect(service.isButtonDisabled()).toBe(true);
      });

      it("should be enabled when no blocking conditions exist", () => {
        expect(service.isButtonDisabled()).toBe(false);
      });
    });

    describe("lastOperation", () => {
      it("should return null when no operations exist", () => {
        service.rebaseState.set(createMockState({ rebaseOperations: [] }));

        expect(service.lastOperation()).toBeNull();
      });

      it("should return the technical operation from the latest finished rebase pair", () => {
        service.rebaseState.set(
          createMockState({
            rebaseOperations: [
              createMockOperation({
                id: "op-fc",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-01T00:00:00Z",
              }),
              createMockOperation({
                id: "op-tr",
                type: RemoteClonedRepositoryOperationType.TECHNICAL_REBASE,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-01T01:00:00Z",
              }),
            ],
          })
        );

        expect(service.lastOperation()?.id).toBe("op-tr");
      });

      it("should return functional failed when the latest finished attempt failed before technical", () => {
        service.rebaseState.set(
          createMockState({
            rebaseOperations: [
              createMockOperation({
                id: "op-fc-failed",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.FAILED,
                endedOn: "2026-02-01T00:00:00Z",
                failureReason: "Some error",
              }),
              createMockOperation({
                id: "op-tr-old",
                type: RemoteClonedRepositoryOperationType.TECHNICAL_REBASE,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-01T01:00:00Z",
              }),
              createMockOperation({
                id: "op-fc-old",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-01T00:00:00Z",
              }),
            ],
          })
        );

        expect(service.lastOperation()?.id).toBe("op-fc-failed");
      });

      it("should ignore a newer incomplete attempt and keep latest completed technical success", () => {
        service.rebaseState.set(
          createMockState({
            rebaseOperations: [
              createMockOperation({
                id: "op-fc-old",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-04-24T10:23:52.661079Z",
              }),
              createMockOperation({
                id: "op-tr-old",
                type: RemoteClonedRepositoryOperationType.TECHNICAL_REBASE,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-04-24T10:27:25.424620Z",
              }),
              createMockOperation({
                id: "op-fc-new",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-04-24T10:34:12.069981Z",
              }),
              createMockOperation({
                id: "op-tr-new-ip",
                type: RemoteClonedRepositoryOperationType.TECHNICAL_REBASE,
                status: RemoteClonedRepositoryOperationStatus.IN_PROGRESS,
              }),
            ],
          })
        );

        expect(service.lastOperation()?.id).toBe("op-tr-old");
      });

      it("should keep latest completed failed technical operation when a newer functional-only success exists", () => {
        service.rebaseState.set(
          createMockState({
            rebaseOperations: [
              createMockOperation({
                id: "op-fc-new",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-04-24T10:34:12.069981Z",
              }),
              createMockOperation({
                id: "op-tr-old-failed",
                type: RemoteClonedRepositoryOperationType.TECHNICAL_REBASE,
                status: RemoteClonedRepositoryOperationStatus.FAILED,
                endedOn: "2026-04-24T10:27:25.424620Z",
                failureReason: "conflict",
              }),
              createMockOperation({
                id: "op-fc-old",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-04-24T10:23:52.661079Z",
              }),
              createMockOperation({
                id: "op-tr-new-ip",
                type: RemoteClonedRepositoryOperationType.TECHNICAL_REBASE,
                status: RemoteClonedRepositoryOperationStatus.IN_PROGRESS,
              }),
            ],
          })
        );

        expect(service.lastOperation()?.id).toBe("op-tr-old-failed");
      });
    });

    describe("isLastOperationSuccess", () => {
      it("should return false when no operations exist", () => {
        service.rebaseState.set(createMockState({ rebaseOperations: [] }));

        expect(service.isLastOperationSuccess()).toBe(false);
      });

      it("should return true when both functional check and technical rebase succeeded", () => {
        service.rebaseState.set(
          createMockState({
            rebaseOperations: [
              createMockOperation({
                id: "op-fc",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-01T00:00:00Z",
              }),
              createMockOperation({
                id: "op-tr",
                type: RemoteClonedRepositoryOperationType.TECHNICAL_REBASE,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-01T01:00:00Z",
              }),
            ],
          })
        );

        expect(service.isLastOperationSuccess()).toBe(true);
      });

      it("should return false when functional check failed", () => {
        service.rebaseState.set(
          createMockState({
            rebaseOperations: [
              createMockOperation({
                id: "op-fc-new-failed",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.FAILED,
                endedOn: "2026-01-02T00:00:00Z",
              }),
              createMockOperation({
                id: "op-tr-old",
                type: RemoteClonedRepositoryOperationType.TECHNICAL_REBASE,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-01T01:00:00Z",
              }),
              createMockOperation({
                id: "op-fc-old",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-01T00:00:00Z",
              }),
            ],
          })
        );

        expect(service.isLastOperationSuccess()).toBe(false);
      });

      it("should return false when technical rebase failed", () => {
        service.rebaseState.set(
          createMockState({
            rebaseOperations: [
              createMockOperation({
                id: "op-fc",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-01T00:00:00Z",
              }),
              createMockOperation({
                id: "op-tr",
                type: RemoteClonedRepositoryOperationType.TECHNICAL_REBASE,
                status: RemoteClonedRepositoryOperationStatus.FAILED,
                endedOn: "2026-01-01T01:00:00Z",
                failureReason: "Merge conflict",
              }),
            ],
          })
        );

        expect(service.isLastOperationSuccess()).toBe(false);
      });

      it("should return false when only functional check exists", () => {
        service.rebaseState.set(
          createMockState({
            rebaseOperations: [
              createMockOperation({
                id: "op-fc",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-01T00:00:00Z",
              }),
            ],
          })
        );

        expect(service.isLastOperationSuccess()).toBe(false);
      });

      it("should return false when both operations failed", () => {
        service.rebaseState.set(
          createMockState({
            rebaseOperations: [
              createMockOperation({
                id: "op-fc-new-failed",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.FAILED,
                endedOn: "2026-01-02T00:00:00Z",
              }),
              createMockOperation({
                id: "op-tr-old-failed",
                type: RemoteClonedRepositoryOperationType.TECHNICAL_REBASE,
                status: RemoteClonedRepositoryOperationStatus.FAILED,
                endedOn: "2026-01-01T01:00:00Z",
                failureReason: "Merge conflict",
              }),
              createMockOperation({
                id: "op-fc-old",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-01T00:00:00Z",
              }),
            ],
          })
        );

        expect(service.isLastOperationSuccess()).toBe(false);
      });

      it("should ignore in-progress operations and use latest completed of each type", () => {
        service.rebaseState.set(
          createMockState({
            rebaseOperations: [
              createMockOperation({
                id: "op-fc",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-01T00:00:00Z",
              }),
              createMockOperation({
                id: "op-tr",
                type: RemoteClonedRepositoryOperationType.TECHNICAL_REBASE,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-01T01:00:00Z",
              }),
              createMockOperation({
                id: "op-fc-ip",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.IN_PROGRESS,
              }),
            ],
          })
        );

        expect(service.isLastOperationSuccess()).toBe(true);
      });

      it("should use the latest finished pair and ignore an incomplete newer functional success", () => {
        service.rebaseState.set(
          createMockState({
            rebaseOperations: [
              createMockOperation({
                id: "op-fc-new",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-02T00:00:00Z",
              }),
              createMockOperation({
                id: "op-tr-old",
                type: RemoteClonedRepositoryOperationType.TECHNICAL_REBASE,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-01T01:00:00Z",
              }),
              createMockOperation({
                id: "op-fc-old",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-01T00:00:00Z",
              }),
              createMockOperation({
                id: "op-tr-ip",
                type: RemoteClonedRepositoryOperationType.TECHNICAL_REBASE,
                status: RemoteClonedRepositoryOperationStatus.IN_PROGRESS,
              }),
            ],
          })
        );

        expect(service.isLastOperationSuccess()).toBe(true);
      });

      it("should return false when latest finished attempt has functional check failed", () => {
        service.rebaseState.set(
          createMockState({
            rebaseOperations: [
              createMockOperation({
                id: "op-fc-latest-failed",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.FAILED,
                endedOn: "2026-01-03T00:00:00Z",
              }),
              createMockOperation({
                id: "op-tr-old",
                type: RemoteClonedRepositoryOperationType.TECHNICAL_REBASE,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-02T01:00:00Z",
              }),
              createMockOperation({
                id: "op-fc-old",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-01-02T00:00:00Z",
              }),
            ],
          })
        );

        expect(service.isLastOperationSuccess()).toBe(false);
      });

      it("should return false when latest completed attempt has failed technical and newer functional-only success exists", () => {
        service.rebaseState.set(
          createMockState({
            rebaseOperations: [
              createMockOperation({
                id: "op-fc-new",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-04-24T10:34:12.069981Z",
              }),
              createMockOperation({
                id: "op-tr-old-failed",
                type: RemoteClonedRepositoryOperationType.TECHNICAL_REBASE,
                status: RemoteClonedRepositoryOperationStatus.FAILED,
                endedOn: "2026-04-24T10:27:25.424620Z",
                failureReason: "conflict",
              }),
              createMockOperation({
                id: "op-fc-old",
                type: RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS,
                status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
                endedOn: "2026-04-24T10:23:52.661079Z",
              }),
              createMockOperation({
                id: "op-tr-new-ip",
                type: RemoteClonedRepositoryOperationType.TECHNICAL_REBASE,
                status: RemoteClonedRepositoryOperationStatus.IN_PROGRESS,
              }),
            ],
          })
        );

        expect(service.isLastOperationSuccess()).toBe(false);
      });
    });

    describe("isInMxtestConflict", () => {
      it("should return true when rebase state is MXTEST_FUNCTIONAL_REBASE_IN_CONFLICT", () => {
        service.rebaseState.set(
          createMockState({
            rebaseState: RebaseState.MXTEST_FUNCTIONAL_REBASE_IN_CONFLICT,
          })
        );

        expect(service.isInMxtestConflict()).toBe(true);
      });

      it("should return false when rebase state is in progress", () => {
        service.rebaseState.set(
          createMockState({
            rebaseState: RebaseState.MXTEST_FUNCTIONAL_REBASE_IN_PROGRESS,
          })
        );

        expect(service.isInMxtestConflict()).toBe(false);
      });

      it("should return false when no rebase state", () => {
        service.rebaseState.set(createMockState({ rebaseState: undefined }));

        expect(service.isInMxtestConflict()).toBe(false);
      });
    });

    describe("isInTechnicalConflict", () => {
      it("should return true when rebase state is TECHNICAL_REBASE_IN_CONFLICT", () => {
        service.rebaseState.set(
          createMockState({
            rebaseState: RebaseState.TECHNICAL_REBASE_IN_CONFLICT,
          })
        );

        expect(service.isInTechnicalConflict()).toBe(true);
      });

      it("should return false when rebase state is in progress", () => {
        service.rebaseState.set(
          createMockState({
            rebaseState: RebaseState.TECHNICAL_REBASE_IN_PROGRESS,
          })
        );

        expect(service.isInTechnicalConflict()).toBe(false);
      });

      it("should return false when no rebase state", () => {
        service.rebaseState.set(createMockState({ rebaseState: undefined }));

        expect(service.isInTechnicalConflict()).toBe(false);
      });
    });

    describe("displaySourceBranch", () => {
      it("should prefer state source branch name", () => {
        service.rebaseState.set(
          createMockState({ sourceBranchName: "state-source" })
        );

        expect(service.displaySourceBranch()).toBe("state-source");
      });

      it("should fall back to config source branch name", () => {
        service.rebaseState.set(createMockState({ sourceBranchName: "" }));

        expect(service.displaySourceBranch()).toBe(SOURCE_BRANCH);
      });
    });

    describe("displayTargetBranch", () => {
      it("should prefer state target branch name", () => {
        service.rebaseState.set(
          createMockState({ targetBranchName: "state-target" })
        );

        expect(service.displayTargetBranch()).toBe("state-target");
      });

      it("should fall back to resolved target branch name", () => {
        service.rebaseState.set(createMockState({ targetBranchName: "" }));

        expect(service.displayTargetBranch()).toBe(TARGET_BRANCH);
      });

      it("should return empty string when no target branch resolved", () => {
        mockScmManagementService.getDevelopments.mockReturnValue(
          of(createMockDevelopments([]))
        );
        service.initialize(CONFIG);
        service.rebaseState.set(createMockState({ targetBranchName: "" }));

        expect(service.displayTargetBranch()).toBe("");
      });
    });
  });

  describe("startRebase", () => {
    beforeEach(() => {
      service.initialize(CONFIG);
    });

    it("should call service with correct request payload", () => {
      service.startRebase();

      expect(
        mockRemoteClonedRepoService.startRemoteClonedRepositoryFunctionalTechnicalRebase
      ).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: CLONED_REPOSITORY_ID,
        payload: {
          sourceBranchName: SOURCE_BRANCH,
          targetBranchName: TARGET_BRANCH,
        },
      });
    });

    it("should reload state after successful rebase start", () => {
      jest.useFakeTimers();
      mockRemoteClonedRepoService.getRebaseOperationInfo.mockClear();

      service.startRebase();
      jest.runAllTimers();

      expect(
        mockRemoteClonedRepoService.getRebaseOperationInfo
      ).toHaveBeenCalledWith(PROJECT_ID, CLONED_REPOSITORY_ID);

      jest.useRealTimers();
    });

    it("should set error and reload state on failure", () => {
      mockRemoteClonedRepoService.startRemoteClonedRepositoryFunctionalTechnicalRebase.mockReturnValue(
        throwError(() => new Error("Rebase failed"))
      );
      mockRemoteClonedRepoService.getRebaseOperationInfo.mockClear();

      service.startRebase();

      expect(service.errorMessage()).toBe("Rebase failed");
      expect(
        mockRemoteClonedRepoService.getRebaseOperationInfo
      ).toHaveBeenCalled();
    });

    it("should not start rebase when button is disabled", () => {
      service.rebaseState.set(createMockState({ rebaseInProgress: true }));

      service.startRebase();

      expect(
        mockRemoteClonedRepoService.startRemoteClonedRepositoryFunctionalTechnicalRebase
      ).not.toHaveBeenCalled();
    });

    it("should not start rebase when target branch is not resolved", () => {
      service.targetBranchName.set(null);

      service.startRebase();

      expect(
        mockRemoteClonedRepoService.startRemoteClonedRepositoryFunctionalTechnicalRebase
      ).not.toHaveBeenCalled();
    });
  });

  describe("refreshState", () => {
    beforeEach(() => {
      service.initialize(CONFIG);
    });

    it("should fetch latest rebase state", () => {
      mockRemoteClonedRepoService.getRebaseOperationInfo.mockClear();
      const updatedState = createMockState({ rebaseInProgress: true });
      mockRemoteClonedRepoService.getRebaseOperationInfo.mockReturnValue(
        of(updatedState)
      );

      service.refreshState();

      expect(
        mockRemoteClonedRepoService.getRebaseOperationInfo
      ).toHaveBeenCalledWith(PROJECT_ID, CLONED_REPOSITORY_ID);
      expect(service.rebaseState()).toEqual(updatedState);
      expect(service.isRefreshing()).toBe(false);
    });

    it("should set error on failure", () => {
      mockRemoteClonedRepoService.getRebaseOperationInfo.mockReturnValue(
        throwError(() => new Error("Refresh failed"))
      );

      service.refreshState();

      expect(service.errorMessage()).toBe("Refresh failed");
      expect(service.isRefreshing()).toBe(false);
    });

    it("should not refresh if already refreshing", () => {
      service.isRefreshing.set(true);
      mockRemoteClonedRepoService.getRebaseOperationInfo.mockClear();

      service.refreshState();

      expect(
        mockRemoteClonedRepoService.getRebaseOperationInfo
      ).not.toHaveBeenCalled();
    });
  });
});
