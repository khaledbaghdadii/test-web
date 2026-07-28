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
  private hasEmittedInitial = false;
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

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

  onSelectionChange(repository: RepositoryListItem | null): void {
    this.onChange(repository?.id ?? null);
    this.onTouched();
    // Skip the very first (prefill-driven) selection so the cascade only fires
    // for genuine user changes.
    if (this.hasEmittedInitial) {
      this.repositoryChanged.emit();
    }
    this.hasEmittedInitial = true;
  }

  onError(errorMessage: string): void {
    this.failureEvent.emit(errorMessage);
  }

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
      // The pre-filled repository no longer exists. Report the miss to the form
      // instead of leaving the control holding a dead id that still satisfies
      // `Validators.required` and would be posted as-is (VAL-27132 R3).
      this.onChange(null);
    }
    this.hasEmittedInitial = true;
  }
}
