import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { delay, finalize, switchMap } from "rxjs";

import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import { RebaseState } from "../remote-cloned-repository/response/get-rebase-operation-info-api-response";
import {
  RemoteClonedRepositoryOperationStatus,
  RemoteClonedRepositoryOperationType,
} from "../remote-cloned-repository/response/remote-cloned-repository-operation-api-response";
import { FunctionalTechnicalRebaseApiRequest } from "../remote-cloned-repository/request/functional-technical-rebase-api-request";
import { ScmManagementService } from "../scm-management.service";
import { RebaseWorkspaceState } from "./model/rebase-state";
import { RebaseOperation } from "./model/rebase-operation";

interface RebaseConfig {
  projectId: string;
  clonedRepositoryId: string;
  projectRepositoryId: string;
  sourceBranchName: string;
}

interface FinishedRebaseAttempt {
  functionalCheck: RebaseOperation;
  technicalRebase: RebaseOperation | null;
}

@Injectable()
export class RebaseWorkspaceStateService {
  private readonly remoteClonedRepositoryService = inject(
    RemoteClonedRepositoryService
  );
  private readonly scmManagementService = inject(ScmManagementService);
  private readonly destroyRef = inject(DestroyRef);

  private config!: RebaseConfig;

  readonly isLoading = signal(true);
  readonly isRefreshing = signal(false);
  readonly isRebaseStarting = signal(false);
  readonly rebaseState = signal<RebaseWorkspaceState | null>(null);
  readonly targetBranchName = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly isRebaseInProgress = computed(
    () => this.rebaseState()?.rebaseInProgress ?? false
  );

  private readonly lastFinishedAttempt = computed(() =>
    this.findLatestFinishedRebaseAttempt()
  );

  readonly lastOperation = computed(() => {
    const lastFinishedAttempt = this.lastFinishedAttempt();
    if (!lastFinishedAttempt) {
      return null;
    }
    return (
      lastFinishedAttempt.technicalRebase ?? lastFinishedAttempt.functionalCheck
    );
  });

  readonly isLastOperationSuccess = computed(() => {
    const lastFinishedAttempt = this.lastFinishedAttempt();
    if (!lastFinishedAttempt) {
      return false;
    }

    const { functionalCheck, technicalRebase } = lastFinishedAttempt;
    if (
      functionalCheck.status === RemoteClonedRepositoryOperationStatus.FAILED ||
      technicalRebase?.status === RemoteClonedRepositoryOperationStatus.FAILED
    ) {
      return false;
    }

    return (
      functionalCheck.status ===
        RemoteClonedRepositoryOperationStatus.SUCCEEDED &&
      technicalRebase?.status ===
        RemoteClonedRepositoryOperationStatus.SUCCEEDED
    );
  });

  readonly isInMxtestConflict = computed(
    () =>
      this.rebaseState()?.rebaseState ===
      RebaseState.MXTEST_FUNCTIONAL_REBASE_IN_CONFLICT
  );

  readonly isInTechnicalConflict = computed(
    () =>
      this.rebaseState()?.rebaseState ===
      RebaseState.TECHNICAL_REBASE_IN_CONFLICT
  );

  readonly bundleContent = computed(
    () => this.rebaseState()?.bundleContent ?? ""
  );

  readonly isButtonDisabled = computed(
    () =>
      this.isRebaseInProgress() ||
      this.isRebaseStarting() ||
      this.isRefreshing() ||
      !this.targetBranchName()
  );

  readonly displaySourceBranch = computed(
    () =>
      this.rebaseState()?.sourceBranchName ||
      this.config?.sourceBranchName ||
      ""
  );

  readonly displayTargetBranch = computed(
    () => this.rebaseState()?.targetBranchName || this.targetBranchName() || ""
  );

  initialize(config: RebaseConfig): void {
    this.config = config;
    this.resolveTargetBranchAndLoadState();
  }

