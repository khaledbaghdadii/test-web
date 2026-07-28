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
import { EMPTY, Observable, forkJoin, of } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import { InputText } from "primeng/inputtext";
import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";
import { Button } from "primeng/button";
import {
  BusinessProcessDefinition,
  ExecuteUpgradeProcessDefinitionRequest,
  UpgradeProcessDefinitionExecutorService,
} from "@mxevolve/domains/business-process/data-access";
import { shouldShowInForm } from "@mxevolve/domains/business-process/util";
import {
  InfraGroupSelectorComponent,
  NotificationsRecipientsInputComponent,
  UpgradePrefilledInputsComponent,
} from "@mxevolve/domains/business-process/widget";
import { FactoryProductSelectorComponent } from "@mxevolve/domains/artifact/widget";
import { FactoryProductApiService } from "@mxevolve/domains/artifact/data-access";
import { EnvironmentDefinitionSelectorComponent } from "@mxevolve/domains/environment/widget";
import { EnvironmentDefinitionService } from "@mxevolve/domains/environment/data-access";
import {
  RepositorySelectorComponent,
  BranchInputComponent,
} from "@mxevolve/domains/scm/widget";
import {
  BranchService,
  RepositoryService,
} from "@mxevolve/domains/scm/data-access";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import {
  ScenarioDefinitionDropdownComponent,
  ScenarioDefinitionMultiselectDropdownComponent,
} from "@mxevolve/domains/test/widget";
import { ScenarioDefinitionService } from "@mxevolve/domains/test/data-access";
import { DefinitionInputComponent } from "@mxevolve/domains/business-process/ui";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import {
  checkPrefilledBranch,
  checkPrefilledEntities,
  prefilledIds,
} from "../../shared/dead-prefill";
import {
  UpgradeExecutorForm,
  UpgradeExecutorSeed,
  UpgradeFactoryProductValue,
  buildUpgradeExecutorForm,
} from "./upgrade-executor.form";

/**
 * Legacy config-branch toast when the run is *not* creating a branch, so the
 * branch was expected to already exist (VAL-27132 REV-6 — this variant was lost
 * in the migration, leaving only the "already exists" one).
 */
const CONFIGURATION_BRANCH_MISSING =
  "The branch name available in the Process Template doesn't exist in the repository. Please check the name and try again with an existing branch.";

/** Legacy config-branch toast when the branch is about to be created. */
const CONFIGURATION_BRANCH_EXISTS =
  "The branch name available in the Process Template already exists in the repository. Please update the Process Template with a unique name to create a new branch.";

/** Legacy parent-branch toast — note "you entered", unlike every other variant. */
const CONFIGURATION_PARENT_BRANCH_MISSING =
  "The branch name you entered doesn't exist in the repository. Please check the name and try again with an existing branch.";

/**
 * Upgrade definition executor rendered as Page 2 of the generic multi-page
 * dialog (VAL-27132 Step 19). Signals + Angular Reactive Forms migration of the
 * legacy `UpgradeProcessDefinitionExecutorModalComponent` /
 * `ExecuteUpgradeProcessDefinitionInputsComponent` — the largest field set:
 * every field, validator and the mapped submit payload are reproduced exactly
 * (there is no conditional/flag-gated field for upgrade).
 *
 * Prefilled (non-editable) definition inputs are shown read-only in the
 * collapsible "{name} Details" panel; the form below shows only the
 * non-prefilled fields (legacy `shouldShow` rules via `shouldShowInForm`). Access
 * modes are transcribed verbatim from the legacy executor template — all
 * `ACCESS_INVALID_INPUTS_ONLY` except notifications, which is
 * `ACCESS_EMPTY_OPTIONAL_INPUTS`.
 */
