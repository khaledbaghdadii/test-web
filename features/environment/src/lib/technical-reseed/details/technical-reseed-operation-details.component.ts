import { Component, inject, Input, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Panel } from "primeng/panel";
import { combineLatest, skipWhile, Subject, takeUntil } from "rxjs";
import { ExecutionGroup } from "../execution-group-models";
import { ExecutionGroupsState } from "../../store/execution-group/execution-group.state";
import { Store } from "@ngrx/store";
import { selectExecutionGroup } from "../../store/execution-group/execution-groups.selectors";
import { Tag } from "primeng/tag";
import {
  STATUS_CONFIGURATION,
  TechnicalReseedOperationDetails,
  TechnicalReseedStatusEnum,
} from "../technical-reseed-models";
import { EnvironmentDefinition } from "@mxflow/features/environment";
import { EnvironmentDefinitionsState } from "../../store/environment-definition/environment-definitions.state";
import {
  dropEnvironmentDefinitionsDetails,
  retrieveEnvironmentDefinitions,
} from "../../store/environment-definition/environment-definitions.action";
import { EnvironmentDefinitionsModule } from "../../store/environment-definition/environment-definitions.module";
import { selectEnvironmentDefinitions } from "../../store/environment-definition/environment-definitions.selectors";
import { RouterLink } from "@angular/router";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import { Dialog } from "primeng/dialog";

@Component({
  selector: "mxevolve-technical-reseed-operation-details",
  imports: [
    CommonModule,
    Panel,
    Tag,
    EnvironmentDefinitionsModule,
    RouterLink,
    TableEmptyMessageComponent,
    Dialog,
  ],
  templateUrl: "./technical-reseed-operation-details.component.html",
})
export class TechnicalReseedOperationDetailsComponent
  implements OnInit, OnDestroy
{
  private readonly destroy$ = new Subject();
  technicalReseedOperations: TechnicalReseedOperationDetails[] = [];
  hasOperations: boolean = true;
  environmentDefinitions: EnvironmentDefinition[] = [];
  isDialogVisible = false;
  dialogContent: string | null = null;
  selectedOperation: TechnicalReseedOperationDetails | null = null;

  @Input({ required: true }) executionGroupId: string;
  @Input({ required: true }) projectId: string;

  store = inject(Store<ExecutionGroupsState>);
  environmentDefinitionStore = inject(Store<EnvironmentDefinitionsState>);

  ngOnInit(): void {
    this.environmentDefinitionStore.dispatch(
      retrieveEnvironmentDefinitions({ projectId: this.projectId })
    );

    const environmentDefinitions$ = this.environmentDefinitionStore
      .select(
        selectEnvironmentDefinitions({
          projectId: this.projectId,
        })
      )
      .pipe(skipWhile((definitions) => definitions === undefined));

    const executionGroup$ = this.store
      .select(
        selectExecutionGroup({
          projectId: this.projectId,
          executionGroupId: this.executionGroupId,
        })
      )
      .pipe(skipWhile((executionGroup) => executionGroup === undefined));

    combineLatest([environmentDefinitions$, executionGroup$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([definitions, executionGroup]) => {
        this.environmentDefinitions = definitions!;

        if (
          executionGroup?.technicalReseedOperations &&
          executionGroup.technicalReseedOperations.length > 0
        ) {
          this.buildOperationsList(executionGroup);
        } else {
          this.hasOperations = false;
        }
      });
  }

  private buildOperationsList(executionGroup: ExecutionGroup) {
    executionGroup.technicalReseedOperations?.forEach((operation) => {
      const selectedDefinition = this.environmentDefinitions.find(
        (definition) => definition.id === operation.environmentDefinitionId
      );
      const operationDetails: TechnicalReseedOperationDetails = {
        id: operation.id,
        branch: operation.branch,
        validationLevel: operation.validationLevel,
        dumpIds: operation.dumpIds,
        status: operation.status,
        sourceCommit: operation.sourceCommit,
        maintenanceLevel: operation.maintenanceLevel,
        environmentDefinitionId: operation.environmentDefinitionId,
        environmentDefinitionName: selectedDefinition!.name,
        environmentId: operation.environmentId,
        createdOn: operation.createdOn,
        resultMessage: operation.resultMessage,
        progressMessage: operation.progressMessage,
        statusTagSeverity: this.getSeverity(operation.status),
        statusTagIcon: this.getIcon(operation.status),
        isContainerCollapsed: this.isCollapsed(operation.status),
      };
      this.technicalReseedOperations.push(operationDetails);
    });

    this.technicalReseedOperations.sort((a, b) => {
      return new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime();
    });
  }

  private getSeverity(
    status: TechnicalReseedStatusEnum
  ): "secondary" | "info" | "success" | "danger" | "warn" {
    return STATUS_CONFIGURATION.find((e) => e.status === status)!.severity;
  }

  private getIcon(status: TechnicalReseedStatusEnum): string {
    return STATUS_CONFIGURATION.find((e) => e.status === status)!.icon;
  }

  private isCollapsed(status: TechnicalReseedStatusEnum): boolean {
    return status !== TechnicalReseedStatusEnum.RUNNING;
  }

  onStatusClicked(operation: TechnicalReseedOperationDetails) {
    const operationMessageDetails = this.getDialogContent(operation);
    if (!operationMessageDetails) return;
    this.selectedOperation = operation;
    this.dialogContent = operationMessageDetails;
    this.isDialogVisible = true;
  }

  canShowDialog(operation: TechnicalReseedOperationDetails): boolean {
    return !!this.getDialogContent(operation);
  }

  private getDialogContent(
    operation: TechnicalReseedOperationDetails
  ): string | null {
    switch (operation.status) {
      case TechnicalReseedStatusEnum.RUNNING:
        return operation.progressMessage ?? null;
      case TechnicalReseedStatusEnum.FAILED:
        return operation.resultMessage ?? null;
      default:
        return null;
    }
  }

  hideDialog() {
    this.isDialogVisible = false;
    this.dialogContent = null;
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
    this.environmentDefinitionStore.dispatch(
      dropEnvironmentDefinitionsDetails({ projectId: this.projectId })
    );
  }
}
