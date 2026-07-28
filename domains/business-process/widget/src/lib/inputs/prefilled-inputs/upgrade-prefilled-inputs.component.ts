import { Component, computed, effect, inject, input } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { ProvidedInput } from "@mxevolve/domains/business-process/data-access";
import { EnvironmentDefinitionService } from "@mxevolve/domains/environment/data-access";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import { RepositoryService } from "@mxevolve/domains/scm/data-access";
import { ScenarioDefinitionService } from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { PrefilledInputsComponent } from "./prefilled-inputs.component";
import { buildUpgradePrefilledSections } from "./prefilled-inputs.types";
import { PrefilledInputLabelsResolverService } from "./prefilled-input-labels-resolver.service";

/**
 * Read-only display of the Upgrade definition's prefilled inputs (MX parameters
 * incl. the conversion factory product, configuration / branch parameters,
 * infrastructure groups, quality-gate + binary-conversion test scenarios and the
 * reference-environment parameters incl. its factory product). Shown on the
 * upgrade executor's collapsible "{name} Details" panel.
 */
@Component({
  selector: "mxevolve-upgrade-prefilled-inputs",
  template: `<mxevolve-prefilled-inputs
    [sections]="sections()"
    [loading]="labels.isLoading()"
  />`,
  imports: [PrefilledInputsComponent],
  providers: [
    PrefilledInputLabelsResolverService,
    InfraGroupService,
    RepositoryService,
    EnvironmentDefinitionService,
    ScenarioDefinitionService,
  ],
})
export class UpgradePrefilledInputsComponent {
  readonly providedInputs = input.required<readonly ProvidedInput[]>();
  readonly projectId = input<string>();

  private readonly labelsResolver = inject(PrefilledInputLabelsResolverService);
  private readonly toastMessageService = inject(ToastMessageService);

  readonly labels = rxResource({
    params: () => ({
      projectId: this.projectId(),
      providedInputs: this.providedInputs(),
    }),
    stream: ({ params }) =>
      this.labelsResolver.resolve(params.projectId, params.providedInputs),
    defaultValue: { labels: new Map<string, string>(), errors: [] },
  });

  readonly sections = computed(() => {
    const labels = this.labels.value().labels;
    return buildUpgradePrefilledSections(this.providedInputs()).map(
      (section) => ({
        ...section,
        rows: section.rows.map((row) => ({
          ...row,
          displayValue: labels.get(row.inputId),
        })),
      })
    );
  });

  constructor() {
    effect(() => {
      for (const error of this.labels.value().errors) {
        this.toastMessageService.showError(error);
      }
    });
  }
}
