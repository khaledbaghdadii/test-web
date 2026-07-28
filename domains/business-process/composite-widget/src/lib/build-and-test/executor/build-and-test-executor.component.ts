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
import { shouldShowInForm } from "@mxevolve/domains/business-process/util";
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
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import {
  BuildAndTestExecutorForm,
  BuildAndTestExecutorSeed,
  buildBuildAndTestExecutorForm,
} from "./build-and-test-executor.form";

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

  private readonly executorService = inject(BuildAndTestProcessExecutorService);
  private readonly toast = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly executing = signal(false);
  protected readonly detailsExpanded = signal(false);
  protected readonly skipEnvironmentDeployment = signal(false);

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
    return {
      name: shouldShowInForm(controls.name, "ACCESS_INVALID_INPUTS_ONLY"),
      repositoryId: shouldShowInForm(
        controls.repositoryId,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      configurationBranchName: shouldShowInForm(
        controls.configurationBranchName,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      configurationParentBranch: shouldShowInForm(
        controls.configurationParentBranch,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      buildScenarioDefinitionId: shouldShowInForm(
        controls.buildScenarioDefinitionId,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      userStoryIds: shouldShowInForm(
        controls.userStoryIds,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      buildEnvironmentInfraGroup: shouldShowInForm(
        controls.buildEnvironmentInfraGroup,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      buildAndTestInfraGroup: shouldShowInForm(
        controls.buildAndTestInfraGroup,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      notificationsRecipients: shouldShowInForm(
        controls.notificationsRecipients,
        "ACCESS_EMPTY_OPTIONAL_INPUTS"
      ),
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
    });
  }

  protected toggleDetails(): void {
    this.detailsExpanded.update((expanded) => !expanded);
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
    this.toast.showError(
      "The branch name available in the BP definition or pre-filled in the pop-up already exists in the repository. Please update the definition or the pop-up with a unique name to create a new branch."
    );
  }

  /** Legacy toast when the configuration parent branch does not exist. */
  protected showParentBranchError(): void {
    this.toast.showError(
      "The branch name available in the BP definition doesn't exist in the repository. Please check the name and try again with an existing branch."
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
