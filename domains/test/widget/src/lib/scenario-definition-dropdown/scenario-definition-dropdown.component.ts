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
import { of } from "rxjs";
import { catchError } from "rxjs/operators";
import {
  MxevolveSingleSelectDropdownComponent,
  MxEvolveSingleSelectDropdownState,
  MxevolveSingleSelectFrontendStateProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  ScenarioDefinitionApiResponse,
  ScenarioDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
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
  readonly clearArchived = input(false);

  readonly failureEvent = output<string>();

  readonly stateProvider: MxEvolveSingleSelectDropdownState<
    ScenarioDefinitionApiResponse,
    ScenarioDefinitionParams
  >;

  private readonly scenarioDefinitionService = inject(
    ScenarioDefinitionService
  );
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);
  private prefilledId: string | null = null;
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const dataProvider = new ScenarioDefinitionDataProvider(
      this.scenarioDefinitionService
    );
    this.stateProvider = new MxevolveSingleSelectFrontendStateProvider(
      dataProvider,
      this.destroyRef
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
    if (match) {
      this.stateProvider.setSelectedItem(match);
    } else {
      this.handleArchivedPrefill(id);
    }
  }

  private handleArchivedPrefill(scenarioId: string): void {
    if (this.clearArchived()) {
      this.stateProvider.setSelectedItem(null);
      this.onChange(null);
    }

    this.scenarioDefinitionService
      .getScenarioDefinitionById(scenarioId, this.projectId())
      .pipe(
        catchError(() => of<ScenarioDefinitionApiResponse | null>(null)),
        takeUntilDestroyed(this.destroyRef)
      )
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
