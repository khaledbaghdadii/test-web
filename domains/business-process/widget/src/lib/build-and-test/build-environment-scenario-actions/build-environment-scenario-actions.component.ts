import { Component, computed, inject, input, output } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { TooltipModule } from "primeng/tooltip";
import {
  EnvironmentService,
  ManagementRequestService,
} from "@mxevolve/domains/environment/data-access";
import {
  ScenarioDefinitionService,
  ScenarioRunService,
  TestDefinitionService,
  TestUnitService,
} from "@mxevolve/domains/test/data-access";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import { GroupService, UserService } from "@mxevolve/domains/user/data-access";
import { StreamsService } from "@mxflow/features/streams";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import {
  RerunScenarioButtonComponent,
  SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE,
  ScenarioDetailsLinkButtonComponent,
  ScenarioRunsPanelFacadeService,
} from "@mxevolve/domains/test/widget";

const PREPARE_BUILD_ENVIRONMENT_SUB_CONTEXT_ID = "PREPARE_BUILD_ENVIRONMENT";

/**
 * Action cluster for the build-environment scenario shown in the Build & Test
 * step's environment status panel (Figma node 10887-92683).
 *
 * Renders, in order: a red priority_high indicator when the scenario failed, a
 * repush (rerun) button, and a scenario-details link. All scenario data is
 * sourced from the existing {@link ScenarioRunsPanelFacadeService} so no fetch
 * logic is duplicated.
 */
@Component({
  selector: "mxevolve-build-environment-scenario-actions",
  imports: [
    TooltipModule,
    MxevolveIconComponent,
    RerunScenarioButtonComponent,
    ScenarioDetailsLinkButtonComponent,
  ],
  providers: [
    ScenarioRunsPanelFacadeService,
    ScenarioRunService,
    ScenarioDefinitionService,
    TestDefinitionService,
    EnvironmentService,
    ManagementRequestService,
    UserService,
    GroupService,
    TestUnitService,
    StreamsService,
  ],
  template: `
    @if (head(); as head) { @if (scenarioFailed()) {
    <mxevolve-icon
      name="priority_high"
      size="md"
      color="var(--p-red-500)"
      pTooltip="Scenario failed"
      tooltipPosition="top"
      ariaLabel="Scenario failed"
      data-testid="scenario-failed-indicator"
    />
    }
    <mxevolve-rerun-scenario-button
      [projectId]="projectId()"
      [scenarioRunId]="head.id"
      [factoryProductId]="head.factoryProductId"
      [executionGroupId]="head.executionGroupId"
      [repushable]="head.repushable ?? true"
      [warningMessage]="head.warningMessage"
      [warningMessageMap]="warningMessageMap()"
      (scenarioRerun)="scenarioRerun.emit()"
    />
    @if (head.id; as scenarioRunId) {
    <mxevolve-scenario-details-link-button
      [projectId]="projectId()"
      [scenarioRunId]="scenarioRunId"
      [disabled]="scenarioDetailsDisabled()"
    />
    } }
  `,
  host: {
    class: "inline-flex items-center",
  },
})
export class BuildEnvironmentScenarioActionsComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly subContextId = input<string>(
    PREPARE_BUILD_ENVIRONMENT_SUB_CONTEXT_ID
  );
  readonly scenarioDetailsDisabled = input<boolean>(false);
  /**
   * Maps execution-group permission warning codes to friendly messages for
   * the repush button's warning banner. Defaults to the same shared map used
   * by the Test section's scenario runs (`SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE`)
   * so both flows render consistent warning text; overridable by callers.
   */
  readonly warningMessageMap = input<Record<string, string>>(
    SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE
  );

  readonly scenarioRerun = output<void>();

  private readonly facade = inject(ScenarioRunsPanelFacadeService);

  private readonly scenarioRunsResource = rxResource({
    params: () => ({
      projectId: this.projectId(),
      contextId: this.processId(),
      subContextId: this.subContextId(),
    }),
    stream: ({ params }) =>
      this.facade.fetch({
        projectId: params.projectId,
        contextId: params.contextId,
        subContextId: params.subContextId,
      }),
  });

  readonly head = computed(() => this.scenarioRunsResource.value()?.[0]?.head);

  readonly scenarioFailed = computed(
    () => this.head()?.status === ScenarioRunStatus.FAILED
  );
}
