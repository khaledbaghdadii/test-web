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
  FormControl,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { EMPTY } from "rxjs";
import { catchError, filter } from "rxjs/operators";
import { InputText } from "primeng/inputtext";
import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";
import { Button } from "primeng/button";
import {
  BusinessProcessDefinition,
  ExecuteUpgradeProcessDefinitionRequest,
  UpgradeProcessDefinitionExecutorService,
} from "@mxevolve/domains/business-process/data-access";
import {
  isProvidedByDefinition,
} from "@mxevolve/domains/business-process/util";
import {
  InfraGroupSelectorComponent,
  NotificationsRecipientsInputComponent,
  UpgradePrefilledInputsComponent,
} from "@mxevolve/domains/business-process/widget";
import {
  BipBuildIdDropdownComponent,
  BipVersionDropdownComponent,
  FactoryProductSelectionDirective,
  MxBuildIdDropdownComponent,
  MxVersionDropdownComponent,
} from "@mxevolve/domains/artifact/widget";
import { EnvironmentDefinitionSelectorComponent } from "@mxevolve/domains/environment/widget";
import {
  RepositorySelectorComponent,
  BranchInputComponent,
} from "@mxevolve/domains/scm/widget";
import {
  ScenarioDefinitionDropdownComponent,
  ScenarioDefinitionMultiselectDropdownComponent,
} from "@mxevolve/domains/test/widget";
import {
  DefinitionInputComponent,
  DefinitionInputGroupComponent,
} from "@mxevolve/domains/business-process/ui";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import {
  UpgradeExecutorForm,
  UpgradeExecutorSeed,
  UpgradeFactoryProductValue,
  buildUpgradeExecutorForm,
} from "./upgrade-executor.form";

