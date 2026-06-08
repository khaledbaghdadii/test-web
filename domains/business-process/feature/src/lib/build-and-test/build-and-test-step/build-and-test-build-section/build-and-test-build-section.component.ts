import { Component, computed, input } from "@angular/core";
import { Chip } from "primeng/chip";
import { ButtonModule } from "primeng/button";
import { Message } from "primeng/message";
import { TooltipModule } from "primeng/tooltip";
import { EnvironmentStatusPanelComponent } from "@mxevolve/domains/environment/widget";
import { BusinessProcessContentContainerComponent } from "@mxevolve/domains/business-process/ui";
import { Development } from "@mxevolve/domains/scm/data-access";
import { MergeRequestCommitsComponent } from "@mxevolve/domains/scm/widget";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

/**
 * Build panel of the Build & Test step.
 *
 * Renders the build environment row, Jira story chips, and commit difference
 * table. The right-side scenario details icon follows the Figma action row; the
 * repush action is intentionally left out until its backend/source parity is
 * wired.
 */
@Component({
  selector: "mxevolve-build-and-test-build-section",
  templateUrl: "./build-and-test-build-section.component.html",
  imports: [
    Chip,
    ButtonModule,
    Message,
    TooltipModule,
    EnvironmentStatusPanelComponent,
    BusinessProcessContentContainerComponent,
    MergeRequestCommitsComponent,
    MxevolveIconComponent,
  ],
  host: {
    style: "display: contents;",
  },
})
export class BuildAndTestBuildSectionComponent {
  readonly projectId = input.required<string>();
  /** Jira/user story ids from the run input (e.g. ["VAL-125", "VAL-127"]). */
  readonly storyIds = input<string[]>([]);
  /** Optional until the build environment id is threaded through the model. */
  readonly environmentId = input<string>();
  readonly showEnvironmentWaitingMessage = input<boolean>(false);
  /** Hide the Open Config Editor action in automerge runs (parent decides). */
  readonly automerge = input<boolean>(false);
  readonly development = input<Development>();
  readonly latestScenarioExecutionId = input<string>();
  readonly scenarioDetailsDisabled = input<boolean>(false);

  readonly hasStories = computed(() => this.storyIds().length > 0);
  readonly showConfigEditor = computed(() => !this.automerge());
  readonly scenarioDetailsLink = computed(() => {
    const scenarioExecutionId = this.latestScenarioExecutionId();
    return scenarioExecutionId
      ? `/app/${this.projectId()}/test/execution/details/${scenarioExecutionId}`
      : undefined;
  });
}
