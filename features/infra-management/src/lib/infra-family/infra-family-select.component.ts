import { Component, DestroyRef, inject, input } from "@angular/core";
import { InfraFamily } from "./model/infra-family.model";
import { InfraFamilyService } from "./infra-family.service";
import { InfraFamilyDataProvider } from "./data-provider/infra-family-data-provider";
import {
  MxevolveSingleSelectDropdownComponent,
  BaseSingleSelectDropdown,
  MxevolveSingleSelectFrontendStateProvider,
  MxEvolveSingleSelectDropdownState,
} from "@mxflow/ui/mxevolve-dropdown";

/**
 * Single-select dropdown component for selecting an Infra Family
 * Uses frontend filtering (all data loaded once, filtered on client)
 */
@Component({
  selector: "mxevolve-infra-family-select",
  templateUrl: "./infra-family-select.component.html",
  standalone: true,
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    ...BaseSingleSelectDropdown.createProviders(InfraFamilySelectComponent),
    InfraFamilyService,
  ],
})
export class InfraFamilySelectComponent extends BaseSingleSelectDropdown<
  InfraFamily,
  { projectId: string }
> {
  /**
   * The project ID to fetch infra families for
   */
  projectId = input.required<string>();

  protected override stateProvider: MxEvolveSingleSelectDropdownState<
    InfraFamily,
    { projectId: string }
  >;
  destroyRef = inject(DestroyRef);
  infraFamilyService = inject(InfraFamilyService);
  dataProvider = new InfraFamilyDataProvider(this.infraFamilyService);

  constructor() {
    super();

    this.stateProvider = new MxevolveSingleSelectFrontendStateProvider(
      this.dataProvider,
      this.destroyRef
    );
  }
}