/**
 * Legacy config-branch toast when the run is *not* creating a branch, so the
 * branch was expected to already exist. This variant was lost in the migration,
 * leaving only the "already exists" one.
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
 * dialog. Signals + Angular Reactive Forms migration of the
 * legacy `UpgradeProcessDefinitionExecutorModalComponent` /
 * `ExecuteUpgradeProcessDefinitionInputsComponent` — the largest field set:
 * every field, validator and the mapped submit payload are reproduced exactly
 * (there is no conditional/flag-gated field for upgrade).
 *
 * Pre-filled definition inputs are shown read-only in the collapsible
 * "{name} Details" panel; the form below shows the editable fields. Access
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
    EnvironmentDefinitionSelectorComponent,
    RepositorySelectorComponent,
    BranchInputComponent,
    ScenarioDefinitionDropdownComponent,
    ScenarioDefinitionMultiselectDropdownComponent,
    DefinitionInputComponent,
    DefinitionInputGroupComponent,
    FactoryProductSelectionDirective,
    MxVersionDropdownComponent,
    MxBuildIdDropdownComponent,
    BipVersionDropdownComponent,
    BipBuildIdDropdownComponent,
  ],
  providers: [UpgradeProcessDefinitionExecutorService],
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
  private readonly toast = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly executing = signal(false);
  protected readonly detailsExpanded = signal(false);

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
        this.wireRepositoryClearedCascade(form);
      }
    });
  }

  protected readonly form = computed(() => {
    const form = buildUpgradeExecutorForm(this.definition().providedInputs);
    const seed = this.initialValues();
    if (seed) {
      form.patchValue(seed);
      // "NA" is a placeholder, not a quality level. It is stripped at seed time
      // for definition-provided values; a repush can carry it in too, and that
      // patch lands after the seed.
      if (form.controls.businessProcessQualityLevel.value === "NA") {
        form.controls.businessProcessQualityLevel.reset(null, {
          emitEvent: false,
        });
      }
    }
    return form;
  });

  protected readonly prefilledInputs = computed(
    () => this.definition().providedInputs
  );
  protected readonly detailsTitle = computed(
    () => `${this.definition().name} Details`
  );

  protected notProvided(inputId: string): boolean {
    return !isProvidedByDefinition(this.definition().providedInputs, inputId);
  }

  protected toggleDetails(): void {
    this.detailsExpanded.update((expanded) => !expanded);
  }

  /**
   * Legacy `resetConfigurationParamsInputs` cascade: a genuine repository change
   * invalidates the create-branch choice and the configuration/parent branches.
   */
  protected onRepositoryChanged(): void {
    this.resetConfigurationParameters(this.form());
  }

  /** The two branches, which are only ever meaningful for one create-branch choice. */
  private resetConfigurationBranches(form: UpgradeExecutorForm): void {
    form.controls.configurationBranchName.reset(null, { emitEvent: false });
    form.controls.configurationParentBranch.reset(null, { emitEvent: false });
  }

  /** The create-branch choice and everything downstream of it. */
  private resetConfigurationParameters(form: UpgradeExecutorForm): void {
    form.controls.createBranch.reset(null, { emitEvent: false });
    this.resetConfigurationBranches(form);
  }

  /**
   * Legacy `showConfigBranchError`: the message depends on which way the branch
   * was supposed to go. Not creating a branch means it had to already exist;
   * creating one means the name had to be free.
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
   * no executor, so a failed lookup was swallowed entirely.
   */
  protected showSelectorError(message: string): void {
    this.toast.showError(message);
  }

  /** Seeds a factory-product cascade from the value the definition pre-filled. */
  protected factoryProductId(
    control: FormControl<UpgradeFactoryProductValue | null>
  ): string | undefined {
    return control.value?.id || undefined;
  }

  /*
   * A repush carries the exact MX/BIP versions and build ids the previous run
   * used. Passing only the factory-product id makes the directive re-derive
   * them, which can silently land on a different build - so the saved values are
   * handed over too, and the directive prefers them when there is no id.
   */
  protected initialMxVersion(
    control: FormControl<UpgradeFactoryProductValue | null>
  ): { version: string } | null {
    const version = control.value?.mxVersion;
    return version ? { version } : null;
  }

  protected initialMxBuildId(
    control: FormControl<UpgradeFactoryProductValue | null>
  ): { buildId: string; projectId: undefined } | null {
    const buildId = control.value?.mxBuildId;
    return buildId ? { buildId, projectId: undefined } : null;
  }

  protected initialBipVersion(
    control: FormControl<UpgradeFactoryProductValue | null>
  ): { version: string } | null {
    const version = control.value?.bipVersion;
    return version ? { version } : null;
  }

  protected initialBipBuildId(
    control: FormControl<UpgradeFactoryProductValue | null>
  ): { buildId: string; factoryProductId: string } | null {
    const value = control.value;
    return value?.bipBuildId
      ? { buildId: value.bipBuildId, factoryProductId: value.id ?? "" }
      : null;
  }

  /**
   * Legacy patched one key at a time and marked the control dirty on every
   * emission, so a partially-chosen product still reaches the form (and fails
   * `factoryProductAttributes()` until every required attribute is set).
   */
  protected patchFactoryProduct(
    control: FormControl<UpgradeFactoryProductValue | null>,
    change: Partial<UpgradeFactoryProductValue>
  ): void {
    const current = control.value;
    control.setValue({
      id: current?.id ?? "",
      mxVersion: current?.mxVersion ?? "",
      mxBuildId: current?.mxBuildId ?? "",
      bipVersion: current?.bipVersion,
      bipBuildId: current?.bipBuildId,
      ...change,
    });
    control.markAsDirty();
  }

  /**
   * Legacy watched `repositoryId.valueChanges.pipe(filter(v => !v))` and cleared
   * the create-branch choice with both branches whenever the repository was
   * *cleared*. `onRepositoryChanged()` covers only a genuine
   * user re-selection — the selector suppresses its first emission and never
   * emits at all when the value is cleared programmatically — so without this
   * the branches kept pointing at a repository that was no longer chosen.
   */
  private wireRepositoryClearedCascade(form: UpgradeExecutorForm): void {
    form.controls.repositoryId.valueChanges
      .pipe(
        filter((repositoryId) => !repositoryId),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.resetConfigurationParameters(form));
  }

  /**
   * Legacy cascade: changing the create-branch choice resets the configuration
   * and parent branches, which are re-validated against the new mode.
   */
  private wireCreateBranchCascade(form: UpgradeExecutorForm): void {
    form.controls.createBranch.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.resetConfigurationBranches(form));
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
