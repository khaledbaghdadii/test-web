import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { rxResource, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { Divider } from "primeng/divider";
import { Message } from "primeng/message";
import { SelectModule } from "primeng/select";
import { Tag } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  EnvironmentDefinition,
  EnvironmentDefinitionService,
  MaintenanceConfiguration,
  TECHNICAL_RESEED_STATUS_CONFIGURATION,
  TechnicalReseedExecutionGroup,
  TechnicalReseedOperation,
  TechnicalReseedService,
  TechnicalReseedStatus,
} from "@mxevolve/domains/environment/data-access";
import type { FinalProduct } from "@mxevolve/domains/artifact/data-access";
import { FinalProductState } from "@mxevolve/domains/artifact/data-access";
import {
  DropdownDefaultSelectionMode,
  FinalProductDropdownInputComponent,
  FinalProductDropdownInputLabelMode,
} from "@mxevolve/domains/artifact/widget";
import {
  CommitIdDisplayComponent,
  DateDisplayComponent,
  MxevolveIconComponent,
  MxevolveIllustrationComponent,
} from "@mxevolve/shared/ui/primitive";
import { EnvironmentDefinitionDropdownComponent } from "../environment-definition-dropdown/environment-definition-dropdown.component";
import { Checkbox } from "primeng/checkbox";

interface SelectOption<T> {
  label: string;
  value: T;
}

interface TechnicalReseedOperationView extends TechnicalReseedOperation {
  displayName: string;
  environmentDefinitionName: string;
}

const PENDING_INPUT_MESSAGE =
  "Paused before dump generation, manual intervention is required before proceeding.";

@Component({
  selector: "mxevolve-technical-reseed-section",
  templateUrl: "./technical-reseed-section.component.html",
  imports: [
    ButtonModule,
    CommitIdDisplayComponent,
    DateDisplayComponent,
    DialogModule,
    Divider,
    EnvironmentDefinitionDropdownComponent,
    FinalProductDropdownInputComponent,
    Message,
    MxevolveIconComponent,
    MxevolveIllustrationComponent,
    ReactiveFormsModule,
    RouterLink,
    SelectModule,
    Tag,
    TooltipModule,
    Checkbox,
  ],
  providers: [
    EnvironmentDefinitionService,
    TechnicalReseedService,
    ToastMessageService,
  ],
  host: {
    style: "display: contents;",
  },
})
export class TechnicalReseedSectionComponent {
  readonly projectId = input.required<string>();
  readonly executionGroupId = input.required<string>();
  readonly infraGroup = input.required<string>();
  readonly targetBranch = input.required<string>();

  readonly reloadRequested = output<void>();

  private readonly technicalReseedService = inject(TechnicalReseedService);
  private readonly environmentDefinitionService = inject(
    EnvironmentDefinitionService
  );
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly launchDialogVisible = signal(false);
  readonly launchInProgress = signal(false);
  readonly expandedOperationIds = signal<ReadonlySet<string>>(new Set());
  readonly expandedDumpOperationIds = signal<ReadonlySet<string>>(new Set());
  readonly resumingOperationIds = signal<ReadonlySet<string>>(new Set());

  readonly messageDialogVisible = signal(false);
  readonly dialogMessage = signal("");

  /** Reseed lists AVAILABLE MQG/DQG final products labelled `tag-commitId`. */
  protected readonly FinalProductDropdownInputLabelMode =
    FinalProductDropdownInputLabelMode;
  protected readonly finalProductStateFilter = [FinalProductState.AVAILABLE];
  /** Left unset so the branch-root product is not pulled in (legacy parity). */
  protected readonly finalProductFetchParent = undefined;
  /**
   * Legacy launched the reseed picker in CUSTOM mode with an empty custom id, so
   * nothing is auto-selected: the user must pick the product deliberately. The
   * service default (LATEST) would silently preselect the newest product.
   */
  protected readonly DropdownDefaultSelectionMode = DropdownDefaultSelectionMode;
  protected readonly finalProductCustomId = "";

  readonly launchForm = this.formBuilder.nonNullable.group({
    finalProduct: [undefined as FinalProduct | undefined, Validators.required],
    environmentDefinition: [
      undefined as EnvironmentDefinition | undefined,
      Validators.required,
    ],
    maintenanceConfiguration: [
      undefined as MaintenanceConfiguration | undefined,
      Validators.required,
    ],
    pauseForManualIntervention: [false],
  });

  readonly executionGroupResource = rxResource({
    params: () => ({
      projectId: this.projectId(),
      executionGroupId: this.executionGroupId(),
    }),
    stream: ({ params }) =>
      this.technicalReseedService.getExecutionGroupDetails(
        params.projectId,
        params.executionGroupId
      ),
  });

  readonly environmentDefinitionsResource = rxResource({
    params: () => ({ projectId: this.projectId() }),
    stream: ({ params }) =>
      this.environmentDefinitionService.getEnvironmentDefinitions(
        params.projectId
      ),
    defaultValue: [],
  });

  readonly executionGroup = computed<TechnicalReseedExecutionGroup | undefined>(
    () => this.executionGroupResource.value()
  );

  readonly launchDisabled = computed(() => {
    const executionGroup = this.executionGroup();
    return !executionGroup?.launchesAllowed;
  });

  readonly launchTooltip = computed(() =>
    this.launchDisabled() ? this.executionGroup()?.reason : undefined
  );

  readonly maintenanceOptions: SelectOption<MaintenanceConfiguration>[] = [
    { label: "Full", value: { full: true } },
    { label: "Custom", value: { full: false } },
  ];

