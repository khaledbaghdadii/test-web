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
import { EMPTY } from "rxjs";
import { catchError } from "rxjs/operators";
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
