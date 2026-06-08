import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { ScenarioDefinitionService } from "../../../definition/scenario-definition/scenario-definition.service";
import { ScenarioExecutionService } from "../scenario-execution.service";
import { UpdateAssigneeRequest } from "../request/update-assignee-request";
import { User, UserService } from "@mxflow/features/user";
import { concatMap, Subject, takeUntil } from "rxjs";
import { SkeletonModule } from "primeng/skeleton";
import { FormsModule } from "@angular/forms";

import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { StreamsService } from "@mxflow/features/streams";
import { EnvironmentService } from "@mxflow/features/environment";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";

@Component({
  standalone: true,
  selector: "mxevolve-assignee-input",
  templateUrl: "./assignee-input.component.html",
  imports: [SelectModule, SkeletonModule, FormsModule, InputTextModule],
  providers: [
    ScenarioExecutionService,
    ScenarioDefinitionService,
    UserService,
    TestDefinitionService,
    StreamsService,
    EnvironmentService,
  ],
})
export class AssigneeInputComponent implements OnInit, OnDestroy {
  private scenarioExecutionService = inject(ScenarioExecutionService);
  private userService = inject(UserService);
  private scenarioService = inject(ScenarioDefinitionService);

  private readonly destroy$ = new Subject();
  @Input() isLoading = false;
  @Input() projectId: string;
  @Input() contextId: string;
  @Input() subContextId?: string;
  @Input() scenarioDefinitionId: string;
  @Input() selectedAssigneeId: string | null;
  @Output() errorMessageEmitter = new EventEmitter<string>();
  @Output() setAssigneeEventEmitter = new EventEmitter<string | null>();
  @Output() doneLoadingUsers = new EventEmitter();
  users: User[] = [];
  isLoadingUsers = false;
  previousSelectedAssignee: string | null;
  bpcIds: string[] = [];
  @ViewChild("filterInput") filterInput!: ElementRef;

  ngOnInit(): void {
    this.isLoadingUsers = true;
    this.scenarioService
      .getScenarioDefinitionById(this.scenarioDefinitionId, this.projectId)
      .pipe(
        takeUntil(this.destroy$),
        concatMap((scenarioDefinition) => {
          return this.userService.getUsersByBpcIds(
            scenarioDefinition.bpcs.map((bpc) => bpc.id),
            this.projectId,
            1000,
            0,
            ""
          );
        })
      )
      .subscribe({
        next: (usersPage) => {
          this.users = usersPage.users;
          this.previousSelectedAssignee = this.selectedAssigneeId;
        },
        error: (error) => {
          this.errorMessageEmitter.emit(error.message);
        },
      })
      .add(() => {
        this.isLoadingUsers = false;
        this.doneLoadingUsers.emit();
      });
  }

  onOpenDropdown() {
    if (this.filterInput?.nativeElement) {
      this.filterInput.nativeElement.focus();
    }
  }

  changeAssignee(assigneeId: string | null) {
    if (!this.isSameUser(assigneeId, this.previousSelectedAssignee)) {
      this.scenarioExecutionService
        .updateAssignee(this.getUpdateAssigneeRequest(assigneeId))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.setAssigneeEventEmitter.emit(assigneeId),
          error: (error) => this.errorMessageEmitter.emit(error.message),
        });
    }
    this.previousSelectedAssignee = assigneeId;
  }

  isSameUser(
    assignee: string | null,
    previousSelectedAssignee: string | null
  ): boolean {
    return assignee === previousSelectedAssignee;
  }

  private getUpdateAssigneeRequest(
    newAssignee: string | null
  ): UpdateAssigneeRequest {
    return {
      projectId: this.projectId,
      contextId: this.contextId,
      subContextId: this.subContextId,
      scenarioDefinitionId: this.scenarioDefinitionId,
      assignee: newAssignee,
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
