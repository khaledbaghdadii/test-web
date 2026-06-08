import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";

import { Toast } from "primeng/toast";
import { Button } from "primeng/button";
import { LaunchTechnicalReseedModalComponent } from "../modal/launch-technical-reseed-modal.component";
import { ToastMessageService } from "@mxflow/ui/alert";
import { skipWhile, Subject, takeUntil } from "rxjs";
import { Store } from "@ngrx/store";
import { ExecutionGroupsState } from "../../store/execution-group/execution-group.state";
import { selectExecutionGroup } from "../../store/execution-group/execution-groups.selectors";
import { Tooltip } from "primeng/tooltip";

@Component({
  selector: "mxevolve-launch-technical-reseed-button",
  imports: [Toast, Button, LaunchTechnicalReseedModalComponent, Tooltip],
  templateUrl: "./launch-technical-reseed.component.html",
  standalone: true,
})
export class LaunchTechnicalReseedComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();

  @Input({ required: true }) executionGroupId: string;
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) infraGroup: string;
  @Input({ required: true }) targetBranch: string;

  @Output() reseedLaunchedSuccessfully = new EventEmitter<void>();

  disabled: boolean = false;
  tooltip: string = "";
  modalOpen: boolean = false;

  toastService = inject(ToastMessageService);
  store = inject(Store<ExecutionGroupsState>);

  ngOnInit(): void {
    this.store
      .select(
        selectExecutionGroup({
          projectId: this.projectId,
          executionGroupId: this.executionGroupId,
        })
      )
      .pipe(
        skipWhile((executionGroup) => executionGroup === undefined),
        takeUntil(this.destroy$)
      )
      .subscribe((executionGroup) => {
        executionGroup = executionGroup!;
        if (!executionGroup.launchesAllowed) {
          this.disabled = true;
          this.tooltip = executionGroup.reason!;
        }
      });
  }

  openTechnicalReseedModal() {
    this.modalOpen = true;
  }

  operationLaunched(event: { error?: string; summary?: string }) {
    if (event?.error && event?.summary) {
      this.toastService.showError(event?.error, event?.summary);
    } else {
      this.toastService.showSuccess(
        "Technical reseed operation launched successfully",
        "Success"
      );
      this.reseedLaunchedSuccessfully.emit();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
