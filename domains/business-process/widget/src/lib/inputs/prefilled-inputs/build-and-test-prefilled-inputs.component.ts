import { Component, computed, effect, inject, input } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { ProvidedInput } from "@mxevolve/domains/business-process/data-access";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import { RepositoryService } from "@mxevolve/domains/scm/data-access";
import { ScenarioDefinitionService } from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { PrefilledInputsComponent } from "./prefilled-inputs.component";
import {
  BUILD_AND_TEST_PREFILLED_SECTIONS,
  buildPrefilledSections,
} from "./prefilled-inputs.types";
import { PrefilledInputLabelsResolverService } from "./prefilled-input-labels-resolver.service";

/**
 * Read-only display of the Build & Test definition's prefilled inputs
 * (repository, configuration branches, build scenario, infra groups).
 */
@Component({
  selector: "mxevolve-build-and-test-prefilled-inputs",
  template: `<mxevolve-prefilled-inputs
    [sections]="sections()"
    [loading]="labels.isLoading()"
  />`,
  imports: [PrefilledInputsComponent],
  providers: [
    PrefilledInputLabelsResolverService,
    InfraGroupService,
    RepositoryService,
    ScenarioDefinitionService,
  ],
})
export class BuildAndTestPrefilledInputsComponent {
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
    return buildPrefilledSections(
      this.providedInputs(),
      BUILD_AND_TEST_PREFILLED_SECTIONS
    ).map((section) => ({
      ...section,
      rows: section.rows.map((row) => ({
        ...row,
        displayValue: labels.get(row.inputId),
      })),
    }));
  });

  constructor() {
    effect(() => {
      for (const error of this.labels.value().errors) {
        this.toastMessageService.showError(error);
      }
    });
  }
}
