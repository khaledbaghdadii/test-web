import { Component, DestroyRef, inject, input, output } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Dialog } from "primeng/dialog";
import { Button } from "primeng/button";
import { InputText } from "primeng/inputtext";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { WhitespaceValidators } from "@mxflow/validator";
import { ToastMessageService } from "@mxflow/ui/alert";
import { Toast } from "primeng/toast";
import { Tooltip } from "primeng/tooltip";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import { ChangedFilesListComponent } from "../changed-files-list/changed-files-list.component";
import { ScmFailureReason } from "../error-handling/model/scm-failure-reason";
import { ScmOperationError } from "../error-handling/model/scm-operation-error";
import { AuthenticationService } from "@mxflow/core/auth";

@Component({
  selector: "mxevolve-push-changes-dialog",
  standalone: true,
  imports: [
    Dialog,
    Button,
    InputText,
    ReactiveFormsModule,
    Toast,
    Tooltip,
    ChangedFilesListComponent,
  ],
  providers: [RemoteClonedRepositoryService, ToastMessageService],
  templateUrl: "./push-changes-dialog.component.html",
  styles: [
    `
      :host ::ng-deep .push-in-progress .p-dialog-close-button {
        opacity: 0.4;
        pointer-events: none;
        cursor: not-allowed;
      }
    `,
  ],
})
export class PushChangesDialogComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly projectId = input.required<string>();
  readonly repositoryId = input.required<string>();
  readonly branchName = input.required<string>();
  readonly disabled = input(false);
  readonly disabledTooltip = input("No modified files to push");
  readonly filesToCommit = input(["."]);

  readonly pushSucceeded = output<void>();
  private readonly authService = inject(AuthenticationService);

  private readonly remoteClonedRepositoryService = inject(
    RemoteClonedRepositoryService
  );
  private readonly messageService = inject(ToastMessageService);

  protected readonly maxCommitMessageLength = 50;
  protected pushInProgress: boolean = false;
  protected dialogVisible: boolean = false;
  protected commitMessageFormControl = new FormControl<string | null>(null, [
    Validators.required,
    Validators.maxLength(this.maxCommitMessageLength),
    WhitespaceValidators.notBlank(),
  ]);
  userEmail: string;
  userName: string;

  constructor() {
    this.destroyRef.onDestroy(() => this.messageService.clearErrors());
    this.userEmail = this.authService.getUserMail();
    this.userName = this.authService.getUsername();
  }

  openDialog(): void {
    this.dialogVisible = true;
  }

  cancelDialog(): void {
    this.dialogVisible = false;
    this.commitMessageFormControl.reset();
  }

  submitPush(): void {
    if (this.commitMessageFormControl.valid) {
      this.pushInProgress = true;
      this.remoteClonedRepositoryService
        .commitChanges({
          commitMessage: this.commitMessageFormControl.value!,
          projectId: this.projectId(),
          remoteClonedRepositoryId: this.repositoryId(),
          branchName: this.branchName(),
          fileAndDirectoryPathsToCommit: this.filesToCommit(),
          commitAuthorDetails: {
            username: this.userName,
            email: this.userEmail,
          },
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.pushInProgress = false;
            this.dialogVisible = false;
            this.commitMessageFormControl.reset();
            this.messageService.showSuccess("Changes pushed successfully.");
            this.pushSucceeded.emit();
          },
          error: (error) => {
            this.pushInProgress = false;
            this.messageService.showError(this.buildErrorMessage(error));
          },
        });
    } else {
      this.commitMessageFormControl.markAsDirty();
    }
  }

  private buildErrorMessage(error: unknown): string {
    if (error instanceof ScmOperationError) {
      if (error.failureReason === ScmFailureReason.INVALID_JIRA_ID) {
        return "Push rejected: A Jira ID is required in the commit message. Please include a valid Jira issue key (e.g., VAL-1234).";
      }
      if (error.failureReason === ScmFailureReason.COMMIT_CONFLICT) {
        return "Push failed due to conflicts. Please resolve the conflicts and try again.";
      }
    }
    return `Failed to push changes.`;
  }
}
