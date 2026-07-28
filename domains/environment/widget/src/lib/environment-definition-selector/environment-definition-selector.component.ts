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
  EnvironmentDefinition,
  EnvironmentDefinitionService,
} from "@mxevolve/domains/environment/data-access";
import {
  EnvironmentDefinitionDataProvider,
  EnvironmentDefinitionParams as EnvironmentDefinitionSelectorParams,
} from "../environment-definition-dropdown/environment-definition-data-provider";

/**
 * New-architecture environment-definition selector built on the shared
 * `mxevolve-single-select-dropdown`, rebuilding the legacy
 * `mxevolve-business-process-environment-definition-selector`. Lists the
 * project's environment definitions and binds the selected id to the executor's
 * `referenceEnvironmentDefinitionId` control. A prefilled id that is no longer
 * in the fetched list is preserved (legacy `invalidateHiddenEnvironmentDefinition=false`).
 */
@Component({
  selector: "mxevolve-environment-definition-selector",
  template: `
    <mxevolve-single-select-dropdown
      [stateProvider]="stateProvider"
      [dataParams]="{ projectId: projectId() }"
      [inputId]="inputId()"
      [config]="{
        placeholder: 'Select an environment definition',
        filter: true,
        disabled: disabled()
      }"
      (selectionChange)="onSelectionChange($event)"
      (errorEvent)="onError($event)"
    />
  `,
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EnvironmentDefinitionSelectorComponent),
      multi: true,
    },
    EnvironmentDefinitionService,
  ],
})
export class EnvironmentDefinitionSelectorComponent
  implements ControlValueAccessor
{
  readonly projectId = input.required<string>();
  readonly disabled = input(false);
  readonly inputId = input<string>();

  readonly failureEvent = output<string>();

  readonly stateProvider: MxEvolveSingleSelectDropdownState<
    EnvironmentDefinition,
    EnvironmentDefinitionSelectorParams
  >;

  private readonly environmentDefinitionService = inject(
    EnvironmentDefinitionService
  );
  private prefilledId: string | null = null;
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const destroyRef = inject(DestroyRef);
    const dataProvider = new EnvironmentDefinitionDataProvider(
      this.environmentDefinitionService
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

  onSelectionChange(definition: EnvironmentDefinition | null): void {
    this.onChange(definition?.id ?? null);
    this.onTouched();
  }

  onError(errorMessage: string): void {
    this.failureEvent.emit(errorMessage);
  }

  private resolvePrefilledId(definitions: EnvironmentDefinition[]): void {
    const id = this.prefilledId;
    this.prefilledId = null;

    if (!id) {
      this.stateProvider.setSelectedItem(null);
      return;
    }

    const match = definitions.find((definition) => definition.id === id);
    this.stateProvider.setSelectedItem(match ?? null);
  }
}
