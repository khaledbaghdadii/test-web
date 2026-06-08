import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import {
  ScenarioDefinitionApiResponse,
  ScenarioDefinitionService,
  ScenarioRunService,
  TestDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { ButtonModule } from "primeng/button";
import { Checkbox } from "primeng/checkbox";
import { DialogModule } from "primeng/dialog";
import { Message } from "primeng/message";
import { SelectModule } from "primeng/select";
import { TooltipModule } from "primeng/tooltip";
import { catchError, finalize, of } from "rxjs";
import { SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE } from "../scenario-execution-group-permission-warning-message";

const BUILD_AND_TEST_SUB_CONTEXT_ID = "BUILD_AND_TEST";
const SCENARIO_EXECUTION_REJECTION_REASON_MESSAGE: Record<string, string> = {
  LIMIT_REACHED: "Concurrent scenario executions limit has been reached",
  OUTER_CONTEXT_DISALLOWED_ACTIONS: "",
  UNDERWAY_SCENARIO: "",
};

/**
 * Build & Test specific TPK launcher.
 * The backend contract is still scenario-definition based; the migrated CI UI
 * labels the selected scenario definition as a TPK.
 */
@Component({
  selector: "mxevolve-build-and-test-run-tpk",
  imports: [
    ButtonModule,
    Checkbox,
    DialogModule,
    FormsModule,
    Message,
    MxevolveIconComponent,
    ReactiveFormsModule,
    SelectModule,
    TooltipModule,
  ],
  providers: [
    ScenarioDefinitionService,
    ScenarioRunService,
    TestDefinitionService,
  ],
  templateUrl: "./build-and-test-run-tpk.component.html",
})
export class BuildAndTestRunTpkComponent {
  readonly projectId = input.required<string>();
  readonly branchName = input.required<string>();
  readonly executionGroupId = input.required<string>();
  readonly machineGroupId = input<string>();

  readonly scenarioPushed = output<void>();
  readonly errorOccurred = output<string>();

  private readonly scenarioDefinitionService = inject(ScenarioDefinitionService);
  private readonly scenarioRunService = inject(ScenarioRunService);

  readonly subContextId = BUILD_AND_TEST_SUB_CONTEXT_ID;
  readonly warningMessageMap =
    SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE;

  readonly runTpkForm = new FormGroup({
    scenarioDefinitionId: new FormControl<string | null>(
      null,
      Validators.required
    ),
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

  readonly scenarioDefinitionsResource = rxResource({
    params: () => ({ projectId: this.projectId() }),
    stream: ({ params }) =>
      this.scenarioDefinitionService
        .getScenarioDefinitions(params.projectId)
        .pipe(
          catchError((error) => {
            this.errorOccurred.emit(error.message);
            return of([]);
          })
        ),
  });

  readonly scenarioDefinitions = computed<ScenarioDefinitionApiResponse[]>(
    () => this.scenarioDefinitionsResource.value() ?? []
  );

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
      .map((warning) => this.warningMessageMap[warning] ?? "")
      .filter(Boolean)
      .join("\n")
  );

  readonly selectionDisabled = computed(
    () =>
      this.permissionResource.isLoading() ||
      this.scenarioDefinitionsResource.isLoading() ||
      this.runLoading() ||
      !this.isExecutionAllowed()
  );

  readonly runDisabled = computed(
    () => this.runTpkForm.invalid || this.selectionDisabled()
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
      this.runTpkForm.controls.scenarioDefinitionId.getRawValue();
    if (!scenarioDefinitionId) return;

    this.runLoading.set(true);
    this.scenarioRunService
      .runScenario(this.projectId(), {
        scenarioDefinitionId,
        subContextId: this.subContextId,
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
      })
      .pipe(finalize(() => this.runLoading.set(false)))
      .subscribe({
        next: () => {
          this.permissionResource.reload();
          this.scenarioPushed.emit();
          this.runTpkForm.reset();
          this.closeModal();
        },
        error: (error) => {
          this.errorOccurred.emit(error.message);
          this.runTpkForm.reset();
          this.closeModal();
        },
      });
  }
}
