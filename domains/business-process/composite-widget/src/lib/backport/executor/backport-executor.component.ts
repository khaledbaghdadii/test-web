import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import {
  AbstractControl,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { EMPTY, Observable, forkJoin, of, throwError } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import { InputText } from "primeng/inputtext";
import { Button } from "primeng/button";
import {
  BackportProcessExecutorService,
  BusinessProcessDefinition,
  ExecuteBackportProcessRequest,
} from "@mxevolve/domains/business-process/data-access";
import { shouldShowInForm } from "@mxevolve/domains/business-process/util";
import {
  BackportPrefilledInputsComponent,
  NotificationsRecipientsInputComponent,
  UserStoryInputComponent,
} from "@mxevolve/domains/business-process/widget";
import { ReviewersAutoCompleteComponent } from "@mxevolve/domains/scm/widget";
import { DefinitionInputComponent } from "@mxevolve/domains/business-process/ui";
import {
  MergeConfigurationService,
  RepositoryService,
} from "@mxevolve/domains/scm/data-access";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import {
  checkPrefilledEntities,
  prefilledIds,
} from "../../shared/dead-prefill";
import {
  BackportExecutorForm,
  buildBackportExecutorForm,
} from "./backport-executor.form";

/**
 * The merge-configuration endpoint only offers a filtered list, so "gone" has to
 * be detected client-side rather than from a 404 like every other lookup.
 */
const MERGE_CONFIGURATION_MISSING =
  "The destination merge configuration available in the Process Template no longer exists. Please update the Process Template.";

/** Page size used to look the pre-filled merge configuration up in the list. */
const MERGE_CONFIGURATION_PAGE_SIZE = 100;

/**
 * Backport definition executor (Build & Test sub-family `on-demand-backport`)
 * rendered as Page 2 of the generic multi-page dialog (VAL-27132 Step 10).
 * Signals + Angular Reactive Forms migration of the legacy
 * `BackportDefinitionExecutorComponent` / `ExecuteBackportProcessInputComponent`
 * — every field, validator and the submit payload are reproduced exactly.
 *
 * The repository, destination merge configuration and build-and-test infra
 * group come prefilled from the definition and are shown read-only in the
 * collapsible "{name} Details" panel; the form below shows the editable fields.
 */
@Component({
  selector: "mxevolve-backport-executor",
  templateUrl: "./backport-executor.component.html",
  imports: [
    ReactiveFormsModule,
    InputText,
    Button,
    MxevolveIconComponent,
    BackportPrefilledInputsComponent,
    UserStoryInputComponent,
    NotificationsRecipientsInputComponent,
    ReviewersAutoCompleteComponent,
    DefinitionInputComponent,
  ],
  providers: [
    BackportProcessExecutorService,
    RepositoryService,
    MergeConfigurationService,
    InfraGroupService,
  ],
})
export class BackportExecutorComponent {
  readonly projectId = input.required<string>();
  readonly definition = input.required<BusinessProcessDefinition>();
  readonly created = output<string>();

  private readonly executorService = inject(BackportProcessExecutorService);
  private readonly repositoryService = inject(RepositoryService);
  private readonly mergeConfigurationService = inject(MergeConfigurationService);
  private readonly infraGroupService = inject(InfraGroupService);
  private readonly toast = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly executing = signal(false);
  protected readonly detailsExpanded = signal(false);
  /** True while the pre-filled values are being resolved (W1); blocks submission. */
  protected readonly resolvingPrefill = signal(false);

  /** Exposed for the template's `[class.required]` label bindings (legacy parity). */
  protected readonly Validators = Validators;

  protected readonly form = computed(() =>
    buildBackportExecutorForm(this.definition().providedInputs)
  );

  protected readonly prefilledInputs = computed(
    () => this.definition().providedInputs
  );
  protected readonly detailsTitle = computed(
    () => `${this.definition().name} Details`
  );

  /**
   * Repository scope for the reviewers autocomplete, taken from the prefilled
   * definition input (backport definitions always prefill `repositoryId`).
   * Passing it explicitly restores the legacy behaviour where the reviewer
   * search resolved a repository from the project — without it the new-arch
   * autocomplete never receives a repository id and loads indefinitely.
   */
  protected readonly repositoryId = computed(
    () => this.form().controls.repositoryId.value ?? ""
  );

  /**
   * Editable-field visibility, evaluated from each control's initial state like
   * the legacy `DefinitionInputComponent.shouldShow`. The user-story field is
   * `forceShow` (always shown); the optional notifications field is shown only
   * when empty.
   */
  protected readonly visibility = computed(() => {
    const controls = this.form().controls;
    return {
      name: shouldShowInForm(controls.name, "ACCESS_INVALID_INPUTS_ONLY"),
      pullRequestId: shouldShowInForm(
        controls.pullRequestId,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      userStoryIds: shouldShowInForm(
        controls.userStoryIds,
        "ACCESS_INVALID_INPUTS_ONLY",
        true
      ),
      pullRequestTitle: shouldShowInForm(
        controls.pullRequestTitle,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      pullRequestReviewers: shouldShowInForm(
        controls.pullRequestReviewers,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      notificationsRecipients: shouldShowInForm(
        controls.notificationsRecipients,
        "ACCESS_EMPTY_OPTIONAL_INPUTS"
      ),
    };
  });

  private wiredForm: BackportExecutorForm | null = null;

  constructor() {
    effect(() => {
      const form = this.form();
      if (this.wiredForm !== form) {
        this.wiredForm = form;
        this.resolvePrefills(form);
      }
    });
  }

  protected toggleDetails(): void {
    this.detailsExpanded.update((expanded) => !expanded);
  }

  /**
   * Resolves the three values the definition pre-fills and the form never shows
   * (VAL-27132 W1 + decision D3). Legacy read them straight out of
   * `providedInputs` at submit time and threw when one was absent — a throw that
   * escaped into Angular's global error handler and deadlocked the modal — so
   * this is deliberately *not* legacy parity (register KEEP-3); resolving them
   * up front and invalidating the form is the sanctioned replacement.
   */
  private resolvePrefills(form: BackportExecutorForm): void {
    const projectId = this.projectId();
    const controls = form.controls;
    this.resolvingPrefill.set(true);
    this.resolveEntity(controls.repositoryId, (id) =>
      this.repositoryService.getRepository(projectId, id)
    )
      .pipe(
        switchMap(() =>
          forkJoin([
            this.resolveEntity(controls.buildAndTestInfraGroup, (id) =>
              this.infraGroupService.getGroup(projectId, id)
            ),
            this.resolveMergeConfiguration(form),
          ]).pipe(map(() => undefined))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.resolvingPrefill.set(false));
  }

  /**
   * The merge configuration is scoped to the repository and the endpoint offers
   * no by-id read, so it is looked up in the filtered list — which means the
   * repository has to resolve first, and "not in the list" has to be turned into
   * an error for {@link checkPrefilledEntities} to treat it as gone.
   */
  private resolveMergeConfiguration(
    form: BackportExecutorForm
  ): Observable<void> {
    const controls = form.controls;
    const repositoryId = controls.repositoryId.value;
    if (!repositoryId || controls.repositoryId.invalid) {
      return of(undefined);
    }
    return this.resolveEntity(controls.mergeConfigurationId, (id) =>
      this.mergeConfigurationService
        .getFilteredMergeConfigurations(
          this.projectId(),
          repositoryId,
          "",
          0,
          MERGE_CONFIGURATION_PAGE_SIZE
        )
        .pipe(
          switchMap((page) =>
            page.content.some((configuration) => configuration.id === id)
              ? of(page)
              : throwError(() => new Error(MERGE_CONFIGURATION_MISSING))
          )
        )
    );
  }

  private resolveEntity(
    control: AbstractControl,
    lookup: (id: string) => Observable<unknown>
  ): Observable<void> {
    return checkPrefilledEntities(
      control,
      prefilledIds(control.value),
      lookup,
      this.toast
    );
  }

  protected build(): void {
    const form = this.form();
    if (form.invalid || this.executing()) {
      return;
    }
    this.executing.set(true);
    this.executorService
      .executeBackportProcessDefinition(this.projectId(), this.toRequest(form))
      .pipe(
        catchError((error: Error) => {
          this.executing.set(false);
          this.toast.showError(error.message);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((response) => {
        this.executing.set(false);
        this.created.emit(response.id);
      });
  }

  private toRequest(form: BackportExecutorForm): ExecuteBackportProcessRequest {
    const value = form.getRawValue();
    return {
      name: value.name ?? "",
      definitionId: this.definition().id,
      repositoryId: value.repositoryId ?? "",
      destinationMergeConfigurationId: value.mergeConfigurationId ?? "",
      pullRequestToBeBackported: value.pullRequestId ?? "",
      pullRequestTitle: value.pullRequestTitle ?? "",
      pullRequestReviewers: (value.pullRequestReviewers ?? []).map(
        (reviewer) => reviewer.name
      ),
      userStoryIds: value.userStoryIds ?? [],
      buildAndTestInfraGroup: value.buildAndTestInfraGroup ?? "",
      notificationsRecipients: value.notificationsRecipients ?? undefined,
    };
  }
}
