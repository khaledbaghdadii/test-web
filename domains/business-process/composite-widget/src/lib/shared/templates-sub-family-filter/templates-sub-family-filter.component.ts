import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
} from "@angular/core";
import { Button } from "primeng/button";
import { InputText } from "primeng/inputtext";
import {
  MxEvolveSingleSelectDropdownState,
  MxevolveSingleSelectDropdownComponent,
  MxevolveSingleSelectFrontendStateProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { of } from "rxjs";
import {
  SubFamilyOption,
  SubFamilyOptionsParams,
} from "../derive-sub-families";

@Component({
  selector: "mxevolve-templates-sub-family-filter",
  templateUrl: "./templates-sub-family-filter.component.html",
  imports: [
    MxevolveSingleSelectDropdownComponent,
    InputText,
    Button,
    MxevolveIconComponent,
  ],
})
export class TemplatesSubFamilyFilterComponent {
  readonly options = input.required<readonly SubFamilyOption[]>();
  readonly searchTerm = input.required<string>();
  readonly subFamilyChange = output<SubFamilyOption | null>();
  readonly searchChange = output<string>();

  private readonly destroyRef = inject(DestroyRef);

  protected readonly dataParams = computed<SubFamilyOptionsParams>(() => ({
    options: this.options(),
  }));

  protected readonly stateProvider: MxEvolveSingleSelectDropdownState<
    SubFamilyOption,
    SubFamilyOptionsParams
  >;

  constructor() {
    this.stateProvider = new MxevolveSingleSelectFrontendStateProvider(
      {
        fetchData: (params: SubFamilyOptionsParams) => of([...params.options]),
        toDropdownOption: (item: SubFamilyOption) => ({
          label: item.label,
          value: item,
        }),
        getItemId: (item: SubFamilyOption) => item.value,
      },
      this.destroyRef
    );
  }
}
