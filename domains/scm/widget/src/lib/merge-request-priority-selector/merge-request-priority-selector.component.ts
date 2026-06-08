import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  FormsModule,
} from "@angular/forms";

import { RadioButtonModule } from "primeng/radiobutton";
import { Button } from "primeng/button";
import {
  MergeRequestPriority,
  MergeRequestService,
} from "@mxevolve/domains/scm/data-access";
import { MergeRequestPrioritySelectorModel } from "./model/merge-request-priority-selector-model";
import { ToastMessageService } from "@mxflow/ui/alert";

@Component({
  selector: "mxevolve-merge-request-priority-selector",
  standalone: true,
  templateUrl: "./merge-request-priority-selector.html",
  imports: [ReactiveFormsModule, FormsModule, RadioButtonModule, Button],
  providers: [MergeRequestService],
})
export class MergeRequestPrioritySelectorComponent {
  readonly mergeRequestPriority = MergeRequestPriority;

  readonly mergeRequest = input.required<MergeRequestPrioritySelectorModel>();

  private readonly mergeRequestService = inject(MergeRequestService);
  private readonly toastMessageService = inject(ToastMessageService);

  readonly isLoading = signal(false);

  readonly initialPriority = computed(
    () => this.mergeRequest().mergeRequestPriority
  );

  priorityForm = new FormGroup<MergeRequestPrioritySelectorForm>({
    priority: new FormControl<MergeRequestPriority>(
      MergeRequestPriority.MEDIUM,
      { nonNullable: true }
    ),
  });

  constructor() {
    effect(() => {
      this.priorityForm.patchValue({
        priority: this.mergeRequest().mergeRequestPriority,
      });
    });
  }

  savePriority(): void {
    const selected = this.priorityForm.value.priority;
    if (!selected) return;

    const { projectId, id } = this.mergeRequest();
    this.isLoading.set(true);

    this.mergeRequestService
      .updateMergeRequestPriority(projectId, id, selected)
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.toastMessageService.showSuccess("Priority updated successfully");
        },
        error: (error) => {
          this.isLoading.set(false);
          this.toastMessageService.showError(
            error.message ?? "Failed to update priority"
          );
        },
      });
  }

  hasChanges(): boolean {
    return this.priorityForm.value.priority !== this.initialPriority();
  }
}

export interface MergeRequestPrioritySelectorForm {
  priority: FormControl<MergeRequestPriority>;
}
