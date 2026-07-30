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
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { EMPTY, Observable, of } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";
import { InputText } from "primeng/inputtext";
import { Button } from "primeng/button";
import {
  BackportProcessExecutorService,
  BusinessProcessDefinition,
  ExecuteBackportProcessRequest,
} from "@mxevolve/domains/business-process/data-access";
import {
  BackportPrefilledInputsComponent,
  NotificationsRecipientsInputComponent,
  UserStoryInputComponent,
} from "@mxevolve/domains/business-process/widget";
import { ReviewersAutoCompleteComponent } from "@mxevolve/domains/scm/widget";
import {
  DefinitionInputComponent,
  DefinitionInputGroupComponent,
} from "@mxevolve/domains/business-process/ui";
import { MergeConfigurationService } from "@mxevolve/domains/scm/data-access";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
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

/**
 * The merge-configuration endpoint is paginated with no by-id read, so the
 * pre-filled id is searched page by page. A single large page would silently
 * report a valid configuration as gone once a project has more than that many.
 */
const MERGE_CONFIGURATION_PAGE_SIZE = 100;

/** Shown when the merge-configuration list itself could not be read. */
const MERGE_CONFIGURATION_LOOKUP_FAILED =
  "Could not resolve the destination merge configuration available in the Process Template.";

/**
 * Error key carrying the "this pre-filled value no longer resolves" message.
 * The payload is a string, so `DefinitionInputComponent` surfaces it through its
 * string-error fall-through.
 */
const PREFILL_MISSING_ERROR = "prefillMissing";

/**
 * Being a validator rather than a one-shot `setErrors` is what makes the error
 * survive the `updateValueAndValidity()` the form triggers for other reasons.
 */
function missingMergeConfigurationValidator(
  deadValue: string,
  message: string
): ValidatorFn {
  return (control: AbstractControl) =>
    control.value === deadValue ? { [PREFILL_MISSING_ERROR]: message } : null;
}

/**
 * Backport definition executor (Build & Test sub-family `on-demand-backport`)
 * rendered as Page 2 of the generic multi-page dialog.
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
    DefinitionInputGroupComponent,
  ],
  providers: [BackportProcessExecutorService, MergeConfigurationService],
})
export class BackportExecutorComponent {
  readonly projectId = input.required<string>();
  readonly definition = input.required<BusinessProcessDefinition>();
  readonly created = output<string>();

  private readonly executorService = inject(BackportProcessExecutorService);
  private readonly mergeConfigurationService = inject(MergeConfigurationService);
  private readonly toast = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly executing = signal(false);
  protected readonly detailsExpanded = signal(false);
  /** True while the pre-filled merge configuration resolves; blocks submission. */
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

  private wiredForm: BackportExecutorForm | null = null;

  constructor() {
    effect(() => {
      const form = this.form();
      if (this.wiredForm !== form) {
        this.wiredForm = form;
        this.resolveMergeConfiguration(form);
      }
    });
  }

  protected toggleDetails(): void {
    this.detailsExpanded.update((expanded) => !expanded);
  }

  /**
   * The merge configuration is the one pre-filled value the form never shows and
   * no widget resolves. Legacy read it straight out of `providedInputs` at submit
   * time and threw when it was absent — a throw that escaped into Angular's
   * global error handler and deadlocked the modal.
   */
  private resolveMergeConfiguration(form: BackportExecutorForm): void {
    const control = form.controls.mergeConfigurationId;
    const repositoryId = form.controls.repositoryId.value;
    const mergeConfigurationId = control.value;
    if (!repositoryId || !mergeConfigurationId) {
      return;
    }
    this.resolvingPrefill.set(true);
    this.findMergeConfiguration(repositoryId, mergeConfigurationId, 0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((failure) => {
        this.resolvingPrefill.set(false);
        if (!failure) {
          return;
        }
        control.addValidators(
          missingMergeConfigurationValidator(mergeConfigurationId, failure)
        );
        control.updateValueAndValidity({ emitEvent: false });
        this.toast.showError(failure);
      });
  }

  /**
   * Walks the paginated merge-configuration list looking for one id, and reports
   * the message to show when it is not there — `null` when it is.
   */
  private findMergeConfiguration(
    repositoryId: string,
    id: string,
    page: number
  ): Observable<string | null> {
    return this.mergeConfigurationService
      .getFilteredMergeConfigurations(
        this.projectId(),
        repositoryId,
        "",
        page,
        MERGE_CONFIGURATION_PAGE_SIZE
      )
      .pipe(
        switchMap((result) => {
          if (result.content.some((configuration) => configuration.id === id)) {
            return of(null);
          }
          const isLastPage = result.last || result.content.length === 0;
          return isLastPage
            ? of(MERGE_CONFIGURATION_MISSING)
            : this.findMergeConfiguration(repositoryId, id, page + 1);
        }),
        catchError((error: unknown) =>
          of(
            error instanceof Error && error.message
              ? error.message
              : MERGE_CONFIGURATION_LOOKUP_FAILED
          )
        )
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
