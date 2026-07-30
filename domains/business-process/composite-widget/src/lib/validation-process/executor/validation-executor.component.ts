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
import { EMPTY, combineLatest, from, of, startWith } from "rxjs";
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
import { DevelopmentService } from "@mxevolve/domains/scm/data-access";
import {
  isProvidedByDefinition,
  isValidationScopeStartCommitVisible,
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
import {
  DefinitionInputComponent,
  DefinitionInputGroupComponent,
} from "@mxevolve/domains/business-process/ui";
import { ScopeStartCommitInputComponent } from "../scope-start-commit-input/scope-start-commit-input.component";
import { ValidationConfigurationParametersComponent } from "./configuration-parameters/validation-configuration-parameters.component";
import {
  ValidationExecutorForm,
  ValidationExecutorSeed,
  buildValidationExecutorForm,
} from "./validation-executor.form";

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
 * dialog. Signals + Angular Reactive Forms migration of the
 * legacy `ValidationProcessDefinitionExecutorComponent` /
 * `ExecuteValidationProcessInputComponent` — every field, validator and the
 * submit payload are reproduced exactly, including the flag-gated, multi-condition
 * `validationScopeStartCommitId` field.
 *
 * Pre-filled definition inputs are shown read-only in the collapsible
 * "{name} Details" panel; the form below shows the editable fields.
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
    DefinitionInputGroupComponent,
    ValidationConfigurationParametersComponent,
    ScopeStartCommitInputComponent,
  ],
  providers: [ValidationProcessExecutorService],
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
  private readonly featureFlags = inject(FeatureFlagResolver);
  private readonly toast = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly executing = signal(false);
  protected readonly detailsExpanded = signal(false);

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

  protected readonly prefilledInputs = computed(
    () => this.definition().providedInputs
  );
  protected readonly detailsTitle = computed(
    () => `${this.definition().name} Details`
  );

  /** Legacy MQG create-branch path: the parent branch becomes mandatory there. */
  protected readonly isMqgCreateBranch = computed(() => {
    const snapshot = this.scopeSnapshot();
    return (
      snapshot.businessProcessQualityLevel === "MQG" &&
      snapshot.createBranch === true
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
    effect(() => {
      const form = this.form();
      if (this.wiredForm !== form) {
        this.wiredForm = form;
        this.wireScopeVisibility(form);
      }
      this.applyScopeValidators(form, this.showScopeStartCommit());
    });
  }

  protected notProvided(inputId: string): boolean {
    return !isProvidedByDefinition(this.definition().providedInputs, inputId);
  }

  protected toggleDetails(): void {
    this.detailsExpanded.update((expanded) => !expanded);
  }

  /**
   * Surfaces a selector's fetch failure. These outputs existed but were bound by
   * no executor, so a failed lookup was swallowed entirely.
   */
  protected showSelectorError(message: string): void {
    this.toast.showError(message);
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
