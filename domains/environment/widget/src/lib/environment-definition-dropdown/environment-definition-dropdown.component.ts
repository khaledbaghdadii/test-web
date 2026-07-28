import { Component, DestroyRef, computed, inject, input } from "@angular/core";
import {
  BaseSingleSelectDropdown,
  MxEvolveSingleSelectDropdownState,
  MxevolveSingleSelectDropdownComponent,
  MxevolveSingleSelectFrontendStateProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import type { EnvironmentDefinition } from "@mxevolve/domains/environment/data-access";
import { EnvironmentDefinitionService } from "@mxevolve/domains/environment/data-access";
import {
  EnvironmentDefinitionDataProvider,
  EnvironmentDefinitionParams,
} from "./environment-definition-data-provider";

@Component({
  selector: "mxevolve-environment-definition-dropdown",
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    EnvironmentDefinitionService,
    ...BaseSingleSelectDropdown.createProviders(
      EnvironmentDefinitionDropdownComponent
    ),
  ],
  template: `<mxevolve-single-select-dropdown
    [stateProvider]="stateProvider"
    [dataParams]="dataParams()"
    [config]="{ placeholder: placeholder(), showClear: true }"
    (selectionChange)="onSelectionChange($event)"
    (errorEvent)="onError($event)"
    data-testid="environment-definition-dropdown"
  />`,
})
export class EnvironmentDefinitionDropdownComponent extends BaseSingleSelectDropdown<
  EnvironmentDefinition,
  EnvironmentDefinitionParams
> {
  readonly projectId = input.required<string>();
  readonly placeholder = input<string>("Select environment definition");
  readonly inputId = input<string>();

  protected override readonly stateProvider: MxEvolveSingleSelectDropdownState<
    EnvironmentDefinition,
    EnvironmentDefinitionParams
  >;

  readonly dataParams = computed<EnvironmentDefinitionParams>(() => ({
    projectId: this.projectId(),
  }));

  private readonly destroyRef = inject(DestroyRef);
  private readonly environmentDefinitionService = inject(
    EnvironmentDefinitionService
  );

  constructor() {
    super();
    const dataProvider = new EnvironmentDefinitionDataProvider(
      this.environmentDefinitionService
    );
    this.stateProvider = new MxevolveSingleSelectFrontendStateProvider(
      dataProvider,
      this.destroyRef
    );
  }
}
