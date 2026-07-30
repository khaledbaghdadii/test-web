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
  RepositoryListItem,
  RepositoryService,
} from "@mxevolve/domains/scm/data-access";
import {
  RepositoryDataProvider,
  RepositorySelectorParams,
} from "./repository-data-provider";

/** Stands in until Angular registers the real callbacks on the value accessor. */
function noop(): void {
  return;
}

/**
 * New-architecture rebuild of the legacy
 * `mxevolve-business-process-repository-selector`. A single-select dropdown of
 * the project's test repositories, built on the shared
 * `mxevolve-single-select-dropdown`. Implements `ControlValueAccessor` so it
 * binds to the executor's `repositoryId` control and emits the selected
 * repository id; `repositoryChanged` fires on user change to drive cascade
 * resets (e.g. clearing dependent branch fields).
 */
@Component({
  selector: "mxevolve-repository-selector",
  templateUrl: "./repository-selector.component.html",
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RepositorySelectorComponent),
      multi: true,
    },
    RepositoryService,
  ],
})
export class RepositorySelectorComponent implements ControlValueAccessor {
  readonly projectId = input.required<string>();
  readonly disabled = input(false);
  readonly inputId = input<string>();

  readonly repositoryChanged = output<void>();
  readonly failureEvent = output<string>();

  readonly stateProvider: MxEvolveSingleSelectDropdownState<
    RepositoryListItem,
    RepositorySelectorParams
  >;

  private readonly repositoryService = inject(RepositoryService);
  private prefilledId: string | null = null;
  private onChange: (value: string | null) => void = noop;
  private onTouched: () => void = noop;

  constructor() {
    const destroyRef = inject(DestroyRef);
    const dataProvider = new RepositoryDataProvider(this.repositoryService);
    this.stateProvider = new MxevolveSingleSelectFrontendStateProvider(
      dataProvider,
      destroyRef
    );

    effect(() => {
      const repositories = this.stateProvider.items();
      if (repositories?.length && this.prefilledId) {
        this.resolvePrefilledId(repositories);
      }
    });
  }

  writeValue(value: string | null): void {
    this.prefilledId = value ?? null;

    if (!value) {
      this.stateProvider.setSelectedItem(null);
      return;
    }

    const repositories = this.stateProvider.items();
    if (repositories?.length) {
      this.resolvePrefilledId(repositories);
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * Only ever reached from a user interaction: the inner dropdown emits
   * `selectionChange` from its select/clear handlers, never from the
   * programmatic `setSelectedItem` the prefill uses. So every call here is a
   * genuine change and must fire the cascade, exactly as legacy's
   * `(onChange)="repositoryChanged.emit()"` did.
   */
  onSelectionChange(repository: RepositoryListItem | null): void {
    this.onChange(repository?.id ?? null);
    this.onTouched();
    this.repositoryChanged.emit();
  }

  onError(errorMessage: string): void {
    this.failureEvent.emit(errorMessage);
  }

  /**
   * Resolves the id the definition (or a repush) prefilled the control with
   * against the repositories the project actually has.
   *
   * When the id is gone the control is cleared as well as the dropdown: leaving
   * the dead id in the control would let it pass `Validators.required`, enable
   * the run button and be POSTed, while the dropdown rendered blank.
   */
  private resolvePrefilledId(repositories: RepositoryListItem[]): void {
    const id = this.prefilledId;
    this.prefilledId = null;

    if (!id) {
      this.stateProvider.setSelectedItem(null);
      return;
    }

    const match = repositories.find((repository) => repository.id === id);
    this.stateProvider.setSelectedItem(match ?? null);

    if (!match) {
      this.onChange(null);
      this.failureEvent.emit(
        "The repository available in the Process Template no longer exists. Please update the Process Template."
      );
    }
  }
}
