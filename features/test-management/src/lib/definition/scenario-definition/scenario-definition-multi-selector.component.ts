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
  ScenarioDefinitionDataProvider,
  ScenarioDefinitionParams,
} from "./scenario-definition-data-provider";
import { ScenarioDefinitionService } from "./scenario-definition.service";
import {
  MxEvolveDropdownState,
  MxevolveMultiselectDropdownComponent,
  MxevolveMultiselectFrontendStateProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import { ScenarioDefinition } from "./scenario-definition";
import { ToastMessageService } from "@mxflow/ui/alert";
import { catchError, forkJoin, of } from "rxjs";

@Component({
  selector: "mxevolve-scenario-definition-multi-selector",
  templateUrl: "./scenario-definition-multi-selector.component.html",
  imports: [MxevolveMultiselectDropdownComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScenarioDefinitionMultiSelectorComponent),
      multi: true,
    },
    ScenarioDefinitionService,
  ],
})
export class ScenarioDefinitionMultiSelectorComponent
  implements ControlValueAccessor
{
  projectId = input.required<string>();
  clearArchived = input(false);
  disabled = input(false);

  failureEvent = output<string>();

  readonly stateProvider: MxEvolveDropdownState<
    ScenarioDefinition,
    ScenarioDefinitionParams
  >;

  private readonly toastMessageService = inject(ToastMessageService);
  private readonly scenarioDefinitionService = inject(
    ScenarioDefinitionService
  );
  private selectedScenarios: string[] | undefined = undefined;
  private onChange: (value: string[] | undefined) => void = () => {};
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
      const scenarioDefinitions = this.stateProvider.items();
      if (scenarioDefinitions && this.selectedScenarios) {
        this.resolvePrefilledScenarioDefinitions(scenarioDefinitions);
      }
    });
  }

  writeValue(value: string[] | undefined): void {
    this.selectedScenarios = value;

    const scenarioDefinitions = this.stateProvider.items();
    if (scenarioDefinitions) {
      this.resolvePrefilledScenarioDefinitions(scenarioDefinitions);
    }
  }

  registerOnChange(fn: (value: string[] | undefined) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onSelectionChange(selectedScenarioDefinitions: ScenarioDefinition[]): void {
    const ids = selectedScenarioDefinitions.map((item) => item.id);
    this.onChange(ids.length ? ids : undefined);
    this.onTouched();
  }

  onError(errorMessage: string): void {
    this.failureEvent.emit(errorMessage);
  }

  private resolvePrefilledScenarioDefinitions(
    fetchedScenarios: ScenarioDefinition[]
  ): void {
    const ids = this.selectedScenarios;
    this.selectedScenarios = undefined;
    if (!ids || ids.length === 0) {
      this.stateProvider.setSelectedItems([]);
      return;
    }

    const scenarios = ids
      .map((id) => fetchedScenarios.find((scenario) => scenario.id === id))
      .filter((scenario) => scenario !== undefined);

    const archivedIds = ids.filter(
      (id) => !fetchedScenarios.find((scenario) => scenario.id === id)
    );
    if (archivedIds.length > 0) {
      this.handleArchivedPrefill(scenarios, archivedIds);
    } else {
      this.stateProvider.setSelectedItems(scenarios);
    }
  }

  private handleArchivedPrefill(
    scenarios: ScenarioDefinition[],
    archivedIds: string[]
  ): void {
    this.stateProvider.setSelectedItems(scenarios);
    if (this.clearArchived()) {
      const validScenarioIds = scenarios.map((scenario) => scenario.id);
      this.onChange(validScenarioIds.length ? validScenarioIds : undefined);
    }

    forkJoin(
      archivedIds.map((id) =>
        this.scenarioDefinitionService
          .getScenarioDefinitionLite(id, this.projectId())
          .pipe(catchError(() => of(null)))
      )
    ).subscribe((responses) => {
      const names = responses
        .filter((response) => response !== null)
        .map((scenario) => `'${scenario.name}'`);
      this.showWarningToast(names);
    });
  }

  private readonly showWarningToast = (names: string[]) => {
    const scenarioNames = names.length > 0 ? names.join(", ") + " " : "";
    const action = this.clearArchived()
      ? "have been cleared"
      : "may no longer be valid";
    this.toastMessageService.showWarning(
      `The prefilled scenario(s) ${scenarioNames}are archived and ${action}.`,
      "Archived Scenario Selected"
    );
  };
}
