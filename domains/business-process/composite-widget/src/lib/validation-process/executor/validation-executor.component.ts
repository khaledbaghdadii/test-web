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
import {
  EMPTY,
  Observable,
  combineLatest,
  forkJoin,
  from,
  of,
  startWith,
} from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import { InputText } from "primeng/inputtext";
import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";
import { Button } from "primeng/button";
import {
  BusinessProcessDefinition,
  ExecuteValidationProcessRequest,
  ValidationProcessExecutorService,
} from "@mxevolve/domains/business-process/data-access";
import {
  BranchService,
  DevelopmentService,
  RepositoryService,
} from "@mxevolve/domains/scm/data-access";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import { ScenarioDefinitionService } from "@mxevolve/domains/test/data-access";
import { FinalProductApiService } from "@mxevolve/domains/artifact/data-access";
import {
  isValidationScopeStartCommitVisible,
  shouldShowInForm,
} from "@mxevolve/domains/business-process/util";
import {
  InfraGroupSelectorComponent,
  NotificationsRecipientsInputComponent,
  ValidationPrefilledInputsComponent,
} from "@mxevolve/domains/business-process/widget";
import { ScenarioDefinitionMultiselectDropdownComponent } from "@mxevolve/domains/test/widget";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { DefinitionInputComponent } from "@mxevolve/domains/business-process/ui";
import { ScopeStartCommitInputComponent } from "../scope-start-commit-input/scope-start-commit-input.component";
import { ValidationConfigurationParametersComponent } from "./configuration-parameters/validation-configuration-parameters.component";
import {
  checkPrefilledBranch,
  checkPrefilledEntities,
  prefilledIds,
} from "../../shared/dead-prefill";
import { InputVisibilityStore } from "../../shared/input-visibility.store";
import {
  ValidationExecutorForm,
  ValidationExecutorSeed,
  buildValidationExecutorForm,
} from "./validation-executor.form";

/** Legacy toast shown when a branch expected to exist is missing from the repository. */
const BRANCH_MISSING =
  "The branch name available in the Process Template doesn't exist in the repository. Please check the name and try again with an existing branch.";

/** Legacy toast shown when a branch about to be created already exists. */
const BRANCH_ALREADY_EXISTS =
  "The branch name available in the Process Template already exists in the repository. Please update the Process Template with a unique name to create a new branch.";

/** Feature flag gating the conditional `validationScopeStartCommitId` field. */
const ARCHIVAL_FEATURE_FLAG = "jira-user-story-archival";

interface ScopeVisibilitySnapshot {
  official: unknown;
  businessProcessQualityLevel: unknown;
  createBranch: unknown;
  parentBranchName: unknown;
  archivalBranchName: unknown;
  rtpCommitId: unknown;
}

/**
 * Validation definition executor rendered as Page 2 of the generic multi-page
 * dialog (VAL-27132 Step 15). Signals + Angular Reactive Forms migration of the
 * legacy `ValidationProcessDefinitionExecutorComponent` /
 * `ExecuteValidationProcessInputComponent` — every field, validator and the
 * submit payload are reproduced exactly, including the flag-gated, multi-condition
 * `validationScopeStartCommitId` field.
 *
 * Prefilled (non-editable) definition inputs are shown read-only in the
 * collapsible "{name} Details" panel; the form below shows only the
 * non-prefilled fields (legacy `shouldShow` rules via `shouldShowInForm`).
 */
@Component({
  selector: "mxevolve-validation-executor",
  templateUrl: "./validation-executor.component.html",
  imports: [
    ReactiveFormsModule,
    InputText,
    RadioButton,
    Select,
    Button,
    MxevolveIconComponent,
    ValidationPrefilledInputsComponent,
    InfraGroupSelectorComponent,
    NotificationsRecipientsInputComponent,
    ScenarioDefinitionMultiselectDropdownComponent,
    DefinitionInputComponent,
    ValidationConfigurationParametersComponent,
    ScopeStartCommitInputComponent,
  ],
  providers: [
    ValidationProcessExecutorService,
    RepositoryService,
    ScenarioDefinitionService,
    InfraGroupService,
    InputVisibilityStore,
  ],
})
export class ValidationExecutorComponent {
  readonly projectId = input.required<string>();
  readonly definition = input.required<BusinessProcessDefinition>();
  /**
   * Optional starting values for the editable fields (used by Repush to
   * pre-fill the form from a previous run). Undefined for a new run.
   */
  readonly initialValues = input<ValidationExecutorSeed>();
  readonly created = output<string>();

