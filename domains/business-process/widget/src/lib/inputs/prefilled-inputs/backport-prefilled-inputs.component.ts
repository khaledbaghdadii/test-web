import { Component, computed, effect, inject, input } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { ProvidedInput } from "@mxevolve/domains/business-process/data-access";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import {
  MergeConfigurationService,
  RepositoryService,
} from "@mxevolve/domains/scm/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { PrefilledInputsComponent } from "./prefilled-inputs.component";
import {
  BACKPORT_PREFILLED_SECTIONS,
  buildPrefilledSections,
} from "./prefilled-inputs.types";
import { PrefilledInputLabelsResolverService } from "./prefilled-input-labels-resolver.service";

/**
 * Read-only display of the Backport definition's prefilled inputs (repository,
 * destination merge configuration, build-and-test infra group).
 */
@Component({
  selector: "mxevolve-backport-prefilled-inputs",
  template: `<mxevolve-prefilled-inputs
    [sections]="sections()"
    [loading]="labels.isLoading()"
  />`,
  imports: [PrefilledInputsComponent],
  providers: [
    PrefilledInputLabelsResolverService,
    InfraGroupService,
    RepositoryService,
    MergeConfigurationService,
  ],
})
export class BackportPrefilledInputsComponent {
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
      BACKPORT_PREFILLED_SECTIONS
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
