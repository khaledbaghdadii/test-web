import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from "@angular/core";
import { rxResource, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  BuildAndTestProcessStateUpdaterService,
  BuildAndTestUserInputService,
} from "@mxevolve/domains/business-process/data-access";
import { BuildAndTestBackport } from "@mxevolve/domains/business-process/util";
import { CommitsService } from "@mxevolve/domains/scm/data-access";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { Confirmation, ConfirmationService } from "primeng/api";
import { Button } from "primeng/button";
import { ConfirmPopup } from "primeng/confirmpopup";
import { Message } from "primeng/message";
import { catchError, of } from "rxjs";

@Component({
  selector: "mxevolve-build-and-test-backport-manual-cherry-pick",
  imports: [Button, ConfirmPopup, Message, MxevolveIconComponent],
  providers: [
    BuildAndTestProcessStateUpdaterService,
    BuildAndTestUserInputService,
    CommitsService,
    ConfirmationService,
  ],
  templateUrl: "./build-and-test-backport-manual-cherry-pick.component.html",
  host: {
    style: "display: contents;",
  },
})
export class BuildAndTestBackportManualCherryPickComponent {
  readonly projectId = input.required<string>();
  readonly repositoryId = input.required<string>();
  readonly processId = input.required<string>();
  readonly backport = input.required<BuildAndTestBackport>();

  private readonly commitsService = inject(CommitsService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly stateUpdater = inject(BuildAndTestProcessStateUpdaterService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly userInputService = inject(BuildAndTestUserInputService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);

  readonly commitDifferences = rxResource({
    params: () => {
      const sourceBranch = this.backport().initializeDevelopmentState
        .cherryPickBranchName;
      const destinationBranch = this.backport().initializeDevelopmentState
        .destinationBranchName;
      if (!sourceBranch || !destinationBranch) return undefined;
      return {
        projectId: this.projectId(),
        repositoryId: this.repositoryId(),
        sourceBranch,
        destinationBranch,
      };
    },
    stream: ({ params }) =>
      this.commitsService.getCommitDifferences(params).pipe(
        catchError((error) => {
          this.toastMessageService.showError(error.message);
          return of([]);
        })
      ),
  });

  readonly cherryPickDoneDisabled = computed(() => {
    if (this.loading() || this.commitDifferences.isLoading()) return true;
    return (
      !this.commitDifferences.hasValue() ||
      this.commitDifferences.value().length === 0
    );
  });

  confirmCommitsCherryPicked(event: Event): void {
    this.confirmationService.confirm({
      target: event.target ?? undefined,
      message: "Are you sure you want to proceed?",
      icon: "pi pi-exclamation-triangle",
      accept: () => this.commitsCherryPicked(),
    } as Confirmation);
  }

  private commitsCherryPicked(): void {
    this.loading.set(true);
    this.userInputService
      .commitsCherryPicked({
        projectId: this.projectId(),
        processId: this.processId(),
        mergeConfigurationId: this.backport().mergeConfigurationId ?? "",
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.stateUpdater.reloadProcessDetails(
            this.processId(),
            this.projectId()
          );
        },
        error: (error) => {
          this.loading.set(false);
          this.toastMessageService.showError(error.message);
        },
      });
  }
}