  private readonly executorService = inject(ValidationProcessExecutorService);
  private readonly developmentService = inject(DevelopmentService);
  private readonly repositoryService = inject(RepositoryService);
  private readonly scenarioService = inject(ScenarioDefinitionService);
  private readonly infraGroupService = inject(InfraGroupService);
  private readonly finalProductService = inject(FinalProductApiService);
  private readonly branchService = inject(BranchService);
  private readonly featureFlags = inject(FeatureFlagResolver);
  private readonly toast = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly inputVisibility = inject(InputVisibilityStore);

  protected readonly executing = signal(false);
  protected readonly detailsExpanded = signal(false);
  /** True while the pre-filled values are being resolved (W1); blocks submission. */
  protected readonly resolvingPrefill = signal(false);

  /** Exposed for the template's `[class.required]` label bindings (legacy parity). */
  protected readonly Validators = Validators;

  /** `jira-user-story-archival` flag, resolved once per project. */
  private readonly archivalFlag = signal(false);
  /** Parent branch resolved from the SCM developments lookup (or `null`). */
  private readonly resolvedParentBranch = signal<string | null>(null);
  /** Snapshot of the visibility-relevant control values, kept in sync with the form. */
  private readonly scopeSnapshot = signal<ScopeVisibilitySnapshot>({
    official: null,
    businessProcessQualityLevel: null,
    createBranch: null,
    parentBranchName: null,
    archivalBranchName: null,
    rtpCommitId: null,
  });

  protected readonly form = computed(() => {
    const form = buildValidationExecutorForm(this.definition().providedInputs);
    const seed = this.initialValues();
    if (seed) {
      form.patchValue(seed);
    }
    return form;
  });

  /**
   * Definition-only probe form used solely to compute per-field visibility; it
   * is never seeded with the repush {@link initialValues}, so pre-filled
   * editable fields stay visible in the form instead of collapsing into the
   * read-only details panel.
   */
  private readonly visibilityForm = computed(() =>
    buildValidationExecutorForm(this.definition().providedInputs)
  );

  protected readonly prefilledInputs = computed(
    () => this.definition().providedInputs
  );
  protected readonly detailsTitle = computed(
    () => `${this.definition().name} Details`
  );

