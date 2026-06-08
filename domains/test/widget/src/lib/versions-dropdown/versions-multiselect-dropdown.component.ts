import {
  BaseMultiselectDropdown,
  MxevolveDropdownBackendStateProvider,
  MxEvolveDropdownState,
  MxevolveMultiselectDropdownComponent,
} from "@mxflow/ui/mxevolve-dropdown";
import { Version } from "@mxevolve/domains/test/model";
import { VersionService } from "@mxevolve/domains/test/data-access";
import { VersionsDropdownParams } from "./versions-dropdown-params";
import { Component, DestroyRef, inject, input } from "@angular/core";
import { VersionsDataProvider } from "./versions-data-provider";

@Component({
  selector: "mxevolve-versions-multiselect-dropdown",
  template: `
    <mxevolve-multiselect-dropdown
      [stateProvider]="stateProvider"
      [dataParams]="dataParams()"
    />
  `,
  imports: [MxevolveMultiselectDropdownComponent],
  providers: [VersionsDataProvider, VersionService],
})
export class VersionsMultiselectDropdownComponent extends BaseMultiselectDropdown<
  Version,
  VersionsDropdownParams
> {
  readonly dataParams = input.required<VersionsDropdownParams>();
  protected readonly stateProvider: MxEvolveDropdownState<
    Version,
    VersionsDropdownParams
  >;
  private readonly versionsDataProvider = inject(VersionsDataProvider);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    super();
    this.stateProvider = new MxevolveDropdownBackendStateProvider(
      this.versionsDataProvider,
      this.destroyRef
    );
  }
}
