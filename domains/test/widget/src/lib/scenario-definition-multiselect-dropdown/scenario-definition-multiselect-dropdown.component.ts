import {
  Component,
  DestroyRef,
  effect,
  forwardRef,
  inject,
  input,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import {
  MxEvolveDropdownState,
  MxevolveMultiselectDropdownComponent,
  MxevolveMultiselectFrontendStateProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  ScenarioDefinitionApiResponse,
  ScenarioDefinitionService,
} from "@mxevolve/domains/test/data-access";
import {
  ScenarioDefinitionDataProvider,
  ScenarioDefinitionParams,
} from "../scenario-definition-dropdown/scenario-definition-data-provider";

/**
 * Multi-select scenario-definition dropdown built on the shared
 * `mxevolve-multiselect-dropdown`. Mirrors the single-select
 * `ScenarioDefinitionDropdownComponent` but stores an array of scenario ids —
 * used by the Validation (`qualityGateScenarioDefinitionIds`) and Upgrade
 * (`testScenarioIds`) executors to restore the legacy multi-select scenario
 * picker. Implements `ControlValueAccessor` so it binds to the executor's
 * `string[]` control; the widget resolves prefilled ids to their objects and
 * emits the selected ids on user change.
 */
@Component({
  selector: "mxevolve-scenario-definition-multiselect-dropdown",
  template: `
    <mxevolve-multiselect-dropdown
      [stateProvider]="stateProvider"
      [dataParams]="{ projectId: projectId() }"
      [inputId]="inputId()"
      [config]="{ placeholder: 'Select test scenarios', disabled: disabled() }"
      (selectionChange)="onSelectionChange($event)"
      (errorEvent)="onError()"
    />
  `,
  imports: [MxevolveMultiselectDropdownComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(
        () => ScenarioDefinitionMultiselectDropdownComponent
      ),
      multi: true,
    },
    ScenarioDefinitionService,
  ],
})
export class ScenarioDefinitionMultiselectDropdownComponent
  implements ControlValueAccessor
{
  readonly projectId = input.required<string>();
  readonly disabled = input(false);
  readonly inputId = input<string>();

  readonly stateProvider: MxEvolveDropdownState<
    ScenarioDefinitionApiResponse,
    ScenarioDefinitionParams
  >;

  private readonly scenarioDefinitionService = inject(
    ScenarioDefinitionService
  );
  private prefilledIds: string[] | null = null;
  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const destroyRef = inject(DestroyRef);
    const dataProvider = new ScenarioDefinitionDataProvider(
      this.scenarioDefinitionService
    );
    this.stateProvider = new MxevolveMultiselectFrontendStateProvider(
      dataProvider,
      destroyRef
    );

    effect(() => {
      const definitions = this.stateProvider.items();
      if (definitions?.length && this.prefilledIds) {
        this.resolvePrefilledIds(definitions);
      }
    });
  }

  writeValue(value: string[] | null): void {
    this.prefilledIds = value ?? null;

    if (!value?.length) {
      this.stateProvider.setSelectedItems([]);
      return;
    }

    const definitions = this.stateProvider.items();
    if (definitions?.length) {
      this.resolvePrefilledIds(definitions);
    }
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onSelectionChange(
    selectedDefinitions: ScenarioDefinitionApiResponse[]
  ): void {
    this.onChange(selectedDefinitions.map((definition) => definition.id));
    this.onTouched();
  }

  onError(): void {
    // Fetch errors surface through the shared dropdown; nothing extra to do.
  }

  private resolvePrefilledIds(
    definitions: ScenarioDefinitionApiResponse[]
  ): void {
    const ids = this.prefilledIds;
    this.prefilledIds = null;

    if (!ids?.length) {
      this.stateProvider.setSelectedItems([]);
      return;
    }

    const matches = definitions.filter((definition) =>
      ids.includes(definition.id)
    );
    this.stateProvider.setSelectedItems(matches);
  }
}
