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
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { EMPTY, Observable, forkJoin, of, startWith } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import { Checkbox } from "primeng/checkbox";
import { InputText } from "primeng/inputtext";
import { Button } from "primeng/button";
import {
  BuildAndTestProcessExecutorService,
  BusinessProcessDefinition,
  ExecuteBuildAndTestProcessRequest,
} from "@mxevolve/domains/business-process/data-access";
import {
  mustStayReachable,
  shouldShowInForm,
} from "@mxevolve/domains/business-process/util";
import {
  BuildAndTestPrefilledInputsComponent,
  InfraGroupSelectorComponent,
  NotificationsRecipientsInputComponent,
  UserStoryInputComponent,
} from "@mxevolve/domains/business-process/widget";
import { ScenarioDefinitionDropdownComponent } from "@mxevolve/domains/test/widget";
import { ScenarioDefinitionService } from "@mxevolve/domains/test/data-access";
import {
  BranchInputComponent,
  RepositorySelectorComponent,
} from "@mxevolve/domains/scm/widget";
import {
  BranchService,
  RepositoryService,
} from "@mxevolve/domains/scm/data-access";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import { UserService } from "@mxevolve/domains/user/data-access";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";
import { DefinitionInputComponent } from "@mxevolve/domains/business-process/ui";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import {
  checkPrefilledBranch,
  checkPrefilledEntities,
  prefilledIds,
  resolvePrefilledRecipients,
} from "../../shared/dead-prefill";
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
 * Build & Test definition executor rendered as Page 2 of the generic multi-page
 * dialog (VAL-27132 Step 9). Signals + Angular Reactive Forms migration of the
 * legacy `BuildAndTestDefinitionExecutorComponent` /
 * `ExecuteBuildAndTestProcessInputComponent` — every field, validator,
 * conditional and the submit payload are reproduced exactly.
 *
 * Prefilled (non-editable) definition inputs are shown read-only in the
 * collapsible "{name} Details" panel; the form below shows only the
 * non-prefilled fields (legacy `shouldShow` rules via `shouldShowInForm`).
 */
