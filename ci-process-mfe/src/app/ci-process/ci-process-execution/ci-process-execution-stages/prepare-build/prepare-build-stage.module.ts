import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { PrepareBuildStageRoutingModule } from "./prepare-build-stage-routing.module";
import { PrepareBuildStageComponent } from "./prepare-build-stage.component";
import { CommitIdPipeModule, DurationPipeModule } from "@mxflow/pipe";
import {
  EnvironmentActionsModule,
  EnvironmentService,
  EnvironmentStatusComponent,
  EnvironmentStatusNamePipe,
} from "@mxflow/features/environment";
import { UiCollapsibleMessageModule } from "@mxflow/ui/collapsible-message";
import { InputProviderModule } from "@mxflow/ui/input-provider";
import { ErrorAlertComponent, InfoAlertComponent } from "@mxflow/ui/alert";
import { MxflowSpinnerModule, StepResultModule } from "@mxflow/ui/utils";
import { ButtonModule } from "primeng/button";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { ConfirmationService } from "primeng/api";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { PrepareBuildScenarioComponent } from "./scenario/prepare-build-scenario.component";
import { AggregatedScenarioExecutionsTableComponent } from "../common/aggregated-scenario-executions-table.component";
import { RemoteComponentInjectorService } from "@mxflow/federation/remote-component-injector";
import { ScenarioExecutionService } from "@mxflow/test-management";
import { PrepareBuildEnvironmentDecisionComponent } from "./decision/prepare-build-environment-decision.component";

@NgModule({
  imports: [
    CommonModule,
    PrepareBuildStageRoutingModule,
    CardContainerModule,
    HeaderTitleModule,
    DurationPipeModule,
    CommitIdPipeModule,
    UiCollapsibleMessageModule,
    InputProviderModule,
    EnvironmentActionsModule.forFeature(),
    MxflowSpinnerModule,
    ButtonModule,
    ErrorAlertComponent,
    SkeletonModule,
    TableModule,
    ConfirmPopupModule,
    StepResultModule,
    EnvironmentStatusNamePipe,
    EnvironmentStatusComponent,
    InfoAlertComponent,
    AggregatedScenarioExecutionsTableComponent,
  ],
  declarations: [
    PrepareBuildStageComponent,
    PrepareBuildEnvironmentDecisionComponent,
    PrepareBuildScenarioComponent,
  ],
  providers: [
    ConfirmationService,
    EnvironmentService,
    RemoteComponentInjectorService,
    ScenarioExecutionService,
  ],
  exports: [PrepareBuildScenarioComponent],
})
export class PrepareBuildStageModule {}
