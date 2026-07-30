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
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { forkJoin, of } from "rxjs";
import { catchError } from "rxjs/operators";
import {
  MxEvolveDropdownState,
  MxevolveMultiselectDropdownComponent,
  MxevolveMultiselectFrontendStateProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  ScenarioDefinitionApiResponse,
  ScenarioDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import {
  ScenarioDefinitionDataProvider,
  ScenarioDefinitionParams,
} from "../scenario-definition-dropdown/scenario-definition-data-provider";

@Component({
  selector: "mxevolve-scenario-definition-multiselect-dropdown",
  template: `
    <mxevolve-multiselect-dropdown
      [stateProvider]="stateProvider"
      [dataParams]="{ projectId: projectId() }"
      [inputId]="inputId()"
      [config]="{ placeholder: 'Select test scenarios', disabled: disabled() }"
      (selectionChange)="onSelectionChange($event)"
      (errorEvent)="onError($event)"
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
  readonly clearArchived = input(false);

  readonly failureEvent = output<string>();

  readonly stateProvider: MxEvolveDropdownState<
    ScenarioDefinitionApiResponse,
    ScenarioDefinitionParams
  >;

  private readonly scenarioDefinitionService = inject(
    ScenarioDefinitionService
  );
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);
  private prefilledIds: string[] | null = null;
  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const dataProvider = new ScenarioDefinitionDataProvider(
      this.scenarioDefinitionService
    );
    this.stateProvider = new MxevolveMultiselectFrontendStateProvider(
      dataProvider,
      this.destroyRef
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

  onError(errorMessage: string): void {
    this.failureEvent.emit(errorMessage);
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

    const scenarios = ids
      .map((id) => definitions.find((definition) => definition.id === id))
      .filter((definition) => definition !== undefined);

    const archivedIds = ids.filter(
      (id) => !definitions.find((definition) => definition.id === id)
    );

    if (archivedIds.length > 0) {
      this.handleArchivedPrefill(scenarios, archivedIds);
    } else {
      this.stateProvider.setSelectedItems(scenarios);
    }
  }

  private handleArchivedPrefill(
    scenarios: ScenarioDefinitionApiResponse[],
    archivedIds: string[]
  ): void {
    this.stateProvider.setSelectedItems(scenarios);
    if (this.clearArchived()) {
      this.onChange(scenarios.map((scenario) => scenario.id));
    }

    forkJoin(
      archivedIds.map((id) =>
        this.scenarioDefinitionService
          .getScenarioDefinitionById(id, this.projectId())
          .pipe(catchError(() => of<ScenarioDefinitionApiResponse | null>(null)))
      )
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((responses) => {
        const names = responses
          .filter((response) => response !== null)
          .map((scenario) => `'${scenario.name}'`);
        this.showArchivedWarning(names);
      });
  }

  private showArchivedWarning(names: string[]): void {
    const scenarioNames = names.length > 0 ? names.join(", ") + " " : "";
    const action = this.clearArchived()
      ? "have been cleared"
      : "may no longer be valid";
    this.toastMessageService.showWarning(
      `The prefilled scenario(s) ${scenarioNames}are archived and ${action}.`,
      "Archived Scenario Selected"
    );
  }
}
