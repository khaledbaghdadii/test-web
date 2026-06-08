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
  MxevolveSingleSelectDropdownComponent,
  MxEvolveSingleSelectDropdownState,
  MxevolveSingleSelectFrontendStateProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import { ScenarioDefinition } from "./scenario-definition";
import { ToastMessageService } from "@mxflow/ui/alert";
import { catchError, of } from "rxjs";

@Component({
  selector: "mxevolve-scenario-definition-single-selector",
  templateUrl: "./scenario-definition-single-selector.component.html",
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScenarioDefinitionSingleSelectorComponent),
      multi: true,
    },
    ScenarioDefinitionService,
  ],
})
export class ScenarioDefinitionSingleSelectorComponent
  implements ControlValueAccessor
{
  projectId = input.required<string>();
  clearArchived = input(false);
  disabled = input(false);
  placeholder = input("Select Test Scenario");

  failureEvent = output<string>();

  readonly stateProvider: MxEvolveSingleSelectDropdownState<
    ScenarioDefinition,
    ScenarioDefinitionParams
  >;

  private readonly toastMessageService = inject(ToastMessageService);
  private readonly scenarioDefinitionService = inject(
    ScenarioDefinitionService
  );
  private selectedScenario: string | undefined = undefined;
  private onChange: (value: string | undefined) => void = () => {};
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
      const scenarios = this.stateProvider.items();
      if (scenarios && this.selectedScenario) {
        this.resolvePrefilledScenarioDefinition(scenarios);
      }
    });
  }

  writeValue(value: string | undefined): void {
    this.selectedScenario = value;

    const scenarios = this.stateProvider.items();
    if (scenarios) {
      this.resolvePrefilledScenarioDefinition(scenarios);
    }
  }

  registerOnChange(fn: (value: string | undefined) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onSelectionChange(
    selectedScenarioDefinition: ScenarioDefinition | null
  ): void {
    this.onChange(selectedScenarioDefinition?.id);
    this.onTouched();
  }

  onError(errorMessage: string): void {
    this.failureEvent.emit(errorMessage);
  }

  private resolvePrefilledScenarioDefinition(
    fetchedScenarios: ScenarioDefinition[]
  ): void {
    const id = this.selectedScenario;
    this.selectedScenario = undefined;
    if (!id) {
      this.stateProvider.setSelectedItem(null);
      return;
    }

    const scenario = fetchedScenarios.find((scenario) => scenario.id === id);

    if (scenario) {
      this.stateProvider.setSelectedItem(scenario);
    } else {
      this.handleArchivedPrefill(id);
    }
  }

  private handleArchivedPrefill(scenarioId: string): void {
    if (this.clearArchived()) {
      this.stateProvider.setSelectedItem(null);
      this.onChange(undefined);
    }

    this.scenarioDefinitionService
      .getScenarioDefinitionLite(scenarioId, this.projectId())
      .pipe(catchError(() => of(null)))
      .subscribe((response) => {
        const scenarioName = response?.name ? `'${response.name}' ` : "";
        const action = this.clearArchived()
          ? "has been cleared"
          : "may no longer be valid";
        this.toastMessageService.showWarning(
          `The prefilled scenario ${scenarioName}is archived and ${action}.`,
          "Archived Scenario Selected"
        );
      });
  }
}