@Component({
  selector: "mxevolve-upgrade-executor",
  templateUrl: "./upgrade-executor.component.html",
  imports: [
    ReactiveFormsModule,
    InputText,
    RadioButton,
    Select,
    Button,
    MxevolveIconComponent,
    UpgradePrefilledInputsComponent,
    InfraGroupSelectorComponent,
    NotificationsRecipientsInputComponent,
    FactoryProductSelectorComponent,
    EnvironmentDefinitionSelectorComponent,
    RepositorySelectorComponent,
    BranchInputComponent,
    ScenarioDefinitionDropdownComponent,
    ScenarioDefinitionMultiselectDropdownComponent,
    DefinitionInputComponent,
  ],
  providers: [
    UpgradeProcessDefinitionExecutorService,
    RepositoryService,
    ScenarioDefinitionService,
    EnvironmentDefinitionService,
    InfraGroupService,
  ],
})
export class UpgradeExecutorComponent {
  readonly projectId = input.required<string>();
  readonly definition = input.required<BusinessProcessDefinition>();
  /**
   * Optional starting values for the editable fields (used by Repush to
   * pre-fill the form from a previous run). Undefined for a new run.
   */
  readonly initialValues = input<UpgradeExecutorSeed>();
  readonly created = output<string>();

  private readonly executorService = inject(
    UpgradeProcessDefinitionExecutorService
  );
  private readonly repositoryService = inject(RepositoryService);
  private readonly scenarioService = inject(ScenarioDefinitionService);
  private readonly environmentDefinitionService = inject(
    EnvironmentDefinitionService
  );
  private readonly factoryProductService = inject(FactoryProductApiService);
  private readonly infraGroupService = inject(InfraGroupService);
  private readonly branchService = inject(BranchService);
  private readonly toast = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly executing = signal(false);
  protected readonly detailsExpanded = signal(false);
  /** True while the pre-filled values are being resolved (W1); blocks submission. */
  protected readonly resolvingPrefill = signal(false);

  /** Exposed for the template's `[class.required]` label bindings (legacy parity). */
  protected readonly Validators = Validators;

  /** BP quality level options (legacy MQG/DQG static list). */
  protected readonly qualityLevelOptions = [
    { label: "MQG", value: "MQG" },
    { label: "DQG", value: "DQG" },
  ];

  /** Upgrade jump options (legacy static list). */
  protected readonly upgradeJumpOptions = [
    { label: "Continuous Greening", value: "Continuous Greening" },
    { label: "Mainstream Activation", value: "Mainstream Activation" },
  ];

  private wiredForm: UpgradeExecutorForm | null = null;

  constructor() {
    effect(() => {
      const form = this.form();
      if (this.wiredForm !== form) {
        this.wiredForm = form;
        this.wireCreateBranchCascade(form);
        this.resolvePrefills(form);
      }
    });
  }

