import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import {
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Store } from "@ngrx/store";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { concatMap, Subject, takeUntil } from "rxjs";
import { CommonModule } from "@angular/common";
import { MandatoryFieldModule } from "@mxflow/ui/alert";
import { MXEvolveCustomTheme, MxflowSpinnerModule } from "@mxflow/ui/utils";
import { ButtonModule } from "primeng/button";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { TooltipModule } from "primeng/tooltip";
import { PrimeNG } from "primeng/config";
import { SelectModule } from "primeng/select";
import { DialogModule } from "primeng/dialog";
import { MessageModule } from "primeng/message";

import { ScenarioDefinitionService } from "../../../definition/scenario-definition/scenario-definition.service";
import { ScenarioDefinition } from "../../../definition/scenario-definition/scenario-definition";
import { ScenarioExecutionService } from "../scenario-execution.service";
import { ScenarioExecutionGroupActionPermissionApiModel } from "../model/scenario-execution-group-action-permission-api-model";
import { RejectionReasonMapperService } from "../actions/repush/rejection-reason-mapper/rejection-reason-mapper.service";
import { KeepServicesCheckboxComponent } from "../actions/repush/keep-services-checkbox/keep-services-checkbox.component";
import { RunScenarioRequest } from "../request/run-scenario-request";
import { StreamsService } from "@mxflow/features/streams";
import { EnvironmentService } from "@mxflow/features/environment";
import { ScenarioDefinitionSingleSelectorComponent } from "@mxflow/test-management/definition";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";

@Component({
  selector: "mxevolve-run-scenario-dropdown",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MandatoryFieldModule,
    MxflowSpinnerModule,
    SelectModule,
    ButtonModule,
    ConfirmPopupModule,
    TooltipModule,
    DialogModule,
    KeepServicesCheckboxComponent,
    MessageModule,
    ScenarioDefinitionSingleSelectorComponent,
  ],
  providers: [
    ScenarioDefinitionService,
    ScenarioExecutionService,
    RejectionReasonMapperService,
    TestDefinitionService,
    StreamsService,
    EnvironmentService,
  ],
  templateUrl: "./run-scenario-dropdown.component.html",
})
export class RunScenarioDropdownComponent implements OnInit, OnDestroy {
  private readonly scenarioDefinitionService = inject(
    ScenarioDefinitionService
  );
  private readonly scenarioExecutionService = inject(ScenarioExecutionService);
  private readonly store = inject(Store);
  private readonly formBuilder = inject(UntypedFormBuilder);
  private readonly rejectionReasonMapper = inject(RejectionReasonMapperService);
  private readonly primeng = inject(PrimeNG);

  @Input({ required: true }) subContextId: string;
  @Input({ required: true }) branchName: string;
  @Input({ required: true }) executionGroupId: string;
  @Input({ required: true }) warningMessageMap: { [key: string]: string };
  @Input() machineGroupId?: string;
  @Input() keepServices?: boolean = false;
  @Input() enableKeepServices?: boolean = true;
  @Input() disableConfigurationEditor?: boolean = true;
  @Input() supportReconActivities?: boolean;
  @Input() qualityLevel?: string;
  @Input() validationScopeEnabled?: boolean = true;
  @Input() incidentEnabled?: boolean = true;
  @Input() definitionLabel =
    "Select a scenario that you wish to launch to validate your change";
  @Input() selectorPlaceholder = "Select Test Scenario";
  @Input() runButtonLabel = "Run Scenario";
  @Input() dialogHeader = "Run Scenario Execution";

  @Output() errorEventEmitter = new EventEmitter<string>();
  @Output() scenarioPushed = new EventEmitter<void>();

