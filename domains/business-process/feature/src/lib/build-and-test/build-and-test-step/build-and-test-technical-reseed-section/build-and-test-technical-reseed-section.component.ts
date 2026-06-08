import { Component, computed, inject, input, output, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { Message } from "primeng/message";
import { SelectModule } from "primeng/select";
import { Tag } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { ToastMessageService } from "@mxflow/ui/alert";
import { BusinessProcessContentContainerComponent } from "@mxevolve/domains/business-process/ui";
import {
  EnvironmentDefinition,
  EnvironmentService,
  MaintenanceConfiguration,
  TECHNICAL_RESEED_STATUS_CONFIGURATION,
  TechnicalReseedExecutionGroup,
  TechnicalReseedOperation,
  TechnicalReseedService,
  TechnicalReseedStatus,
} from "@mxevolve/domains/environment/data-access";
import {
  FinalProduct,
  FinalProductService,
} from "@mxevolve/domains/artifact/data-access";
import {
  CommitIdDisplayComponent,
  DateDisplayComponent,
  MxevolveIconComponent,
  MxevolveIllustrationComponent,
} from "@mxevolve/shared/ui/primitive";

interface SelectOption<T> {
  label: string;
  value: T;
}

interface TechnicalReseedOperationView extends TechnicalReseedOperation {
  displayName: string;
  environmentDefinitionName: string;
}

@Component({
  selector: "mxevolve-build-and-test-technical-reseed-section",
  templateUrl: "./build-and-test-technical-reseed-section.component.html",
  imports: [
    BusinessProcessContentContainerComponent,
    ButtonModule,
    CommitIdDisplayComponent,
    DateDisplayComponent,
    DialogModule,
    Message,
    MxevolveIconComponent,
    MxevolveIllustrationComponent,
    ReactiveFormsModule,
    RouterLink,
    SelectModule,
    Tag,
    TooltipModule,
  ],
  providers: [
    EnvironmentService,
    FinalProductService,
    TechnicalReseedService,
    ToastMessageService,
  ],
  host: {
    style: "display: contents;",
  },
})
export class BuildAndTestTechnicalReseedSectionComponent {
  readonly projectId = input.required<string>();
  readonly executionGroupId = input.required<string>();
  readonly infraGroup = input.required<string>();
  readonly targetBranch = input.required<string>();

  readonly operationLaunched = output<void>();

  private readonly technicalReseedService = inject(TechnicalReseedService);
  private readonly environmentService = inject(EnvironmentService);
  private readonly finalProductService = inject(FinalProductService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastMessageService = inject(ToastMessageService);

  readonly launchDialogVisible = signal(false);
  readonly launchInProgress = signal(false);
  readonly expandedOperationIds = signal<ReadonlySet<string>>(new Set());
  readonly expandedDumpOperationIds = signal<ReadonlySet<string>>(new Set());

  readonly launchForm = this.formBuilder.nonNullable.group({
    finalProduct: [undefined as FinalProduct | undefined, Validators.required],
    environmentDefinitionId: ["", Validators.required],
    maintenanceConfiguration: [
      undefined as MaintenanceConfiguration | undefined,
      Validators.required,
    ],
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
      this.environmentService.getEnvironmentDefinitions(params.projectId),
    defaultValue: [],
  });

  readonly finalProductsResource = rxResource({
    params: () => ({ projectId: this.projectId() }),
    stream: ({ params }) =>
      this.finalProductService.getFinalProducts(params.projectId, {
        page: 0,
        size: 50,
        sort: "createdOn,desc",
        validationLevelFilter: ["MQG", "DQG"],
      }),
  });

  readonly executionGroup = computed<TechnicalReseedExecutionGroup | undefined>(
    () => this.executionGroupResource.value()
  );

  readonly launchDisabled = computed(() => {
    const executionGroup = this.executionGroup();
    return !executionGroup || !executionGroup.launchesAllowed;
  });

  readonly launchTooltip = computed(() =>
    this.launchDisabled() ? this.executionGroup()?.reason : undefined
  );

  readonly finalProductOptions = computed<SelectOption<FinalProduct>[]>(() => {
    const finalProducts = this.finalProductsResource.value()?.content ?? [];
    return finalProducts.map((finalProduct) => ({
      label: this.finalProductLabel(finalProduct),
      value: finalProduct,
    }));
  });

  readonly environmentDefinitionOptions = computed<
    SelectOption<string>[]
  >(() =>
    this.environmentDefinitionsResource.value().map((definition) => ({
      label: definition.name,
      value: definition.id,
    }))
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
    const environmentDefinitionId =
      this.launchForm.controls.environmentDefinitionId.value;
    const maintenanceConfiguration =
      this.launchForm.controls.maintenanceConfiguration.value;

    if (!finalProduct || !maintenanceConfiguration) return;

    this.launchInProgress.set(true);
    this.technicalReseedService
      .launchTechnicalReseed(this.projectId(), this.executionGroupId(), {
        branch: finalProduct.branch,
        configurationCommitId: finalProduct.configurationCommitId,
        validationLevel: finalProduct.validationLevel,
        environmentDefinitionId,
        maintenanceConfiguration,
        infraGroupId: this.infraGroup(),
        targetBranch: this.targetBranch(),
      })
      .pipe(finalize(() => this.launchInProgress.set(false)))
      .subscribe({
        next: () => {
          this.toastMessageService.showSuccess(
            "Technical reseed operation launched successfully."
          );
          this.closeLaunchDialog();
          this.executionGroupResource.reload();
          this.operationLaunched.emit();
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
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  statusTooltip(operation: TechnicalReseedOperation): string | undefined {
    if (operation.status === TechnicalReseedStatus.RUNNING) {
      return operation.progressMessage;
    }
    if (operation.status === TechnicalReseedStatus.FAILED) {
      return operation.resultMessage;
    }
    return undefined;
  }

  private finalProductLabel(finalProduct: FinalProduct): string {
    if (finalProduct.tag) {
      return `${finalProduct.tag} (${finalProduct.configurationCommitId})`;
    }
    return finalProduct.configurationCommitId;
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