  readonly operations = computed<TechnicalReseedOperationView[]>(() => {
    const definitions = this.environmentDefinitionsResource.value();
    const definitionById = new Map(
      definitions.map((definition: EnvironmentDefinition) => [
        definition.id,
        definition.name,
      ])
    );

    const operations = [
      ...(this.executionGroup()?.technicalReseedOperations ?? []),
    ].sort(
      (a, b) =>
        new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()
    );

    return operations.map((operation, index) => ({
      ...operation,
      displayName: `Technical Reseed ${operations.length - index}`,
      environmentDefinitionName:
        definitionById.get(operation.environmentDefinitionId) ??
        operation.environmentDefinitionId,
    }));
  });

  readonly hasOperations = computed(() => this.operations().length > 0);

  openLaunchDialog(): void {
    this.launchForm.reset();
    this.launchDialogVisible.set(true);
  }

  closeLaunchDialog(): void {
    this.launchDialogVisible.set(false);
    this.launchForm.reset();
  }

  launchTechnicalReseed(): void {
    if (this.launchForm.invalid || this.launchInProgress()) return;

    const finalProduct = this.launchForm.controls.finalProduct.value;
    const environmentDefinition =
      this.launchForm.controls.environmentDefinition.value;
    const maintenanceConfiguration =
      this.launchForm.controls.maintenanceConfiguration.value;

    if (!finalProduct || !environmentDefinition || !maintenanceConfiguration)
      return;

    this.launchInProgress.set(true);
    this.technicalReseedService
      .launchTechnicalReseed(this.projectId(), this.executionGroupId(), {
        branch: finalProduct.branch,
        configurationCommitId: finalProduct.configurationCommitId,
        validationLevel: finalProduct.validationLevel,
        environmentDefinitionId: environmentDefinition.id,
        maintenanceConfiguration,
        infraGroupId: this.infraGroup(),
        targetBranch: this.targetBranch(),
        pauseForManualIntervention:
          this.launchForm.controls.pauseForManualIntervention.value,
      })
      .pipe(finalize(() => this.launchInProgress.set(false)))
      .subscribe({
        next: () => {
          this.toastMessageService.showSuccess(
            "Technical reseed operation launched successfully."
          );
          this.closeLaunchDialog();
          this.executionGroupResource.reload();
          this.reloadRequested.emit();
        },
        error: (error: Error) => {
          this.toastMessageService.showError(
            error.message,
            "Failed to launch technical reseed operation"
          );
          this.closeLaunchDialog();
        },
      });
  }

  toggleOperation(operationId: string): void {
    this.expandedOperationIds.update((current) =>
      this.toggleSetValue(current, operationId)
    );
  }

  isOperationExpanded(operationId: string): boolean {
    return this.expandedOperationIds().has(operationId);
  }

  toggleDumpIds(operationId: string): void {
    this.expandedDumpOperationIds.update((current) =>
      this.toggleSetValue(current, operationId)
    );
  }

  isDumpExpanded(operationId: string): boolean {
    return this.expandedDumpOperationIds().has(operationId);
  }

  visibleDumpIds(operation: TechnicalReseedOperation): string[] {
    const dumpIds = operation.dumpIds ?? [];
    return this.isDumpExpanded(operation.id) ? dumpIds : dumpIds.slice(0, 1);
  }

  statusSeverity(status: TechnicalReseedStatus) {
    return TECHNICAL_RESEED_STATUS_CONFIGURATION[status].severity;
  }

  statusIcon(status: TechnicalReseedStatus): string {
    return TECHNICAL_RESEED_STATUS_CONFIGURATION[status].icon;
  }

  statusLabel(status: TechnicalReseedStatus): string {
    const normalized = status.replace(/_/g, " ");
    return normalized.charAt(0) + normalized.slice(1).toLowerCase();
  }

  statusTooltip(operation: TechnicalReseedOperation): string | undefined {
    if (operation.status === TechnicalReseedStatus.RUNNING) {
      return operation.progressMessage;
    }
    if (operation.status === TechnicalReseedStatus.FAILED) {
      return operation.resultMessage;
    }
    if (operation.status === TechnicalReseedStatus.PENDING_INPUT) {
      return PENDING_INPUT_MESSAGE;
    }
    return undefined;
  }

  openMessageDialog(operation: TechnicalReseedOperation): void {
    const message = this.statusTooltip(operation);
    if (!message) return;
    this.dialogMessage.set(message);
    this.messageDialogVisible.set(true);
  }

  isPaused(operation: TechnicalReseedOperationView): boolean {
    return operation.status === TechnicalReseedStatus.PENDING_INPUT;
  }

  onResume(operation: TechnicalReseedOperationView): void {
    this.resumingOperationIds.update((current) => {
      const next = new Set(current);
      next.add(operation.id);
      return next;
    });
    this.technicalReseedService
      .resumeTechnicalReseed(
        this.projectId(),
        this.executionGroupId(),
        operation.id
      )
      .pipe(
        finalize(() =>
          this.resumingOperationIds.update((current) => {
            const next = new Set(current);
            next.delete(operation.id);
            return next;
          })
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.toastMessageService.showSuccess(
            "Technical reseed operation resumed successfully."
          );
          this.executionGroupResource.reload();
          this.reloadRequested.emit();
        },
        error: (error: Error) => {
          this.toastMessageService.showError(
            error.message,
            "Failed to resume technical reseed operation"
          );
        },
      });
  }

  private toggleSetValue(
    current: ReadonlySet<string>,
    value: string
  ): ReadonlySet<string> {
    const next = new Set(current);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    return next;
  }
}
