import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { BuildAndTestStageComponent } from "./build-and-test-stage.component";
import { BuildAndTestStageRoutingModule } from "./build-and-test-stage-routing.module";
import { BuildAndTestActionsComponent } from "./build-and-test-action/build-and-test-actions.component";
import { InputProviderModule } from "@mxflow/ui/input-provider";
import { RepositoryService } from "@mxflow/features/repository";
import { BuildAndTestResultComponent } from "./build-and-test-result/build-and-test-result.component";
import { ErrorAlertComponent, InfoAlertComponent } from "@mxflow/ui/alert";
import { ScmService } from "@mxflow/features/scm";
import { ScenarioExecutionService } from "@mxflow/test-management";
import { BuildEnvironmentSectionComponent } from "./build-environment-details/build-environment-section.component";
import { CiProcessCommonModule } from "../../common/ci-process-common.module";
import { ButtonModule } from "primeng/button";
import { ConfirmationService } from "primeng/api";
import { PanelModule } from "primeng/panel";
import { StepResultModule } from "@mxflow/ui/utils";
import { AccordionModule } from "primeng/accordion";
import {
  EnvironmentActionsModule,
  EnvironmentWorkspaceConfigurationEditorButtonComponent,
  TechnicalReseedComponent,
  TechnicalReseedService,
  ServiceActionsButtonComponent,
} from "@mxflow/features/environment";
import { DividerModule } from "primeng/divider";
import { RemoteComponentInjectorService } from "@mxflow/federation/remote-component-injector";

import { BuildEnvironmentDetailsComponent } from "./build-environment-details/environment/build-environment-details.component";
import { BuildScenarioDetailsComponent } from "./build-environment-details/scenario/build-scenario-details.component";
import { PrepareBuildStageModule } from "../prepare-build/prepare-build-stage.module";
import { AggregatedScenarioExecutionsTableComponent } from "../common/aggregated-scenario-executions-table.component";
import { FinalProductService } from "@mxflow/features/artifact-manager";
import { SendForReviewComponent } from "../../common/send-for-review/send-for-review.component";
import { BuildAndTestTestSectionComponent } from "./test-section/build-and-test-test-section.component";
import { BusinessProcessDefinitionService } from "@mxflow/features/business-process";
import { BuildAndTestCherryPickComponent } from "./build-and-test-cherry-pick/build-and-test-cherry-pick.component";
import { BuildAndTestMergeRequestReopenComponent } from "../../common/merge-request-reopen/build-and-test-merge-request-reopen.component";
import { MergeRequestService } from "@mxflow/features/scm-management";
import { Skeleton } from "primeng/skeleton";

@NgModule({
  imports: [
    CommonModule,
    BuildAndTestStageRoutingModule,
    CardContainerModule,
    HeaderTitleModule,
    InputProviderModule,
    EnvironmentActionsModule.forFeature(),
    CiProcessCommonModule,
    SendForReviewComponent,
    ButtonModule,
    PanelModule,
    StepResultModule,
    AccordionModule,
    DividerModule,
    ErrorAlertComponent,
    PrepareBuildStageModule,
    AggregatedScenarioExecutionsTableComponent,
    InfoAlertComponent,
    ServiceActionsButtonComponent,
    TechnicalReseedComponent,
    EnvironmentWorkspaceConfigurationEditorButtonComponent,
    BuildAndTestCherryPickComponent,
    BuildAndTestTestSectionComponent,
    BuildAndTestMergeRequestReopenComponent,
    Skeleton,
  ],
  declarations: [
    BuildAndTestStageComponent,
    BuildAndTestActionsComponent,
    BuildAndTestResultComponent,
    BuildEnvironmentDetailsComponent,
    BuildEnvironmentSectionComponent,
    BuildScenarioDetailsComponent,
  ],
  providers: [
    RepositoryService,
    ScmService,
    ScenarioExecutionService,
    ConfirmationService,
    RemoteComponentInjectorService,
    FinalProductService,
    TechnicalReseedService,
    BusinessProcessDefinitionService,
    MergeRequestService,
  ],
})
export class BuildAndTestStageModule {}
