import {
  Component,
  DestroyRef,
  effect,
  forwardRef,
  inject,
  input,
  output,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import {
  MxevolveSingleSelectDropdownComponent,
  MxEvolveSingleSelectDropdownState,
  MxevolveSingleSelectFrontendStateProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  ScenarioDefinitionApiResponse,
  ScenarioDefinitionService,
} from "@mxevolve/domains/test/data-access";
import {
  ScenarioDefinitionDataProvider,
  ScenarioDefinitionParams,
} from "./scenario-definition-data-provider";

@Component({
  selector: "mxevolve-scenario-definition-dropdown",
  templateUrl: "./scenario-definition-dropdown.component.html",
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScenarioDefinitionDropdownComponent),
      multi: true,
    },
    ScenarioDefinitionService,
  ],
})
export class ScenarioDefinitionDropdownComponent
  implements ControlValueAccessor
{
  readonly projectId = input.required<string>();
  readonly disabled = input(false);
  readonly inputId = input<string>();

  readonly failureEvent = output<string>();

  readonly stateProvider: MxEvolveSingleSelectDropdownState<
    ScenarioDefinitionApiResponse,
    ScenarioDefinitionParams
  >;

  private readonly scenarioDefinitionService = inject(
    ScenarioDefinitionService
  );
  private prefilledId: string | null = null;
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const destroyRef = inject(DestroyRef);
    const dataProvider = new ScenarioDefinitionDataProvider(
      this.scenarioDefinitionService
    );
    this.stateProvider = new MxevolveSingleSelectFrontendStateProvider(
      dataProvider,
      destroyRef
    );

    effect(() => {
      const definitions = this.stateProvider.items();
      if (definitions?.length && this.prefilledId) {
        this.resolvePrefilledId(definitions);
      }
    });
  }

  writeValue(value: string | null): void {
    this.prefilledId = value ?? null;

    if (!value) {
      this.stateProvider.setSelectedItem(null);
      return;
    }

    const definitions = this.stateProvider.items();
    if (definitions?.length) {
      this.resolvePrefilledId(definitions);
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onSelectionChange(
    selectedDefinition: ScenarioDefinitionApiResponse | null
  ): void {
    this.onChange(selectedDefinition?.id ?? null);
    this.onTouched();
  }

  onError(errorMessage: string): void {
    this.failureEvent.emit(errorMessage);
  }

  private resolvePrefilledId(
    definitions: ScenarioDefinitionApiResponse[]
  ): void {
    const id = this.prefilledId;
    this.prefilledId = null;

    if (!id) {
      this.stateProvider.setSelectedItem(null);
      return;
    }

    const match = definitions.find((definition) => definition.id === id);
    this.stateProvider.setSelectedItem(match ?? null);
    if (!match) {
      // The pre-filled scenario definition no longer exists. Report the miss to
      // the form instead of leaving the control holding a dead id that still
      // satisfies `Validators.required` (VAL-27132 R3).
      this.onChange(null);
    }
  }
}
