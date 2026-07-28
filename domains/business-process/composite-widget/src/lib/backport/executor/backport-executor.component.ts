import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { ReactiveFormsModule, Validators } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { EMPTY } from "rxjs";
import { catchError } from "rxjs/operators";
import { InputText } from "primeng/inputtext";
import { Button } from "primeng/button";
import {
  BackportProcessExecutorService,
  BusinessProcessDefinition,
  ExecuteBackportProcessRequest,
  ProvidedInput,
} from "@mxevolve/domains/business-process/data-access";
import { shouldShowInForm } from "@mxevolve/domains/business-process/util";
import {
  BackportPrefilledInputsComponent,
  NotificationsRecipientsInputComponent,
  UserStoryInputComponent,
} from "@mxevolve/domains/business-process/widget";
import { ReviewersAutoCompleteComponent } from "@mxevolve/domains/scm/widget";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import {
  BackportExecutorForm,
  buildBackportExecutorForm,
} from "./backport-executor.form";

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
  ],
  providers: [BackportProcessExecutorService],
})
export class BackportExecutorComponent {
  readonly projectId = input.required<string>();
  readonly definition = input.required<BusinessProcessDefinition>();
  readonly created = output<string>();

  private readonly executorService = inject(BackportProcessExecutorService);
  private readonly toast = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly executing = signal(false);
  protected readonly detailsExpanded = signal(false);

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
  protected readonly repositoryId = computed(() =>
    this.providedValue("repositoryId")
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

  protected toggleDetails(): void {
    this.detailsExpanded.update((expanded) => !expanded);
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
      repositoryId: this.providedValue("repositoryId"),
      destinationMergeConfigurationId: this.providedValue(
        "mergeConfigurationId"
      ),
      pullRequestToBeBackported: value.pullRequestId ?? "",
      pullRequestTitle: value.pullRequestTitle ?? "",
      pullRequestReviewers: (value.pullRequestReviewers ?? []).map(
        (reviewer) => reviewer.name
      ),
      userStoryIds: value.userStoryIds ?? [],
      buildAndTestInfraGroup: this.providedValue("buildAndTestInfraGroup"),
      notificationsRecipients: value.notificationsRecipients ?? undefined,
    };
  }

  private providedValue(inputId: string): string {
    const providedInputs: readonly ProvidedInput[] =
      this.definition().providedInputs;
    return (
      (providedInputs.find((input) => input.inputId === inputId)
        ?.value as string) ?? ""
    );
  }
}