  protected readonly form = computed(() => {
    const form = buildUpgradeExecutorForm(this.definition().providedInputs);
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
    buildUpgradeExecutorForm(this.definition().providedInputs)
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
   */
  protected readonly visibility = computed(() => {
    const controls = this.visibilityForm().controls;
    return {
      official: shouldShowInForm(
        controls.official,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      name: shouldShowInForm(controls.name, "ACCESS_INVALID_INPUTS_ONLY"),
      factoryProduct: shouldShowInForm(
        controls.factoryProduct,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      parentMxArchivalBranch: shouldShowInForm(
        controls.parentMxArchivalBranch,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      upgradeJump: shouldShowInForm(
        controls.upgradeJump,
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
      configurationBranchName: shouldShowInForm(
        controls.configurationBranchName,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      configurationParentBranch: shouldShowInForm(
        controls.configurationParentBranch,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      qualityGateExecutionInfraGroupId: shouldShowInForm(
        controls.qualityGateExecutionInfraGroupId,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      binaryConversionInfraGroupId: shouldShowInForm(
        controls.binaryConversionInfraGroupId,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      testScenarioIds: shouldShowInForm(
        controls.testScenarioIds,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      technicalUpgradeTestScenarioId: shouldShowInForm(
        controls.technicalUpgradeTestScenarioId,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      referenceCommitId: shouldShowInForm(
        controls.referenceCommitId,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      referenceFactoryProduct: shouldShowInForm(
        controls.referenceFactoryProduct,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      referenceEnvironmentDefinitionId: shouldShowInForm(
        controls.referenceEnvironmentDefinitionId,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      referenceEnvironmentInfraGroupId: shouldShowInForm(
        controls.referenceEnvironmentInfraGroupId,
        "ACCESS_INVALID_INPUTS_ONLY"
      ),
      notificationsRecipients: shouldShowInForm(
        controls.notificationsRecipients,
        "ACCESS_EMPTY_OPTIONAL_INPUTS"
      ),
    };
  });

  protected readonly showMxGroup = computed(() => {
    const visibility = this.visibility();
    return (
      visibility.factoryProduct ||
      visibility.parentMxArchivalBranch ||
      visibility.upgradeJump
    );
  });

  protected readonly showConfigurationGroup = computed(() => {
    const visibility = this.visibility();
    return (
      visibility.repositoryId ||
      visibility.businessProcessQualityLevel ||
      visibility.createBranch ||
      visibility.configurationBranchName ||
      visibility.configurationParentBranch
    );
  });

  protected readonly showInfrastructureGroup = computed(() => {
    const visibility = this.visibility();
    return (
      visibility.qualityGateExecutionInfraGroupId ||
      visibility.binaryConversionInfraGroupId
    );
  });

  protected readonly showTestsGroup = computed(() => {
    const visibility = this.visibility();
    return (
      visibility.testScenarioIds || visibility.technicalUpgradeTestScenarioId
    );
  });

  protected readonly showReferenceEnvironmentGroup = computed(() => {
    const visibility = this.visibility();
    return (
      visibility.referenceCommitId ||
      visibility.referenceEnvironmentDefinitionId ||
      visibility.referenceFactoryProduct ||
      visibility.referenceEnvironmentInfraGroupId
    );
  });

  protected toggleDetails(): void {
    this.detailsExpanded.update((expanded) => !expanded);
  }

  /**
   * Legacy `resetConfigurationParamsInputs` cascade: a genuine repository change
   * invalidates the create-branch choice and the configuration/parent branches.
   */
  protected onRepositoryChanged(): void {
    const controls = this.form().controls;
    controls.createBranch.reset(null, { emitEvent: false });
    controls.configurationBranchName.reset(null, { emitEvent: false });
    controls.configurationParentBranch.reset(null, { emitEvent: false });
  }

  /**
   * Legacy `showConfigBranchError`: the message depends on which way the branch
   * was supposed to go. Not creating a branch means it had to already exist;
   * creating one means the name had to be free (VAL-27132 REV-6).
   */
  protected showConfigBranchError(): void {
    this.toast.showError(
      this.form().controls.createBranch.value === false
        ? CONFIGURATION_BRANCH_MISSING
        : CONFIGURATION_BRANCH_EXISTS
    );
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
   * shown (VAL-27132 W1). Upgrade carries the largest pre-filled set: both
   * factory products, the repository, both scenario fields, the reference
   * environment definition, three infra groups and the two configuration
   * branches.
   */
  private resolvePrefills(form: UpgradeExecutorForm): void {
    const projectId = this.projectId();
    const controls = form.controls;
    this.resolvingPrefill.set(true);
    forkJoin([
      this.resolveRepositoryThenBranches(form),
      this.resolveEntity(controls.factoryProduct, (id) =>
        this.factoryProductService.getFactoryProductById(projectId, id)
      ),
      this.resolveEntity(controls.referenceFactoryProduct, (id) =>
        this.factoryProductService.getFactoryProductById(projectId, id)
      ),
      this.resolveEntity(controls.testScenarioIds, (id) =>
        this.scenarioService.getScenarioDefinitionById(id, projectId)
      ),
      this.resolveEntity(controls.technicalUpgradeTestScenarioId, (id) =>
        this.scenarioService.getScenarioDefinitionById(id, projectId)
      ),
      this.resolveEntity(controls.referenceEnvironmentDefinitionId, (id) =>
        this.environmentDefinitionService.getEnvironmentDefinitionById(
          projectId,
          id
        )
      ),
      this.resolveEntity(controls.qualityGateExecutionInfraGroupId, (id) =>
        this.infraGroupService.getGroup(projectId, id)
      ),
      this.resolveEntity(controls.binaryConversionInfraGroupId, (id) =>
        this.infraGroupService.getGroup(projectId, id)
      ),
      this.resolveEntity(controls.referenceEnvironmentInfraGroupId, (id) =>
        this.infraGroupService.getGroup(projectId, id)
      ),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.resolvingPrefill.set(false));
  }

  /**
   * A branch is only meaningful against a repository that still resolves, so the
   * two configuration branches wait for the repository lookup and are skipped
   * when it comes back dead.
   */
  private resolveRepositoryThenBranches(
    form: UpgradeExecutorForm
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
            // Legacy `[branchShouldExist]="createBranchFormControl.value !== true"`:
            // when the run is not creating a branch, the configuration branch
            // must already exist (REV-5).
            mustExist: controls.createBranch.value !== true,
            message:
              controls.createBranch.value === false
                ? CONFIGURATION_BRANCH_MISSING
                : CONFIGURATION_BRANCH_EXISTS,
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

  /**
   * Legacy cascade: changing the create-branch choice resets the configuration
   * and parent branches (they are re-validated against the new mode).
   */
  private wireCreateBranchCascade(form: UpgradeExecutorForm): void {
    form.controls.createBranch.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        form.controls.configurationBranchName.reset(null, {
          emitEvent: false,
        });
        form.controls.configurationParentBranch.reset(null, {
          emitEvent: false,
        });
      });
  }

  protected build(): void {
    const form = this.form();
    if (form.invalid || this.executing()) {
      return;
    }
    this.executing.set(true);
    this.executorService
      .executeUpgradeProcessDefinition(this.toRequest(form))
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
        this.created.emit(response.upgradeProcessExecutionId);
      });
  }

  /**
   * Transcribes the legacy `getExecuteUpgradeProcessRequest` mapper field-by-field:
   * form control values (prefilled seeds + the user-entered name/official) are
   * mapped into the nested MX / configuration / infrastructure / test /
   * reference-environment request payload. Notably `technicalUpgradeTestScenarioId`
   * maps to `testParameters.binaryConversionScenarioDefinitionId`,
   * `testScenarioIds` to `testParameters.qualityGateScenarioDefinitionIds`, and
   * `configurationParentBranch` to `configurationParameters.configurationParentBranchName`.
   */
  private toRequest(
    form: UpgradeExecutorForm
  ): ExecuteUpgradeProcessDefinitionRequest {
    const value = form.getRawValue();
    return {
      projectId: this.projectId(),
      name: value.name ?? "",
      definitionId: this.definition().id,
      official: value.official ?? false,
      notificationsRecipients: value.notificationsRecipients ?? undefined,
      mxParameters: {
        parentMxArchivalBranch: value.parentMxArchivalBranch ?? "",
        upgradeJump: value.upgradeJump ?? "",
        conversionFactoryProduct: this.toFactoryProduct(value.factoryProduct),
      },
      configurationParameters: {
        repositoryId: value.repositoryId ?? "",
        createBranch: value.createBranch ?? false,
        configurationBranchName: value.configurationBranchName ?? "",
        configurationParentBranchName: value.configurationParentBranch ?? "",
        businessProcessQualityLevel: value.businessProcessQualityLevel ?? "",
      },
      infrastructureParameters: {
        qualityGateExecutionInfraGroupId:
          value.qualityGateExecutionInfraGroupId ?? "",
        binaryConversionInfraGroupId: value.binaryConversionInfraGroupId ?? "",
      },
      testParameters: {
        binaryConversionScenarioDefinitionId:
          value.technicalUpgradeTestScenarioId ?? "",
        qualityGateScenarioDefinitionIds: value.testScenarioIds ?? [],
      },
      referenceEnvironmentParameters: {
        referenceCommitId: value.referenceCommitId ?? "",
        referenceFactoryProduct: this.toFactoryProduct(
          value.referenceFactoryProduct
        ),
        referenceEnvironmentDefinitionId:
          value.referenceEnvironmentDefinitionId ?? "",
        referenceEnvironmentInfraGroupId:
          value.referenceEnvironmentInfraGroupId ?? "",
      },
    };
  }

  private toFactoryProduct(
    value: UpgradeFactoryProductValue | null
  ): ExecuteUpgradeProcessDefinitionRequest["mxParameters"]["conversionFactoryProduct"] {
    return {
      id: value?.id ?? "",
      mxVersion: value?.mxVersion ?? "",
      mxBuildId: value?.mxBuildId ?? "",
      bipVersion: value?.bipVersion,
      bipBuildId: value?.bipBuildId,
    };
  }
}