  /**
   * Editable-field visibility, evaluated from each control's initial state
   * exactly like the legacy `DefinitionInputComponent.shouldShow`: a prefilled
   * (valid) field is hidden here and shown read-only in the details panel.
   * Access modes transcribed verbatim from the legacy executor template
   * (all `ACCESS_INVALID_INPUTS_ONLY` except notifications, which is
   * `ACCESS_EMPTY_OPTIONAL_INPUTS`).
   */
  protected readonly visibility = computed(() => {
    const controls = this.visibilityForm().controls;
    return {
      name: shouldShowInForm(controls.name, "ACCESS_INVALID_INPUTS_ONLY"),
      official: shouldShowInForm(
        controls.official,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      repositoryId: shouldShowInForm(
        controls.repositoryId,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      businessProcessQualityLevel: shouldShowInForm(
        controls.businessProcessQualityLevel,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      createBranch: shouldShowInForm(
        controls.createBranch,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      archivalBranchName: shouldShowInForm(
        controls.archivalBranchName,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      parentBranchName: shouldShowInForm(
        controls.parentBranchName,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      finalProductId: shouldShowInForm(
        controls.finalProductId,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      rtpCommitId: shouldShowInForm(
        controls.rtpCommitId,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      configCommitId: shouldShowInForm(
        controls.configCommitId,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      nightlyRepusherEnabled: shouldShowInForm(
        controls.nightlyRepusherEnabled,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      qualityGateScenarioDefinitionIds: shouldShowInForm(
        controls.qualityGateScenarioDefinitionIds,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      qualityGateInfraGroupId: shouldShowInForm(
        controls.qualityGateInfraGroupId,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      notificationsRecipients: shouldShowInForm(
        controls.notificationsRecipients,
        "ACCESS_EMPTY_OPTIONAL_INPUTS"
      ),
    };
  });

  /** Legacy MQG create-branch path: the parent branch becomes mandatory there. */
  protected readonly isMqgCreateBranch = computed(() => {
    const snapshot = this.scopeSnapshot();
    return (
      snapshot.businessProcessQualityLevel === "MQG" &&
      snapshot.createBranch === true
    );
  });

  protected readonly showConfigurationGroup = computed(() => {
    const visibility = this.visibility();
    return (
      visibility.repositoryId ||
      visibility.businessProcessQualityLevel ||
      visibility.createBranch ||
      visibility.archivalBranchName ||
      this.isMqgCreateBranch() ||
      visibility.finalProductId ||
      visibility.rtpCommitId
    );
  });

  protected readonly showTestsGroup = computed(() => {
    const visibility = this.visibility();
    return (
      visibility.nightlyRepusherEnabled ||
      visibility.qualityGateScenarioDefinitionIds
    );
  });
  /** Resolved parent branch scoping the suggested scope-start-commit list. */
  protected readonly scopeParentBranch = computed(
    () => this.resolvedParentBranch() ?? undefined
  );

  /**
   * Whether the conditional `validationScopeStartCommitId` field is shown.
   * Combines the resolved feature flag, the resolved parent branch and the live
   * form snapshot through the pure `isValidationScopeStartCommitVisible` util.
   */
  protected readonly showScopeStartCommit = computed(() =>
    isValidationScopeStartCommitVisible(
      {
        ...this.scopeSnapshot(),
        resolvedParentBranch: this.resolvedParentBranch(),
      },
      this.archivalFlag()
    )
  );

  /**
   * Final product the definition (or the repush seed) already points at, used by
   * the existing-branch path to warn when the branch carries a newer one.
   */
  protected readonly preselectedFinalProductId = computed(
    () => this.initialValues()?.finalProductId ?? null
  );

  private wiredForm: ValidationExecutorForm | null = null;

  constructor() {
    // Legacy handed each nested `definition-input` its own `[inputAccessMode]`;
    // the nested groups here read the executor's map instead (W3, V1/V2).
    this.inputVisibility.connect(this.visibility);

    effect(() => {
      const form = this.form();
      if (this.wiredForm !== form) {
        this.wiredForm = form;
        this.wireScopeVisibility(form);
        this.resolvePrefills(form);
      }
      this.applyMqgCreateBranchValidators(form);
      this.applyScopeValidators(form, this.showScopeStartCommit());
    });
  }

  protected toggleDetails(): void {
    this.detailsExpanded.update((expanded) => !expanded);
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
   * shown (VAL-27132 W1).
   */
  private resolvePrefills(form: ValidationExecutorForm): void {
    const projectId = this.projectId();
    const controls = form.controls;
    this.resolvingPrefill.set(true);
    forkJoin([
      this.resolveRepositoryThenBranches(form),
      this.resolveEntity(controls.qualityGateInfraGroupId, (id) =>
        this.infraGroupService.getGroup(projectId, id)
      ),
      this.resolveEntity(controls.qualityGateScenarioDefinitionIds, (id) =>
        this.scenarioService.getScenarioDefinitionById(id, projectId)
      ),
      this.resolveEntity(controls.finalProductId, (id) =>
        this.finalProductService.getFinalProductById(projectId, id)
      ),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.resolvingPrefill.set(false));
  }

  /**
   * A branch is only meaningful against a repository that still resolves, so the
   * archival and parent branches wait for the repository lookup and are skipped
   * when it comes back dead.
   */
  private resolveRepositoryThenBranches(
    form: ValidationExecutorForm
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
        const shown = this.renderedBranchFields(form);
        // Legacy `[branchShouldExist]`: a branch about to be created must NOT
        // exist yet, otherwise it must already be there.
        const creating = controls.createBranch.value === true;
        return forkJoin([
          this.resolveHiddenBranch(controls.parentBranchName, {
            visible: shown.parentBranchName,
            repositoryId,
            mustExist: true,
            message: BRANCH_MISSING,
          }),
          this.resolveHiddenBranch(controls.archivalBranchName, {
            visible: shown.archivalBranchName,
            repositoryId,
            mustExist: !creating,
            message: creating ? BRANCH_ALREADY_EXISTS : BRANCH_MISSING,
          }),
        ]).pipe(map(() => undefined));
      })
    );
  }

  /**
   * Whether each branch field is actually rendered. Both live inside the MQG/DQG
   * configuration sub-forms, so the parent branch only appears on the MQG
   * create-branch path, while the archival branch appears on either quality
   * level once the create-branch choice has been made.
   */
  private renderedBranchFields(form: ValidationExecutorForm): {
    parentBranchName: boolean;
    archivalBranchName: boolean;
  } {
    const controls = form.controls;
    const level = controls.businessProcessQualityLevel.value;
    const createBranch = controls.createBranch.value;
    const group = this.showConfigurationGroup();
    return {
      parentBranchName: group && level === "MQG" && createBranch === true,
      archivalBranchName:
        group && (level === "MQG" || level === "DQG") && createBranch !== null,
    };
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

  /**
   * A *shown* branch field is already validated by `mxevolve-branch-input`, which
   * raises the same toast through `initialInvalid`; only the hidden case needs
   * resolving here.
   */
  private resolveHiddenBranch(
    control: AbstractControl,
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
        branchName: (control.value as string | null) ?? "",
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
      .executeValidationProcessDefinition(
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
   * Wires the reactive sources feeding the scope-commit visibility, mirroring
   * the legacy `ValidationScopeStartCommitIdStateResolverService` +
   * `ValidationScopeStartCommitIdParentBranchResolverService`: the feature flag,
   * the parent-branch lookup and the snapshot of the visibility-relevant fields.
   */
  private wireScopeVisibility(form: ValidationExecutorForm): void {
    const projectId = this.projectId();

    from(this.featureFlags.isFeatureEnabled(projectId, ARCHIVAL_FEATURE_FLAG))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((enabled) => this.archivalFlag.set(enabled));

    combineLatest([
      form.controls.createBranch.valueChanges.pipe(
        startWith(form.controls.createBranch.value)
      ),
      form.controls.parentBranchName.valueChanges.pipe(
        startWith(form.controls.parentBranchName.value)
      ),
      form.controls.archivalBranchName.valueChanges.pipe(
        startWith(form.controls.archivalBranchName.value)
      ),
      form.controls.repositoryId.valueChanges.pipe(
        startWith(form.controls.repositoryId.value)
      ),
    ])
      .pipe(
        switchMap(
          ([
            createBranch,
            parentBranchName,
            archivalBranchName,
            repositoryId,
          ]) => {
            if (createBranch === true) {
              return of(parentBranchName ?? null);
            }
            if (!repositoryId || !archivalBranchName) {
              return of<string | null>(null);
            }
            return this.developmentService
              .getDevelopments(projectId, {
                repositoryId,
                name: archivalBranchName,
              })
              .pipe(
                map((developments) => developments.content[0]?.source ?? null),
                catchError(() => of<string | null>(null))
              );
          }
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((resolved) => this.resolvedParentBranch.set(resolved));

    form.valueChanges
      .pipe(startWith(form.getRawValue()), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateScopeSnapshot(form));
    this.updateScopeSnapshot(form);
  }

  /** Keeps the visibility-relevant control values mirrored into a signal. */
  private updateScopeSnapshot(form: ValidationExecutorForm): void {
    const value = form.getRawValue();
    this.scopeSnapshot.set({
      official: value.official,
      businessProcessQualityLevel: value.businessProcessQualityLevel,
      createBranch: value.createBranch,
      parentBranchName: value.parentBranchName,
      archivalBranchName: value.archivalBranchName,
      rtpCommitId: value.rtpCommitId,
    });
  }

  /**
   * Mirrors the legacy `updateCommitIdValidators`: requires the scope start
   * commit when the field is visible, otherwise clears its validator and resets
   * the value so a hidden field never blocks submission.
   */
  private applyScopeValidators(
    form: ValidationExecutorForm,
    visible: boolean
  ): void {
    const control = form.controls.validationScopeStartCommitId;
    if (visible) {
      control.setValidators([Validators.required]);
    } else {
      control.clearValidators();
      control.reset(null, { emitEvent: false });
    }
    control.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Legacy MQG new-branch initialization makes Parent Branch mandatory when
   * Final Product is required; the branch scopes the product chooser.
   */
  private applyMqgCreateBranchValidators(form: ValidationExecutorForm): void {
    const control = form.controls.parentBranchName;
    if (
      this.isMqgCreateBranch() &&
      form.controls.finalProductId.hasValidator(Validators.required)
    ) {
      control.setValidators([Validators.required]);
    } else {
      control.clearValidators();
    }
    control.updateValueAndValidity({ emitEvent: false });
  }

  private toRequest(
    form: ValidationExecutorForm
  ): ExecuteValidationProcessRequest {
    const value = form.getRawValue();
    return {
      name: value.name ?? "",
      definitionId: this.definition().id,
      official: value.official ?? false,
      notificationsRecipients: value.notificationsRecipients ?? undefined,
      configurationParameters: {
        repositoryId: value.repositoryId ?? "",
        businessProcessQualityLevel: value.businessProcessQualityLevel ?? "",
        createBranch: value.createBranch ?? false,
        parentBranchName: value.parentBranchName ?? undefined,
        archivalBranchName: value.archivalBranchName ?? "",
        configCommitId: value.configCommitId ?? "",
        rtpCommitId: value.rtpCommitId ?? "",
        finalProductId: value.finalProductId ?? "",
      },
      testParameters: {
        qualityGateScenarioDefinitionIds:
          value.qualityGateScenarioDefinitionIds ?? [],
        nightlyRepusherEnabled: value.nightlyRepusherEnabled ?? false,
      },
      infrastructureParameters: {
        qualityGateInfraGroupId: value.qualityGateInfraGroupId ?? "",
      },
      validationScopeParameters: {
        startCommitId: value.validationScopeStartCommitId ?? null,
      },
    };
  }
}
