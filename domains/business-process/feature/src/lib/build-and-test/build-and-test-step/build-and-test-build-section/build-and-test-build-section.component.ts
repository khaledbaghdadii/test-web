import { Component, computed, inject, input, output } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { catchError, of } from "rxjs";
import { Chip } from "primeng/chip";
import { ButtonModule } from "primeng/button";
import { Message } from "primeng/message";
import { EnvironmentStatusPanelComponent } from "@mxevolve/domains/environment/widget";
import { BusinessProcessContentContainerComponent } from "@mxevolve/domains/business-process/ui";
import {
  Development,
  MergeRequestOverview,
} from "@mxevolve/domains/scm/data-access";
import { MergeRequestCommitsComponent } from "@mxevolve/domains/scm/widget";
import { BuildEnvironmentScenarioActionsComponent } from "@mxevolve/domains/business-process/widget";
import { JiraDetailsService } from "@mxevolve/domains/business-process/data-access";
import { JiraIssueUrlResolverPipe } from "@mxflow/features/business-process";

/**
 * Build panel of the Build & Test step.
 *
 * Renders the build environment row, Jira story chips, and commit difference
 * table. The environment action row hosts the scenario repush controls (repush
 * button, failure indicator and scenario details link) via the dedicated
 * {@link BuildEnvironmentScenarioActionsComponent}.
 */
@Component({
  selector: "mxevolve-build-and-test-build-section",
  templateUrl: "./build-and-test-build-section.component.html",
  imports: [
    Chip,
    ButtonModule,
    Message,
    EnvironmentStatusPanelComponent,
    BusinessProcessContentContainerComponent,
    MergeRequestCommitsComponent,
    BuildEnvironmentScenarioActionsComponent,
    JiraIssueUrlResolverPipe,
  ],
  host: {
    style: "display: contents;",
  },
})
export class BuildAndTestBuildSectionComponent {
  readonly projectId = input.required<string>();
  /** Process (execution) id used to resolve the build-environment scenario. */
  readonly processId = input.required<string>();
  /** Jira/user story ids from the run input (e.g. ["VAL-125", "VAL-127"]). */
  readonly storyIds = input<string[]>([]);
  /** Optional until the build environment id is threaded through the model. */
  readonly environmentId = input<string>();
  readonly showEnvironmentWaitingMessage = input<boolean>(false);
  /** Hide the Open Config Editor action in automerge runs (parent decides). */
  readonly automerge = input<boolean>(false);
  readonly development = input<Development>();
  /** Latest merge request for the branch (drives the PR/merge commits table). */
  readonly mergeRequest = input<MergeRequestOverview>();
  readonly scenarioDetailsDisabled = input<boolean>(false);

  readonly scenarioRerun = output<void>();

  private readonly jiraDetailsService = inject(JiraDetailsService);

  private readonly jiraDetailsResource = rxResource({
    params: () => ({ projectId: this.projectId() }),
    stream: ({ params }) =>
      this.jiraDetailsService
        .getJiraDetails(params.projectId)
        .pipe(
          catchError(() =>
            of({ projectId: "", jiraProjectId: "", jiraBaseUrl: "" })
          )
        ),
  });

  /** Jira base URL used to build clickable links for the story chips. */
  readonly jiraBaseUrl = computed(
    () => this.jiraDetailsResource.value()?.jiraBaseUrl
  );

  readonly showConfigEditor = computed(() => !this.automerge());
}