  projectId: string;
  scenarioDefinitions: ScenarioDefinition[];
  runScenarioForm: UntypedFormGroup;
  isLoading: boolean = true;
  isExecutionAllowed: boolean;
  rejectionReasonMessage?: string;
  warningMessage?: string;
  showModal = false;

  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.primeng.theme.set({
      preset: MXEvolveCustomTheme,
      options: {
        darkModeSelector: ".app-dark",
        cssLayer: {
          name: "primeng",
          order: "tailwind-base, primeng, tailwind-utilities",
        },
      },
    });
  }

  ngOnInit(): void {
    this.runScenarioForm = this.formBuilder.group({
      scenarioDefinitionId: [null, [Validators.required]],
    });
    this.loadData();
  }

  private loadData(): void {
    this.store
      .select(GlobalSelectors.getProjectId)
      .pipe(
        takeUntil(this.destroy$),
        concatMap((projectId) => {
          this.projectId = projectId;
          return this.scenarioExecutionService.isExecutionAllowed(
            this.projectId,
            this.executionGroupId
          );
        }),
        concatMap((scenarioExecutionGroupActionPermission) => {
          this.setWarningsAndReasons(scenarioExecutionGroupActionPermission);
          this.isExecutionAllowed =
            scenarioExecutionGroupActionPermission.actionAllowed;
          if (!this.isExecutionAllowed) {
            this.runScenarioForm.controls["scenarioDefinitionId"].disable();
          }
          return this.scenarioDefinitionService.getScenarioDefinitions(
            this.projectId
          );
        })
      )
      .subscribe({
        next: (scenarioDefinitions) => {
          this.scenarioDefinitions = scenarioDefinitions;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorEventEmitter.emit(error.message);
          this.isLoading = false;
        },
      });
  }

  runScenarioExecution(): void {
    if (this.enableKeepServices) {
      this.openModal();
    } else {
      this.runScenario();
    }
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.keepServices = false;
  }

  onCheckKeepServicesChanged(checked: boolean): void {
    this.keepServices = checked;
  }

  runScenario(): void {
    if (this.runScenarioForm.valid) {
      this.isLoading = true;
      this.scenarioExecutionService
        .runScenario(this.projectId, this.buildRunScenarioRequest())
        .subscribe({
          next: () => {
            this.checkScenarioExecutionEligibility();
            this.isLoading = false;
            this.scenarioPushed.emit();
            this.runScenarioForm.reset();
          },
          error: (error) => {
            this.isLoading = false;
            this.errorEventEmitter.emit(error.message);
            this.runScenarioForm.reset();
          },
          complete: () => {
            this.closeModal();
          },
        });
    }
  }

  private buildRunScenarioRequest(): RunScenarioRequest {
    return {
      scenarioDefinitionId: this.runScenarioForm
        .get("scenarioDefinitionId")
        ?.getRawValue(),
      subContextId: this.subContextId,
      branchName: this.branchName,
      commitId: null,
      executionGroupId: this.executionGroupId,
      machineGroupId: this.machineGroupId,
      disableKeepExecution: this.getDisableKeepExecution(),
      stopServices: !this.keepServices,
      disableConfigurationEditor: this.disableConfigurationEditor,
      supportReconActivities: this.supportReconActivities ?? false,
      validationScopeEnabled: this.validationScopeEnabled,
      incidentEnabled: this.incidentEnabled,
      qualityLevel: this.qualityLevel,
    } as RunScenarioRequest;
  }

  private getDisableKeepExecution(): boolean {
    return this.executionGroupId != null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkScenarioExecutionEligibility(): void {
    this.scenarioExecutionService
      .isExecutionAllowed(this.projectId, this.executionGroupId)
      .subscribe((response) => {
        this.setWarningsAndReasons(response);
        this.isExecutionAllowed = response.actionAllowed;
        if (this.isExecutionAllowed) {
          this.runScenarioForm.controls["scenarioDefinitionId"].enable();
        }
      });
  }

  private setWarningsAndReasons(
    response: ScenarioExecutionGroupActionPermissionApiModel
  ): void {
    if (response.rejectionReasons.length > 0) {
      this.rejectionReasonMessage = this.rejectionReasonMapper.map(
        response.rejectionReasons
      );
    }
    if (response.warnings.length > 0) {
      this.warningMessage = this.warningMessageMap[response.warnings[0]] ?? "";
    }
  }
}