  refreshState(): void {
    if (this.isRefreshing()) return;

    this.isRefreshing.set(true);
    this.errorMessage.set(null);

    this.remoteClonedRepositoryService
      .getRebaseOperationInfo(
        this.config.projectId,
        this.config.clonedRepositoryId
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isRefreshing.set(false))
      )
      .subscribe({
        next: (state) => this.rebaseState.set(state),
        error: (error) =>
          this.errorMessage.set(
            error?.message || "Failed to refresh rebase state"
          ),
      });
  }

  startRebase(): void {
    const targetBranch = this.targetBranchName();
    if (this.isButtonDisabled() || !targetBranch) return;

    this.isRebaseStarting.set(true);
    this.errorMessage.set(null);

    const request: FunctionalTechnicalRebaseApiRequest = {
      projectId: this.config.projectId,
      remoteClonedRepositoryId: this.config.clonedRepositoryId,
      payload: {
        sourceBranchName: this.config.sourceBranchName,
        targetBranchName: targetBranch,
      },
    };

    this.remoteClonedRepositoryService
      .startRemoteClonedRepositoryFunctionalTechnicalRebase(request)
      .pipe(
        delay(1500),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isRebaseStarting.set(false))
      )
      .subscribe({
        next: () => this.loadRebaseState(),
        error: (error) => {
          this.errorMessage.set(error?.message || "Failed to start rebase");
          this.loadRebaseState();
        },
      });
  }

  private resolveTargetBranchAndLoadState(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.scmManagementService
      .getDevelopments(this.config.projectId, {
        repositoryId: this.config.projectRepositoryId,
        name: this.config.sourceBranchName,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((developments) => {
          const match = developments.content.find(
            (dev) => dev.name === this.config.sourceBranchName
          );
          this.targetBranchName.set(match?.source ?? null);

          return this.remoteClonedRepositoryService.getRebaseOperationInfo(
            this.config.projectId,
            this.config.clonedRepositoryId
          );
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (state) => this.rebaseState.set(state),
        error: (error) =>
          this.errorMessage.set(
            error?.message || "Failed to load rebase information"
          ),
      });
  }

  private loadRebaseState(): void {
    this.isLoading.set(true);

    this.remoteClonedRepositoryService
      .getRebaseOperationInfo(
        this.config.projectId,
        this.config.clonedRepositoryId
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (state) => this.rebaseState.set(state),
        error: (error) =>
          this.errorMessage.set(
            error?.message || "Failed to load rebase state"
          ),
      });
  }

  private findLatestFinishedRebaseAttempt(): FinishedRebaseAttempt | null {
    const operations = this.rebaseState()?.rebaseOperations;
    if (!operations?.length) {
      return null;
    }

    const finishedRelevant =
      this.getFinishedRebaseOperationsSortedByEndDate(operations);

    for (let i = 0; i < finishedRelevant.length; i++) {
      const op = finishedRelevant[i];

      if (
        op.type ===
        RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS
      ) {
        if (op.status === RemoteClonedRepositoryOperationStatus.FAILED) {
          return {
            functionalCheck: op,
            technicalRebase: null,
          };
        }

        continue;
      }

      const functionalCheck = finishedRelevant
        .slice(i + 1)
        .find(
          (candidate) =>
            candidate.type ===
            RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS
        );

      if (!functionalCheck) {
        continue;
      }

      return {
        functionalCheck,
        technicalRebase: op,
      };
    }

    return null;
  }

  private getFinishedRebaseOperationsSortedByEndDate(
    operations: RebaseOperation[]
  ): RebaseOperation[] {
    return operations
      .filter(
        (op) =>
          !!op.endedOn &&
          (op.type ===
            RemoteClonedRepositoryOperationType.CHECK_FUNCTIONAL_CONFLICTS ||
            op.type === RemoteClonedRepositoryOperationType.TECHNICAL_REBASE)
      )
      .sort(
        (a, b) =>
          new Date(b.endedOn as string).getTime() -
          new Date(a.endedOn as string).getTime()
      );
  }
}