@Component({
  selector: "mxevolve-build-and-test-executor",
  templateUrl: "./build-and-test-executor.component.html",
  imports: [
    ReactiveFormsModule,
    Checkbox,
    InputText,
    Button,
    MxevolveIconComponent,
    BuildAndTestPrefilledInputsComponent,
    InfraGroupSelectorComponent,
    NotificationsRecipientsInputComponent,
    UserStoryInputComponent,
    ScenarioDefinitionDropdownComponent,
    RepositorySelectorComponent,
    BranchInputComponent,
    DefinitionInputComponent,
  ],
  providers: [
    BuildAndTestProcessExecutorService,
    RepositoryService,
    ScenarioDefinitionService,
    InfraGroupService,
    UserService,
  ],
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

  private readonly executorService = inject(BuildAndTestProcessExecutorService);
  private readonly repositoryService = inject(RepositoryService);
  private readonly scenarioService = inject(ScenarioDefinitionService);
  private readonly infraGroupService = inject(InfraGroupService);
  private readonly branchService = inject(BranchService);
  private readonly analyticsTracker = inject(AnalyticsTrackerService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly executing = signal(false);
  protected readonly detailsExpanded = signal(false);
  protected readonly skipEnvironmentDeployment = signal(false);
  /** True while the pre-filled values are being resolved (W1); blocks submission. */
  protected readonly resolvingPrefill = signal(false);
  /**
   * Bumped whenever a validator is applied after the form is built, so
   * {@link visibility} can re-derive. The definition-only probe form cannot see
   * those later changes on its own.
   */
  private readonly formRevision = signal(0);

  /** Exposed for the template's `[class.required]` label bindings (legacy parity). */
  protected readonly Validators = Validators;

  /**
   * Definition-only probe form used solely to compute field visibility. It is
   * never seeded with the repush {@link initialValues}, so pre-filled editable
   * fields keep testing as "invalid/empty" here and therefore stay visible in
   * the form instead of collapsing into the read-only details panel.
   */
  private readonly visibilityForm = computed(() =>
    buildBuildAndTestExecutorForm(this.definition().providedInputs)
  );

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

  /**
   * Editable-field visibility, evaluated from each control's initial state
   * exactly like the legacy `DefinitionInputComponent.shouldShow` (computed once
   * at form init): a prefilled (valid) field is hidden here and shown read-only
   * in the details panel instead.
   */
  protected readonly visibility = computed(() => {
    const controls = this.visibilityForm().controls;
    // A field that turns required after this snapshot - the configuration
    // branches are cleared when the create-branch answer changes, the build
    // scenario when the skip toggle flips - must not stay hidden, or the run
    // becomes impossible to submit.
    this.formRevision();
    const live = this.form().controls;
    const show = (
      field: keyof typeof controls,
      mode: Parameters<typeof shouldShowInForm>[1]
    ): boolean =>
      shouldShowInForm(controls[field], mode) ||
      mustStayReachable(live[field], Validators.required);
    return {
      name: show("name", "ACCESS_INVALID_INPUTS_ONLY"),
      repositoryId: show("repositoryId", "ACCESS_INVALID_INPUTS_ONLY"),
      configurationBranchName: show("configurationBranchName", "ACCESS_INVALID_INPUTS_ONLY"),
      configurationParentBranch: show("configurationParentBranch", "ACCESS_INVALID_INPUTS_ONLY"),
      buildScenarioDefinitionId: show("buildScenarioDefinitionId", "ACCESS_INVALID_INPUTS_ONLY"),
      userStoryIds: show("userStoryIds", "ACCESS_INVALID_INPUTS_ONLY"),
      buildEnvironmentInfraGroup: show("buildEnvironmentInfraGroup", "ACCESS_INVALID_INPUTS_ONLY"),
      buildAndTestInfraGroup: show("buildAndTestInfraGroup", "ACCESS_INVALID_INPUTS_ONLY"),
      notificationsRecipients: show("notificationsRecipients", "ACCESS_EMPTY_OPTIONAL_INPUTS"),
    };
  });

  protected readonly showConfigurationGroup = computed(() => {
    const visibility = this.visibility();
    return (
      visibility.repositoryId ||
      visibility.configurationBranchName ||
      visibility.configurationParentBranch
    );
  });

  protected readonly showInfrastructureGroup = computed(() => {
    const visibility = this.visibility();
    return (
      visibility.buildEnvironmentInfraGroup || visibility.buildAndTestInfraGroup
    );
  });

  private wiredForm: BuildAndTestExecutorForm | null = null;

  constructor() {
    effect(() => {
      const form = this.form();
      if (this.wiredForm === form) {
        return;
      }
      this.wiredForm = form;
      this.wireSkipEnvironmentDeployment(form);
      this.resolvePrefills(form);
    });
  }

  protected toggleDetails(): void {
    this.detailsExpanded.update((expanded) => !expanded);
  }

  /**
   * Legacy `mxevolveUsageTracker` binding on the skip toggle (VAL-27132 REV-2),
   * which was dropped in the migration. Reproduced here rather than importing
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
   * no executor, so a failed lookup was swallowed entirely (VAL-27132 R3).
   */
  protected showSelectorError(message: string): void {
    this.toast.showError(message);
  }

  /**
   * Resolves every value the definition pre-filled, whether or not its field is
   * shown (VAL-27132 W1). Legacy resolved these as a side effect of content
   * projection instantiating hidden fields; the new executor gates visibility
   * with a structural `@if`, so nothing would otherwise fetch them and a stale
   * id would sail through `Validators.required` into the submitted payload.
   */
  private resolvePrefills(form: BuildAndTestExecutorForm): void {
    const projectId = this.projectId();
    const controls = form.controls;
    this.resolvingPrefill.set(true);
    forkJoin([
      this.resolveRepositoryThenBranches(form),
      this.resolveEntity(controls.buildScenarioDefinitionId, (id) =>
        this.scenarioService.getScenarioDefinitionById(id, projectId)
      ),
      this.resolveEntity(controls.buildEnvironmentInfraGroup, (id) =>
        this.infraGroupService.getGroup(projectId, id)
      ),
      this.resolveEntity(controls.buildAndTestInfraGroup, (id) =>
        this.infraGroupService.getGroup(projectId, id)
      ),
      resolvePrefilledRecipients(
        controls.notificationsRecipients,
        projectId,
        (id, emails) => this.userService.fetchUsersByEmails(id, emails),
        this.toast
      ),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.resolvingPrefill.set(false));
  }

  /**
   * A branch is only meaningful against a repository that still resolves, so the
   * two configuration branches wait for the repository lookup and are skipped
   * when it comes back dead — otherwise every branch would report a second,
   * misleading failure.
   */
  private resolveRepositoryThenBranches(
    form: BuildAndTestExecutorForm
  ): Observable<void> {
    const controls = form.controls;
    return this.resolveEntity(controls.repositoryId, (id) =>
      this.repositoryService.getRepository(this.projectId(), id)
    ).pipe(
      switchMap(() => {
        const repositoryId = controls.repositoryId.value;
        if (!repositoryId || controls.repositoryId.invalid) {
          return of(undefined);
        }
        return forkJoin([
          this.resolveHiddenBranch(controls.configurationBranchName, {
            visible: this.visibility().configurationBranchName,
            repositoryId,
            mustExist: false,
            message: CONFIGURATION_BRANCH_EXISTS,
          }),
          this.resolveHiddenBranch(controls.configurationParentBranch, {
            visible: this.visibility().configurationParentBranch,
            repositoryId,
            mustExist: true,
            message: CONFIGURATION_PARENT_BRANCH_MISSING,
          }),
        ]).pipe(map(() => undefined));
      })
    );
  }

  private resolveEntity(
    control: FormControl<string | null>,
    lookup: (id: string) => Observable<unknown>
  ): Observable<void> {
    return checkPrefilledEntities(
      control,
      prefilledIds(control.value),
      lookup,
      this.toast
    );
  }

  /**
   * A *shown* branch field is already validated by `mxevolve-branch-input`, which
   * checks its initial value and raises the same toast through `initialInvalid`;
   * only the hidden case needs resolving here.
   */
  private resolveHiddenBranch(
    control: FormControl<string | null>,
    options: {
      visible: boolean;
      repositoryId: string;
      mustExist: boolean;
      message: string;
    }
  ): Observable<void> {
    if (options.visible) {
      return of(undefined);
    }
    return checkPrefilledBranch(
      control,
      this.branchService,
      {
        projectId: this.projectId(),
        repositoryId: options.repositoryId,
        branchName: control.value ?? "",
      },
      { mustExist: options.mustExist, message: options.message },
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
      .executeBuildAndTestProcessDefinition(
        this.projectId(),
        this.toRequest(form)
      )
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
        // Applied with `emitEvent: false`, so tell `visibility` explicitly.
        this.formRevision.update((revision) => revision + 1);
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
