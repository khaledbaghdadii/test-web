import {
  Component,
  EventEmitter,
  Input,
  Output,
  Signal,
  inject,
} from "@angular/core";
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  FormsModule,
} from "@angular/forms";

import { RadioButtonModule } from "primeng/radiobutton";
import { Button } from "primeng/button";
import { MergeRequestPriority } from "../merge-request/model/merge-request";
import { MergeRequestPrioritySelectorModel } from "./model/merge-request-priority-selector-model";
import { MergeRequestPrioritySelectorStateService } from "./state-service/merge-request-priority-selector-state.service";
import { toObservable, takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: "mxevolve-merge-request-priority-selector",
  standalone: true,
  templateUrl: "./merge-request-priority-selector.html",
  imports: [ReactiveFormsModule, FormsModule, RadioButtonModule, Button],
  providers: [MergeRequestPrioritySelectorStateService],
})
export class MergeRequestPrioritySelectorComponent {
  readonly mergeRequestPriority = MergeRequestPriority;

  priorityForm = new FormGroup<MergeRequestPrioritySelectorForm>({
    priority: new FormControl<MergeRequestPriority>(
      MergeRequestPriority.MEDIUM,
      { nonNullable: true }
    ),
  });

  private readonly stateService = inject(
    MergeRequestPrioritySelectorStateService
  );

  @Output() errorEventEmitter = new EventEmitter<string>();
  @Output() successEventEmitter = new EventEmitter<string>();

  readonly errorMessageSignal = this.stateService.errorMessageSignal;
  readonly isLoadingDataSignal = this.stateService.isLoadingDataSignal;

  private initialPriority: MergeRequestPriority | null = null;

  @Input() set mergeRequest(value: MergeRequestPrioritySelectorModel) {
    if (!value) return;

    this.initialPriority = value.mergeRequestPriority;

    this.priorityForm.patchValue({
      priority: value.mergeRequestPriority,
    });

    this.stateService.setProjectIdSubject(value.projectId);
    this.stateService.setMergeRequestIdSubject(value.id);
  }

  constructor() {
    this.subscribeToSignals();
  }

  savePriority(): void {
    const selected = this.priorityForm.value.priority;
    if (!selected) return;

    this.stateService.setMergeRequestPrioritySubject(selected, () => {
      this.successEventEmitter.emit("Priority updated successfully");
      this.initialPriority = selected;
    });
  }

  hasChanges(): boolean {
    return this.priorityForm.value.priority !== this.initialPriority;
  }

  private subscribeToSignals(): void {
    this.handleSignal(this.errorMessageSignal, (message) => {
      if (message) this.errorEventEmitter.emit(message);
    });
  }

  private handleSignal<T>(
    signal: Signal<T>,
    callback: (value: T) => void
  ): void {
    toObservable(signal).pipe(takeUntilDestroyed()).subscribe(callback);
  }
}

export interface MergeRequestPrioritySelectorForm {
  priority: FormControl<MergeRequestPriority>;
}
