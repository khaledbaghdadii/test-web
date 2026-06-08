import { DestroyRef, inject, signal, Signal } from "@angular/core";
import {
  EnvironmentDefinition,
  EnvironmentService,
} from "@mxflow/features/environment";
import { catchError, Observable, of, Subject, switchMap, tap } from "rxjs";
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from "@angular/core/rxjs-interop";

export class FinalProductSyncDetailsStateService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly environmentDefinitions$: Observable<EnvironmentDefinition[]>;
  environmentDefinitions: Signal<EnvironmentDefinition[]>;
  fetchEnvironmentsLoading = signal<boolean>(false);
  private readonly errorMessageSubject = new Subject<string>();
  errorMessage$ = this.errorMessageSubject.asObservable();
  readonly destroyRef = inject(DestroyRef);

  projectId = signal<string | undefined>(undefined);

  constructor() {
    const projectId$ = toObservable(this.projectId);

    this.environmentDefinitions$ = projectId$.pipe(
      switchMap((projectId) => {
        if (!projectId) return of([]);

        return this.environmentService
          .getEnvironmentDefinitions(projectId, true)
          .pipe(
            tap(() => this.fetchEnvironmentsLoading.set(true)),
            catchError((error) => {
              const errorMessage = error.error?.message
                ? "Failed to fetch environment definitions: " +
                  error.error.message +
                  ". Using environment definition ids instead."
                : "Failed to fetch environment definitions. Using environment definition ids instead.";
              this.fetchEnvironmentsLoading.set(false);
              this.setErrorMessage(errorMessage);
              return of([]);
            }),
            tap(() => this.fetchEnvironmentsLoading.set(false))
          );
      }),
      takeUntilDestroyed(this.destroyRef)
    );

    this.environmentDefinitions = toSignal(this.environmentDefinitions$, {
      initialValue: [] as EnvironmentDefinition[],
    });
  }

  setProjectId(projectId: string): void {
    this.projectId.set(projectId);
  }

  private setErrorMessage(errorMessage: string) {
    this.errorMessageSubject.next(errorMessage);
  }
}
