import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { WhitespaceValidators } from "@mxflow/validator";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { Toast } from "primeng/toast";
import {
  GetDestinationBranchNamePipe,
  MergeRequestReviewer,
  ReviewersAutoCompleteComponent,
} from "@mxflow/features/scm-management";
import { CiProcessExecutionService } from "../../service/ci-process-execution.service";

interface Reviewer {
  name: string;
  displayName: string;
}

@Component({
  selector: "mxevolve-ci-process-merge-request-reopen",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    ReviewersAutoCompleteComponent,
    MandatoryFieldModule,
    Toast,
    GetDestinationBranchNamePipe,
  ],
  providers: [MessageService],
  templateUrl: "./build-and-test-merge-request-reopen.component.html",
})
export class BuildAndTestMergeRequestReopenComponent
  implements OnInit, OnDestroy
{
  private readonly destroy$ = new Subject<void>();
  private readonly ciProcessService = inject(CiProcessExecutionService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly formBuilder = inject(FormBuilder);

  @Input() areMergeRequestDetailsEditable = false;
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) processId: string;
  @Input() actionsDisabled: boolean;
  @Input() mergeRequestTitle: string;
  @Input() mergeRequestReviewers: MergeRequestReviewer[] = [];
  @Input() mergeConfigurationId: string;

  @Output() reopened = new EventEmitter<void>();

  isModalVisible = false;
  loading = false;
  dialogLoading = false;
  form: FormGroup;
  reviewerFormControl: FormControl;

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onReopenButtonClick(): void {
    if (this.areMergeRequestDetailsEditable) {
      this.isModalVisible = true;
    } else {
      this.loading = true;
      this.callReopenService();
    }
  }

  onDialogReopen(): void {
    if (this.form.valid && !this.dialogLoading) {
      this.dialogLoading = true;
      this.callReopenService(
        this.form.value.mergeRequestTitle,
        (this.form.value.reviewer as Reviewer[]).map(
          (reviewer) => reviewer.name
        )
      );
    }
  }

  onDialogCancel(): void {
    this.isModalVisible = false;
  }

  private callReopenService(title?: string, reviewers?: string[]): void {
    this.ciProcessService
      .reopenMergeRequest({
        projectId: this.projectId,
        ciProcessExecutionId: this.processId,
        title,
        reviewers,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isModalVisible = false;
          this.loading = false;
          this.dialogLoading = false;
          this.reopened.emit();
        },
        error: (error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";

          this.toastMessageService.showError(message);
          this.loading = false;
          this.dialogLoading = false;
        },
      });
  }

  private initializeForm(): void {
    this.reviewerFormControl = new FormControl<Reviewer[]>(
      this.mergeRequestReviewers.map((reviewer) => ({
        name: reviewer.name,
        displayName: reviewer.displayName,
      }))
    );
    this.form = this.formBuilder.group({
      mergeRequestTitle: [
        this.mergeRequestTitle,
        [Validators.required, WhitespaceValidators.notBlank()],
      ],
      reviewer: this.reviewerFormControl,
    });
  }
}
