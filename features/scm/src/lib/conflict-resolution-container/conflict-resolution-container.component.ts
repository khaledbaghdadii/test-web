import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { catchError, concatMap, EMPTY, finalize, Observable, tap } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";
import { GitFileStatusCode } from "../remote-cloned-repository/model/git-file-status-code.enum";
import {
  ConflictResolutionDecision,
  ConflictResolutionDecisionType,
} from "../conflict-resolution-buttons/model/conflict-resolution-decision.model";
import { ConflictResolutionButtonsComponent } from "../conflict-resolution-buttons/conflict-resolution-buttons.component";
import { TextConflictEditorComponent } from "../text-conflict-editor/text-conflict-editor.component";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";

const EDITABLE_CONFLICT_STATUSES: ReadonlySet<GitFileStatusCode> = new Set([
  GitFileStatusCode.BOTH_MODIFIED,
  GitFileStatusCode.BOTH_ADDED,
  GitFileStatusCode.INDEX_MODIFIED,
]);

const DELETE_MESSAGES = {
  success: "File deleted successfully",
  error: "Failed to delete file",
} as const;

const WRITE_AFTER_DECISION_MESSAGES = {
  success: "File resolved successfully",
  error: "Failed to resolve file",
} as const;

const WRITE_AFTER_EDITOR_CHANGE_MESSAGES = {
  success: "Changes saved successfully",
  error: "Failed to save changes",
} as const;

interface NotificationMessages {
  readonly success: string;
  readonly error: string;
}

@Component({
  selector: "mxevolve-conflict-resolution-container",
  standalone: true,
  imports: [ConflictResolutionButtonsComponent, TextConflictEditorComponent],
  providers: [RemoteClonedRepositoryService],
  templateUrl: "./conflict-resolution-container.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConflictResolutionContainerComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly remoteClonedRepositoryService = inject(
    RemoteClonedRepositoryService
  );
  private readonly toastMessageService = inject(ToastMessageService);

  readonly projectId = input.required<string>();
  readonly remoteClonedRepositoryId = input.required<string>();
  readonly filePath = input.required<string>();
  readonly language = input("plaintext");
  readonly rawConflictContent = input.required<string>();
  readonly gitFileStatusCode = input.required<GitFileStatusCode>();
  readonly resolvedContentByDecision = input<
    Partial<Record<ConflictResolutionDecisionType, string>>
  >({});

  readonly decisionTaken = output<ConflictResolutionDecision>();
  readonly resolvedContent = output<string>();
  readonly isResolvingEditorContent = signal(false);

  readonly shouldRenderTextConflictEditor = computed(() =>
    EDITABLE_CONFLICT_STATUSES.has(this.gitFileStatusCode())
  );

  onDecisionSelected(decision: ConflictResolutionDecision): void {
    const { decision: decisionType, filePath: decisionFilePath } = decision;

    if (decisionType === ConflictResolutionDecisionType.DELETE_FILE) {
      this.runWithNotification(
        this.deleteAndStageFile(decisionFilePath),
        DELETE_MESSAGES
      ).subscribe(() => this.decisionTaken.emit(decision));
      return;
    }

    const fileContent = this.resolvedContentByDecision()[decisionType];
    if (fileContent === undefined) {
      return;
    }

    this.runWithNotification(
      this.writeAndStageFile(decisionFilePath, fileContent),
      WRITE_AFTER_DECISION_MESSAGES
    ).subscribe(() => this.decisionTaken.emit(decision));
  }

  onEditorContentResolved(fileContent: string): void {
    this.isResolvingEditorContent.set(true);
    this.runWithNotification(
      this.writeAndStageFile(this.filePath(), fileContent),
      WRITE_AFTER_EDITOR_CHANGE_MESSAGES
    )
      .pipe(finalize(() => this.isResolvingEditorContent.set(false)))
      .subscribe(() => this.resolvedContent.emit(fileContent));
  }

  private deleteAndStageFile(filePath: string): Observable<void> {
    return this.remoteClonedRepositoryService
      .deleteRemoteFile({
        projectId: this.projectId(),
        remoteClonedRepositoryId: this.remoteClonedRepositoryId(),
        filePath,
        checkRepositoryAvailability: false,
      })
      .pipe(
        concatMap(() =>
          this.remoteClonedRepositoryService.stageFileChanges({
            projectId: this.projectId(),
            remoteClonedRepositoryId: this.remoteClonedRepositoryId(),
            filePaths: [filePath],
            stageAll: false,
          })
        )
      );
  }

  private writeAndStageFile(
    filePath: string,
    fileContent: string
  ): Observable<void> {
    return this.remoteClonedRepositoryService
      .writeRemoteFileContent({
        projectId: this.projectId(),
        remoteClonedRepositoryId: this.remoteClonedRepositoryId(),
        filePath,
        fileContent,
        checkRepositoryAvailability: false,
      })
      .pipe(
        concatMap(() =>
          this.remoteClonedRepositoryService.stageFileChanges({
            projectId: this.projectId(),
            remoteClonedRepositoryId: this.remoteClonedRepositoryId(),
            filePaths: [filePath],
            stageAll: false,
          })
        )
      );
  }

  private runWithNotification(
    source: Observable<void>,
    messages: NotificationMessages
  ): Observable<void> {
    return source.pipe(
      tap({
        next: () => this.toastMessageService.showSuccess(messages.success),
        error: (err: Error) =>
          this.toastMessageService.showError(messages.error, err.message),
      }),
      catchError(() => EMPTY),
      takeUntilDestroyed(this.destroyRef)
    );
  }
}
