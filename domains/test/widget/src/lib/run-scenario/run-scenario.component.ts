import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { rxResource, toSignal } from "@angular/core/rxjs-interop";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import {
  ScenarioRunService,
  TestDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { ButtonModule } from "primeng/button";
import { Checkbox } from "primeng/checkbox";
import { DialogModule } from "primeng/dialog";
import { Message } from "primeng/message";
import { TooltipModule } from "primeng/tooltip";
import { catchError, finalize, of } from "rxjs";
import { ScenarioDefinitionDropdownComponent } from "../scenario-definition-dropdown/scenario-definition-dropdown.component";

const SCENARIO_EXECUTION_REJECTION_REASON_MESSAGE: Record<string, string> = {
  LIMIT_REACHED: "Concurrent scenario executions limit has been reached",
  OUTER_CONTEXT_DISALLOWED_ACTIONS: "",
  UNDERWAY_SCENARIO: "",
};

export interface MXCodeConfigurationAudit {
  readonly enabled: boolean;
  readonly baselineCommit?: string;
}

/**
 * Reusable scenario launcher widget.
 *
 * The backend contract is scenario-definition based; the migrated CI UI labels
 * the selected scenario definition as a scenario. The execution `subContextId`
 * and the permission `warningMessageMap` are configurable so the widget is not
 * tied to a specific business process.
 */
@Component({
  selector: "mxevolve-run-scenario",
  imports: [
    ButtonModule,
    Checkbox,
    DialogModule,
    FormsModule,
    Message,
    MxevolveIconComponent,
    ReactiveFormsModule,
    ScenarioDefinitionDropdownComponent,
    TooltipModule,
  ],
  providers: [ScenarioRunService, TestDefinitionService],
  templateUrl: "./run-scenario.component.html",
})
export class RunScenarioComponent {
  readonly projectId = input.required<string>();
  readonly branchName = input.required<string>();
  readonly executionGroupId = input.required<string>();
  readonly machineGroupId = input<string>();
  readonly subContextId = input<string>("BUILD_AND_TEST");
  readonly warningMessageMap = input<Record<string, string>>();
  readonly configurationAudit = input<MXCodeConfigurationAudit>();

  readonly scenarioPushed = output<void>();
  readonly errorOccurred = output<string>();

  private readonly scenarioRunService = inject(ScenarioRunService);

  readonly runScenarioForm = new FormGroup({
    scenarioDefinitionId: new FormControl<string | null>(
      null,
      Validators.required
    ),
  });
  private readonly formStatus = toSignal(this.runScenarioForm.statusChanges, {
    initialValue: this.runScenarioForm.status,
  });
  readonly showModal = signal(false);
  readonly keepServices = signal(false);
  readonly runLoading = signal(false);

  readonly permissionResource = rxResource({
    params: () => ({
      projectId: this.projectId(),
      executionGroupId: this.executionGroupId(),
    }),
    stream: ({ params }) =>
      this.scenarioRunService
        .isExecutionAllowed(params.projectId, params.executionGroupId)
        .pipe(
          catchError((error) => {
            this.errorOccurred.emit(error.message);
            return of({
              actionAllowed: false,
              rejectionReasons: [],
              warnings: [],
            });
          })
        ),
  });

  readonly isExecutionAllowed = computed(
    () => this.permissionResource.value()?.actionAllowed ?? false
  );

  readonly rejectionReasonMessage = computed(() =>
    (this.permissionResource.value()?.rejectionReasons ?? [])
      .map(
        (reason) => SCENARIO_EXECUTION_REJECTION_REASON_MESSAGE[reason] ?? ""
      )
      .join("")
  );

  readonly warningMessage = computed(() =>
    (this.permissionResource.value()?.warnings ?? [])
      .map((warning) => this.warningMessageMap()?.[warning] ?? "")
      .filter(Boolean)
      .join("\n")
  );

  readonly selectionDisabled = computed(
    () =>
      this.permissionResource.isLoading() ||
      this.runLoading() ||
      !this.isExecutionAllowed()
  );

  readonly runDisabled = computed(
    () => this.formStatus() === "INVALID" || this.selectionDisabled()
  );

  runScenarioExecution(): void {
    if (this.runDisabled()) return;
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.keepServices.set(false);
  }

  runScenario(): void {
    const scenarioDefinitionId =
      this.runScenarioForm.controls.scenarioDefinitionId.getRawValue();
    if (!scenarioDefinitionId) return;

    this.runLoading.set(true);
    this.scenarioRunService
      .runScenario(this.projectId(), {
        scenarioDefinitionId,
        subContextId: this.subContextId(),
        branchName: this.branchName(),
        commitId: null,
        executionGroupId: this.executionGroupId(),
        machineGroupId: this.machineGroupId(),
        disableKeepExecution: true,
        stopServices: !this.keepServices(),
        disableConfigurationEditor: false,
        supportReconActivities: false,
        validationScopeEnabled: false,
        incidentEnabled: false,
        configurationAuditing: this.configurationAudit(),
      })
      .pipe(finalize(() => this.runLoading.set(false)))
      .subscribe({
        next: () => {
          this.permissionResource.reload();
          this.scenarioPushed.emit();
          this.runScenarioForm.reset();
          this.closeModal();
        },
        error: (error) => {
          this.errorOccurred.emit(error.message);
          this.runScenarioForm.reset();
          this.closeModal();
        },
      });
  }
}
