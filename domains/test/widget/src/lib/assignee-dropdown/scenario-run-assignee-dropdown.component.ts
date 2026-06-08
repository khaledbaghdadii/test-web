import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from "@angular/core";
import {
  MxevolveSingleSelectBackendStateProvider,
  MxevolveSingleSelectDropdownComponent,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  ScenarioDefinitionService,
  ScenarioRunService,
  TestDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { User, UserService } from "@mxflow/features/user";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import {
  AssigneeDataParams,
  AssigneeDataProvider,
} from "./assignee-data-provider";

@Component({
  selector: "mxevolve-scenario-run-assignee-dropdown",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    ScenarioRunService,
    ScenarioDefinitionService,
    UserService,
    TestDefinitionService,
  ],
  template: `
    @if (bpcIds()) {
    <mxevolve-single-select-dropdown
      [stateProvider]="stateProvider"
      [dataParams]="{ projectId: projectId(), bpcIds: bpcIds()! }"
      [config]="{
        placeholder: 'Select assignee',
        lazyLoad: true,
        showClear: true,
        size: 'small'
      }"
      (selectionChange)="onSelectionChange($event)"
      (errorEvent)="onError($event)"
    />
    }
  `,
})
export class ScenarioRunAssigneeDropdownComponent implements OnInit {
  projectId = input.required<string>();
  scenarioDefinitionId = input.required<string>();
  contextId = input.required<string>();
  subContextId = input<string>();
  selectedAssigneeId = input<string | null>();

  assigneeChanged = output<string | null>();

  bpcIds = signal<string[] | null>(null);

  readonly stateProvider: MxevolveSingleSelectBackendStateProvider<
    User,
    AssigneeDataParams
  >;

  private readonly scenarioRunService = inject(ScenarioRunService);
  private readonly scenarioDefinitionService = inject(
    ScenarioDefinitionService
  );
  private readonly userService = inject(UserService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  private previousAssigneeId: string | null = null;

  constructor() {
    const dataProvider = new AssigneeDataProvider(this.userService);
    this.stateProvider = new MxevolveSingleSelectBackendStateProvider(
      dataProvider,
      this.destroyRef
    );
  }

  ngOnInit(): void {
    this.scenarioDefinitionService
      .getScenarioDefinitionById(this.scenarioDefinitionId(), this.projectId())
      .subscribe({
        next: (scenarioDefinition) => {
          this.bpcIds.set(scenarioDefinition.bpcs);
          this.previousAssigneeId = this.selectedAssigneeId() ?? null;

          const selectedId = this.selectedAssigneeId();
          if (selectedId) {
            this.userService
              .getUserById(selectedId, this.projectId())
              .subscribe({
                next: (user) => this.stateProvider.setSelectedItem(user),
              });
          }
        },
        error: () => {
          this.toastMessageService.showError(
            "Failed to load assignee options."
          );
        },
      });
  }

  onSelectionChange(user: User | null): void {
    const newAssigneeId = user?.id ?? null;
    if (newAssigneeId === this.previousAssigneeId) return;

    this.scenarioRunService
      .updateAssignee(this.projectId(), {
        assignee: newAssigneeId,
        scenarioDefinitionId: this.scenarioDefinitionId(),
        contextId: this.contextId(),
        subContextId: this.subContextId(),
      })
      .subscribe({
        next: () => {
          this.previousAssigneeId = newAssigneeId;
          this.assigneeChanged.emit(newAssigneeId);
        },
        error: () => {
          this.toastMessageService.showError("Failed to update assignee.");
          if (this.previousAssigneeId) {
            this.userService
              .getUserById(this.previousAssigneeId, this.projectId())
              .subscribe({
                next: (user) => this.stateProvider.setSelectedItem(user),
              });
          } else {
            this.stateProvider.setSelectedItem(null);
          }
        },
      });
  }

  onError(message: string): void {
    this.toastMessageService.showError(message);
  }
}
