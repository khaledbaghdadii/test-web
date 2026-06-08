import { Component, DestroyRef, inject, input } from "@angular/core";
import {
  MergeConfiguration,
  MergeConfigurationService,
} from "@mxflow/features/scm-management";
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
  projectId = input.required<string>();
  repositoryId = input.required<string>();

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
}
