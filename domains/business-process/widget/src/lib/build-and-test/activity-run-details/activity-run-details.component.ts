import { Component, computed, inject, input } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { catchError, of } from "rxjs";
import { Chip } from "primeng/chip";
import { Divider } from "primeng/divider";
import { BuildAndTestProcessExecution } from "@mxevolve/domains/business-process/util";
import { JiraDetailsService } from "@mxevolve/domains/business-process/data-access";
import { JiraIssueUrlResolverPipe } from "@mxflow/features/business-process";
import { RepositoryNameComponent } from "@mxevolve/domains/scm/widget";
import { InfraGroupNameComponent } from "@mxevolve/domains/infra/widget";
import { ScenarioNameComponent } from "@mxevolve/domains/test/widget";
import { ShowMoreLessTextComponent } from "@mxflow/ui/utils";

@Component({
  selector: "mxevolve-build-and-test-activity-run-details",
  imports: [
    Chip,
    Divider,
    RepositoryNameComponent,
    InfraGroupNameComponent,
    ScenarioNameComponent,
    ShowMoreLessTextComponent,
    JiraIssueUrlResolverPipe,
  ],
  templateUrl: "./activity-run-details.component.html",
})
export class BuildAndTestActivityRunDetailsComponent {
  readonly execution = input.required<BuildAndTestProcessExecution>();

  private readonly jiraDetailsService = inject(JiraDetailsService);

  readonly description = computed(() => {
    const description = this.execution().description;
    return description?.trim() ? description : undefined;
  });

  /** Prepare Build Environment is skipped for this run. */
  readonly skipEnvironmentDeployment = computed(
    () => this.execution().input.buildEnvironment.skipEnvironmentDeployment
  );

  /** The build scenario definition is not applicable when the environment deployment is skipped. */
  readonly scenarioDefinitionId = computed(() =>
    this.skipEnvironmentDeployment()
      ? undefined
      : this.execution().input.buildEnvironment.scenarioDefinitionId
  );

  /** Jira/user story ids linked to the run. */
  readonly storyIds = computed(() => this.execution().input.userStoryIds ?? []);

  private readonly jiraDetailsResource = rxResource({
    params: () => ({ projectId: this.execution().projectId }),
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
}
