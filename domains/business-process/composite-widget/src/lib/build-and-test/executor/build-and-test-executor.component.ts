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
import { ReactiveFormsModule, Validators } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { EMPTY, startWith } from "rxjs";
import { catchError } from "rxjs/operators";
import { Checkbox } from "primeng/checkbox";
import { InputText } from "primeng/inputtext";
import { Button } from "primeng/button";
import {
  BuildAndTestProcessExecutorService,
  BusinessProcessDefinition,
  ExecuteBuildAndTestProcessRequest,
} from "@mxevolve/domains/business-process/data-access";
import { isProvidedByDefinition } from "@mxevolve/domains/business-process/util";
import {
  BuildAndTestPrefilledInputsComponent,
  InfraGroupSelectorComponent,
  NotificationsRecipientsInputComponent,
  UserStoryInputComponent,
} from "@mxevolve/domains/business-process/widget";
import { ScenarioDefinitionDropdownComponent } from "@mxevolve/domains/test/widget";
import {
  BranchInputComponent,
  RepositorySelectorComponent,
} from "@mxevolve/domains/scm/widget";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";
import {
  DefinitionInputComponent,
  DefinitionInputGroupComponent,
} from "@mxevolve/domains/business-process/ui";
import {
  ErrorAlertComponent,
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import {
  BuildAndTestExecutorForm,
  BuildAndTestExecutorSeed,
  buildBuildAndTestExecutorForm,
} from "./build-and-test-executor.form";

/** Legacy toast shown when the configuration branch already exists in the repository. */
const CONFIGURATION_BRANCH_EXISTS =
  "The branch name available in the Process Template or pre-filled in the pop-up already exists in the repository. Please update the Process Template or the pop-up with a unique name to create a new branch.";

/** Legacy toast shown when the configuration parent branch does not exist. */
const CONFIGURATION_PARENT_BRANCH_MISSING =
  "The branch name available in the Process Template doesn't exist in the repository. Please check the name and try again with an existing branch.";

/**
 * Build & Test definition executor rendered as Page 2 of the multi-page dialog.
 *
 * Pre-filled definition inputs are shown read-only in the collapsible
 * "{name} Details" panel; the form below shows the editable fields.
 */
@Component({
  selector: "mxevolve-build-and-test-executor",
  templateUrl: "./build-and-test-executor.component.html",
  imports: [
    ReactiveFormsModule,
    Checkbox,
    InputText,
    Button,
    ErrorAlertComponent,
    MxevolveIconComponent,
    BuildAndTestPrefilledInputsComponent,
    InfraGroupSelectorComponent,
    NotificationsRecipientsInputComponent,
    UserStoryInputComponent,
    ScenarioDefinitionDropdownComponent,
    RepositorySelectorComponent,
    BranchInputComponent,
    DefinitionInputComponent,
    DefinitionInputGroupComponent,
  ],
  providers: [BuildAndTestProcessExecutorService],
})
export class BuildAndTestExecutorComponent {
  readonly projectId = input.required<string>();
  readonly definition = input.required<BusinessProcessDefinition>();
  /**
   * Optional starting values for the editable fields (used by Repush to
   * pre-fill the form from a previous run). Left undefined for a new run, in
   * which case the form falls back to the definition-provided defaults.
   */
  readonly initialValues = input<BuildAndTestExecutorSeed>();
  readonly created = output<string>();
  /**
   * Mirrors {@link executing} to the hosting dialog, which locks itself while a
   * run is in flight — closing the dialog destroys this component (and with it
   * the `takeUntilDestroyed` subscription) while the POST may still be running.
   */
  readonly executingChange = output<boolean>();
  /** The footer's Cancel button; the host decides between Back and Close. */
  readonly cancelled = output<void>();

  private readonly executorService = inject(BuildAndTestProcessExecutorService);
  private readonly analyticsTracker = inject(AnalyticsTrackerService);
  private readonly toast = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly executing = signal(false);
  protected readonly detailsExpanded = signal(false);
  /**
   * Backend failure from the last submit. Legacy pinned this in a non-closeable
   * alert at the top of the dialog and cleared it when the user retried; a toast
   * is gone before the user has finished reading the form it refers to.
   */
  protected readonly submitError = signal<string | null>(null);
  protected readonly skipEnvironmentDeployment = signal(false);

  /** Exposed for the template's `[class.required]` label bindings. */
  protected readonly Validators = Validators;

  protected readonly form = computed(() => {
    const form = buildBuildAndTestExecutorForm(
      this.definition().providedInputs
    );
    const seed = this.initialValues();
    if (seed) {
      form.patchValue(seed);
    }
    return form;
  });

  protected readonly prefilledInputs = computed(
    () => this.definition().providedInputs
  );
  protected readonly detailsTitle = computed(
    () => `${this.definition().name} Details`
  );

  private wiredForm: BuildAndTestExecutorForm | null = null;

  constructor() {
    effect(() => {
      const form = this.form();
      if (this.wiredForm === form) {
        return;
      }
      this.wiredForm = form;
      this.wireSkipEnvironmentDeployment(form);
    });
    effect(() => this.executingChange.emit(this.executing()));
  }

  /**
   * Legacy force-showed a field the definition did not supply. Keeping the
   * decision on the definition means a repush seed cannot hide a field by
   * filling it in.
   */
  protected notProvided(inputId: string): boolean {
    return !isProvidedByDefinition(this.definition().providedInputs, inputId);
  }

  protected toggleDetails(): void {
    this.detailsExpanded.update((expanded) => !expanded);
  }

  /**
   * Legacy `mxevolveUsageTracker` binding on the skip toggle, which was dropped
   * in the migration. Reproduced here rather than importing
   * the legacy `features/business-process` directive, matching how the rest of
   * this executor reproduces legacy helpers; `AnalyticsTrackerService` itself is
   * already used directly elsewhere in this library.
   *
   * Legacy read the label from the binding evaluated on the *previous* change
   * detection pass, so it reported the state before the click. That inversion is
   * not reproduced — the label reflects the state the user just selected.
   */
  protected trackSkipEnvironmentDeployment(): void {
    this.analyticsTracker.trackEvent(
      EventCategory.CHECKBOX,
      EventAction.CLICK_CHECKBOX,
      this.skipEnvironmentDeployment()
        ? "CI Process - Prepare-Build Environment Skipped"
        : "CI Process - Prepare-Build Environment Not Skipped"
    );
  }

  /**
   * Legacy repository-change cascade: changing the repository invalidates the
   * configuration/parent branch selections, so reset them (which re-triggers
   * their branch-existence validation against the new repository).
   */
  protected onRepositoryChanged(): void {
    const controls = this.form().controls;
    controls.configurationBranchName.reset();
    controls.configurationParentBranch.reset();
  }

  /** Legacy toast when the configuration branch already exists in the repo. */
  protected showConfigBranchError(): void {
    this.toast.showError(CONFIGURATION_BRANCH_EXISTS);
  }

  /** Legacy toast when the configuration parent branch does not exist. */
  protected showParentBranchError(): void {
    this.toast.showError(CONFIGURATION_PARENT_BRANCH_MISSING);
  }

  /**
   * Surfaces a selector's fetch failure. These outputs existed but were bound by
   * no executor, so a failed lookup was swallowed entirely.
   */
  protected showSelectorError(message: string): void {
    this.toast.showError(message);
  }

  /**
   * `form.pending` is part of the guard because the branch inputs validate
   * asynchronously: without it, Enter submits a form whose branch checks have
   * not come back yet, and the run is created against a branch that may not
   * exist.
   */
  protected build(): void {
    const form = this.form();
    if (form.invalid || form.pending || this.executing()) {
      return;
    }
    this.submitError.set(null);
    this.executing.set(true);
    this.executorService
      .executeBuildAndTestProcessDefinition(
        this.projectId(),
        this.toRequest(form)
      )
      .pipe(
        catchError((error: Error) => {
          this.executing.set(false);
          this.submitError.set(error.message);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((response) => {
        this.executing.set(false);
        this.created.emit(response.id);
      });
  }

  /**
   * Mirrors the legacy skip toggle: when "skip build environment deployment" is
   * on, the build-scenario field is hidden and its required validator cleared
   * (so the form can still be valid); otherwise the validator is reinstated.
   */
  private wireSkipEnvironmentDeployment(form: BuildAndTestExecutorForm): void {
    form.controls.skipEnvironmentDeployment.valueChanges
      .pipe(
        startWith(form.controls.skipEnvironmentDeployment.value),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((skip) => {
        this.skipEnvironmentDeployment.set(skip);
        const scenario = form.controls.buildScenarioDefinitionId;
        if (skip) {
          scenario.clearValidators();
        } else {
          scenario.setValidators([Validators.required]);
        }
        scenario.updateValueAndValidity({ emitEvent: false });
      });
  }

  private toRequest(
    form: BuildAndTestExecutorForm
  ): ExecuteBuildAndTestProcessRequest {
    const value = form.getRawValue();
    return {
      definitionId: this.definition().id,
      name: value.name ?? "",
      repositoryId: value.repositoryId ?? "",
      configurationBranchName: value.configurationBranchName ?? "",
      configurationParentBranch: value.configurationParentBranch ?? "",
      userStoryIds: value.userStoryIds ?? [],
      buildEnvironmentInfraGroup: value.buildEnvironmentInfraGroup ?? "",
      buildAndTestInfraGroup: value.buildAndTestInfraGroup ?? "",
      skipPrepareBuildEnvironment: value.skipEnvironmentDeployment,
      buildEnvironmentScenarioDefinitionId:
        value.buildScenarioDefinitionId ?? undefined,
      notificationsRecipients: value.notificationsRecipients ?? undefined,
    };
  }
}
