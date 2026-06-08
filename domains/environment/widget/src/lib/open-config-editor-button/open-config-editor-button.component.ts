import { Component, computed, inject, input, OnInit, signal } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { FeatureFlagResolver } from "@mxflow/feature-flags";

const WORKSPACE_CONFIGURATION_EDITOR_UI_FEATURE_FLAG =
  "workspace-configuration-editor-ui";

/**
 * Open Config Editor action button. Self-gates on the
 * `workspace-configuration-editor-ui` feature flag (renders nothing when the
 * flag is off). Disabled unless the environment is READY. Opens the workspace
 * configuration editor in a new tab.
 *
 * Ported to signals from the legacy
 * EnvironmentWorkspaceConfigurationEditorButtonComponent.
 *
 * NOTE: hiding in automerge mode is the responsibility of the consumer (it
 * simply does not project this button in automerge runs).
 */
@Component({
  selector: "mxevolve-open-config-editor-button",
  imports: [ButtonModule, TooltipModule],
  templateUrl: "./open-config-editor-button.component.html",
  providers: [FeatureFlagResolver],
  host: {
    style: "display: contents;",
  },
})
export class OpenConfigEditorButtonComponent implements OnInit {
  readonly projectId = input.required<string>();
  readonly environmentId = input.required<string>();
  readonly status = input.required<EnvironmentStatus>();

  private readonly featureFlagResolver = inject(FeatureFlagResolver);

  readonly featureEnabled = signal(false);

  readonly disabled = computed(
    () => this.status() !== EnvironmentStatus.READY
  );

  readonly tooltip = computed(() =>
    this.disabled() ? "Environment is not in a ready state." : undefined
  );

  ngOnInit(): void {
    this.featureFlagResolver
      .isFeatureEnabled(
        this.projectId(),
        WORKSPACE_CONFIGURATION_EDITOR_UI_FEATURE_FLAG
      )
      .then((enabled: boolean) => this.featureEnabled.set(enabled))
      .catch(() => this.featureEnabled.set(false));
  }

  openConfigurationEditor(): void {
    window.open(this.configurationEditorUrl(), "_blank");
  }

  private configurationEditorUrl(): string {
    return `/app/${this.projectId()}/environments/${this.environmentId()}/configuration-editor`;
  }
}
