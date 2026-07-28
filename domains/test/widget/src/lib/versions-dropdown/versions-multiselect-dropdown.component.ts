import {
  BaseMultiselectDropdown,
  MxevolveDropdownBackendStateProvider,
  MxEvolveDropdownState,
  MxevolveMultiselectDropdownComponent,
} from "@mxflow/ui/mxevolve-dropdown";
import { Version } from "@mxevolve/domains/test/model";
import { VersionService } from "@mxevolve/domains/test/data-access";
import { VersionsDropdownParams } from "./versions-dropdown-params";
import { Component, DestroyRef, effect, inject, input } from "@angular/core";
import { VersionsDataProvider } from "./versions-data-provider";

@Component({
  selector: "mxevolve-versions-multiselect-dropdown",
  template: `
    <mxevolve-multiselect-dropdown
      [stateProvider]="stateProvider"
      [dataParams]="dataParams()"
      (selectionChange)="onSelectionChange($event)"
      (errorEvent)="onError($event)"
    />
  `,
  imports: [MxevolveMultiselectDropdownComponent],
  providers: [
    VersionsDataProvider,
    VersionService,
    ...BaseMultiselectDropdown.createProviders(
      VersionsMultiselectDropdownComponent
    ),
  ],
})
export class VersionsMultiselectDropdownComponent extends BaseMultiselectDropdown<
  Version,
  VersionsDropdownParams
> {
  readonly dataParams = input.required<VersionsDropdownParams>();

  readonly prefilledVersions = input<Version[]>();
  readonly stateProvider: MxEvolveDropdownState<
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

    effect(() => {
      const prefilled = this.prefilledVersions();
      if (prefilled !== undefined) {
        this.stateProvider.setSelectedItems(prefilled);
        this.onSelectionChange(prefilled);
      }
    });
  }

  override writeValue(value: Version[] | null): void {
    this.stateProvider.setSelectedItems(value ?? []);
  }
}
