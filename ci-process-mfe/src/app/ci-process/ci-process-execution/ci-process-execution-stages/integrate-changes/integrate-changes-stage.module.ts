import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { IntegrateChangesStageRoutingModule } from "./integrate-changes-stage-routing.module";
import { IntegrateChangesStageComponent } from "./integrate-changes-stage.component";
import {
  ErrorAlertComponent,
  InfoAlertComponent,
  WarningAlertModule,
} from "@mxflow/ui/alert";
import { CiProcessCommonModule } from "../../common/ci-process-common.module";
import { RepositoryService } from "@mxflow/features/repository";
import { ScmService } from "@mxflow/features/scm";
import { InputProviderModule } from "@mxflow/ui/input-provider";
import { IntegrateChangesDecisionComponent } from "./integrate-changes-section/integrate-changes-decision/integrate-changes-decision.component";
import { PanelModule } from "primeng/panel";
import { AccordionModule } from "primeng/accordion";
import { ButtonModule } from "primeng/button";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { ConfirmationService } from "primeng/api";
import { StepResultModule } from "@mxflow/ui/utils";
import { RemoteComponentInjectorService } from "@mxflow/federation/remote-component-injector";

import { TabsModule } from "primeng/tabs";
import { BackportChangesComponent } from "./backport-changes-section/backport-changes.component";
import { IntegrateChangesComponent } from "./integrate-changes-section/integrate-changes.component";
import { MergeRequestService } from "@mxflow/features/scm-management";
import {
  BusinessProcessDefinitionService,
  FinalProductPublishingComponent,
} from "@mxflow/features/business-process";
import { MergeRequestViewComponent } from "./integrate-changes-section/merge-request-component/merge-request-view.component";
import { BackportCherryPickAndMergeRequestComponent } from "./backport-changes-section/backport-cherry-pick-and-merge-request/backport-cherry-pick-and-merge-request.component";
import { BackportActionsComponent } from "./backport-changes-section/backport-actions/backport-actions.component";
import { SendForReviewComponent } from "../../common/send-for-review/send-for-review.component";
import { BackportExecutionsSummaryComponent } from "./backport-executions-summary/backport-executions-summary.component";
import { CiProcessExecutionsService } from "../../../ci-process-executions/ci-process-executions.service";
import { BuildAndTestMergeRequestReopenComponent } from "../../common/merge-request-reopen/build-and-test-merge-request-reopen.component";
import { Skeleton } from "primeng/skeleton";

@NgModule({
  imports: [
    CommonModule,
    IntegrateChangesStageRoutingModule,
    CardContainerModule,
    HeaderTitleModule,
    InputProviderModule,
    CiProcessCommonModule,
    SendForReviewComponent,
    PanelModule,
    AccordionModule,
    ButtonModule,
    ConfirmPopupModule,
    ErrorAlertComponent,
    StepResultModule,
    TabsModule,
    WarningAlertModule,
    InfoAlertComponent,
    WarningAlertModule,
    FinalProductPublishingComponent,
    MergeRequestViewComponent,
    BackportCherryPickAndMergeRequestComponent,
    BackportActionsComponent,
    BackportExecutionsSummaryComponent,
    BuildAndTestMergeRequestReopenComponent,
    Skeleton,
  ],
  declarations: [
    IntegrateChangesStageComponent,
    IntegrateChangesDecisionComponent,
    BackportChangesComponent,
    IntegrateChangesComponent,
  ],
  providers: [
    RepositoryService,
    ScmService,
    ConfirmationService,
    RemoteComponentInjectorService,
    MergeRequestService,
    BusinessProcessDefinitionService,
    CiProcessExecutionsService,
  ],
})
export class IntegrateChangesStageModule {}
