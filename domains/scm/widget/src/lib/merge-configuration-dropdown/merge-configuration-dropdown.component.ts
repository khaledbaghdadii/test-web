import { Component, DestroyRef, inject, input } from "@angular/core";
import {
  MergeConfiguration,
  MergeConfigurationService,
} from "@mxevolve/domains/scm/data-access";
import { MergeConfigurationDataProvider } from "./data-provider/merge-configuration-data-provider";
import {
  MxevolveSingleSelectDropdownComponent,
  BaseSingleSelectDropdown,
  MxevolveSingleSelectBackendStateProvider,
  MxEvolveSingleSelectDropdownState,
} from "@mxflow/ui/mxevolve-dropdown";

@Component({
  selector: "mxevolve-merge-configuration-dropdown",
  templateUrl: "./merge-configuration-dropdown.component.html",
  standalone: true,
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    ...BaseSingleSelectDropdown.createProviders(
      MergeConfigurationDropdownComponent
    ),
    MergeConfigurationService,
  ],
})
export class MergeConfigurationDropdownComponent extends BaseSingleSelectDropdown<
  MergeConfiguration,
  { projectId: string; repositoryId: string }
> {
  readonly projectId = input.required<string>();
  readonly repositoryId = input.required<string>();

  protected override stateProvider: MxEvolveSingleSelectDropdownState<
    MergeConfiguration,
    { projectId: string; repositoryId: string }
  >;

  constructor() {
    super();
    const destroyRef = inject(DestroyRef);
    const mergeConfigurationService = inject(MergeConfigurationService);
    const dataProvider = new MergeConfigurationDataProvider(
      mergeConfigurationService
    );

    this.stateProvider = new MxevolveSingleSelectBackendStateProvider(
      dataProvider,
      destroyRef
    );
  }

  override writeValue(value: MergeConfiguration | null): void {
    this.stateProvider.setSelectedItem(value);
  }
}
