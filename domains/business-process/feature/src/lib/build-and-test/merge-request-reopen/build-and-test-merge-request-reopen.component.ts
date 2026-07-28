import {
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { BuildAndTestUserInputService } from "@mxevolve/domains/business-process/data-access";
import { Reviewer } from "@mxevolve/domains/scm/data-access";
import { ReviewersAutoCompleteComponent } from "@mxevolve/domains/scm/widget";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";

@Component({
  selector: "mxevolve-build-and-test-merge-request-reopen",
  templateUrl: "./build-and-test-merge-request-reopen.component.html",
  imports: [
    Button,
    Dialog,
    InputText,
    ReactiveFormsModule,
    ReviewersAutoCompleteComponent,
  ],
  providers: [BuildAndTestUserInputService],
})
export class BuildAndTestMergeRequestReopenComponent {
  readonly areMergeRequestDetailsEditable = input(false);
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly repositoryId = input.required<string>();
  readonly actionsDisabled = input(false);
  readonly developmentId = input<string>();
  readonly destinationBranch = input<string>();
  readonly mergeRequestTitle = input<string>("");
  readonly mergeRequestReviewers = input<Reviewer[]>([]);

  readonly reopened = output<void>();

  private readonly userInputService = inject(BuildAndTestUserInputService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly dialogVisible = signal(false);
  readonly loading = signal(false);

  readonly form = new FormGroup({
    mergeRequestTitle: new FormControl<string>("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(255),
        Validators.pattern(/\S/),
      ],
    }),
    reviewers: new FormControl<Reviewer[]>([], { nonNullable: true }),
  });

  onReopenButtonClick(): void {
    if (this.areMergeRequestDetailsEditable()) {
      this.form.reset({
        mergeRequestTitle: this.mergeRequestTitle(),
        reviewers: this.mergeRequestReviewers(),
      });
      this.dialogVisible.set(true);
      return;
    }
    this.loading.set(true);
    this.callReopenService();
  }

  onDialogReopen(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.callReopenService(
      this.form.controls.mergeRequestTitle.value,
      this.form.controls.reviewers.value.map((reviewer) => reviewer.name)
    );
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }

  private callReopenService(title?: string, reviewers?: string[]): void {
    this.userInputService
      .reopenMergeRequest({
        projectId: this.projectId(),
        processId: this.processId(),
        title,
        reviewers,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.dialogVisible.set(false);
          this.reopened.emit();
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.toastMessageService.showError(
            error instanceof Error
              ? error.message
              : "An unexpected error occurred"
          );
        },
      });
  }
}
