import { Component, inject, Input, OnDestroy } from "@angular/core";
import { MxtestConflictResolverComponent } from "@mxtest/git-resolver";
import {
  catchError,
  debounceTime,
  EMPTY,
  Subject,
  switchMap,
  takeUntil,
} from "rxjs";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository.service";
import { ToastMessageService } from "@mxflow/ui/alert";
import { MxflowSpinnerModule } from "@mxflow/ui/utils";
import { Dialog } from "primeng/dialog";

@Component({
  selector: "mxevolve-conflict-resolver",
  standalone: true,
  imports: [MxtestConflictResolverComponent, MxflowSpinnerModule, Dialog],
  providers: [RemoteClonedRepositoryService, ToastMessageService],
  templateUrl: "./conflict-resolver.component.html",
})
export class ConflictResolverComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly saveSubject$ = new Subject<{
    projectId: string;
    remoteClonedRepositoryId: string;
    content: string;
  }>();

  private readonly remoteClonedRepositoryService = inject(
    RemoteClonedRepositoryService
  );
  private readonly messageService = inject(ToastMessageService);

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) remoteClonedRepositoryId: string;
  @Input({ required: true }) conflictResultsString: string;
  @Input() disabled: boolean = false;

  isLoading = false;
  dialogVisible = false;

  constructor() {
    this.initializeSavePipeline();
  }

  openDialog(): void {
    this.dialogVisible = true;
  }

  onConflictsResultUpdated(updatedConflictsResult: string): void {
    this.conflictResultsString = updatedConflictsResult;
    this.saveSubject$.next({
      projectId: this.projectId,
      remoteClonedRepositoryId: this.remoteClonedRepositoryId,
      content: updatedConflictsResult,
    });
  }

  onApplyAllChanges(): void {
    this.isLoading = true;
    this.remoteClonedRepositoryService
      .applyFunctionalFixes({
        projectId: this.projectId,
        remoteClonedRepositoryId: this.remoteClonedRepositoryId,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.messageService.showSuccess(
            "Apply changes requested successfully."
          );
        },
        error: (error) => {
          this.isLoading = false;
          this.messageService.showError(
            "Failed to apply changes: " + error.message
          );
        },
      });
  }

  private initializeSavePipeline(): void {
    this.saveSubject$
      .pipe(
        debounceTime(300),
        switchMap(({ projectId, remoteClonedRepositoryId, content }) => {
          this.isLoading = true;
          return this.remoteClonedRepositoryService
            .saveBundleChanges({
              projectId,
              remoteClonedRepositoryId,
              payload: { content },
            })
            .pipe(
              catchError((error) => {
                this.isLoading = false;
                this.messageService.showError(
                  "Failed to save conflict changes: " + error.message
                );
                return EMPTY;
              })
            );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
