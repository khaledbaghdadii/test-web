import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ScenarioExecutionStateManagementService } from "./scenario-execution-state-management.service";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import {
  IncidentService,
  IncidentsTableComponent,
} from "@mxflow/features/incident-management";
import { TextareaModule } from "primeng/textarea";
import { ScenarioExecutionIncidentsComponent } from "./scenario-execution-incidents/scenario-execution-incidents.component";
import { ScenarioExecutionDetectionsComponent } from "./scenario-execution-detections/scenario-execution-detections.component";
import {
  BinaryImpactService,
  BinaryRegressionDataService,
  ConfigurationImpactService,
  ConfigurationRegressionService,
  FailureReasonDetailsTableComponent,
  FailureReasonsDataService,
  UpgradeImpactSelectionModalComponent,
} from "@mxflow/features/failure-management";
import { TableModule } from "primeng/table";
import { CommitIdPipeModule, DurationPipeModule } from "@mxflow/pipe";
import { ProgressSpinner } from "primeng/progressspinner";
import { Tooltip } from "primeng/tooltip";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import { RouterLink, RouterOutlet } from "@angular/router";
import { Skeleton } from "primeng/skeleton";
import { TestExecutionNamePipe } from "../../test-execution/test-execution-name-pipe/test-execution-name-pipe.pipe";
import { ExecutionDetailsComponent } from "./execution-details/execution-details.component";
import { Menu } from "primeng/menu";
import { Button, ButtonDirective } from "primeng/button";
import { ToggleSwitch } from "primeng/toggleswitch";
import { FormsModule } from "@angular/forms";
import { KeptExecutionDisabledPipe } from "./kept-execution-disabled/kept-execution-disabled.pipe";
import { KeptExecutionToggleComponent } from "../kept-execution-toggle/kept-execution-toggle.component";
import { AssigneeInputComponent } from "../assignee-input/assignee-input.component";
import { UiCollapsibleMessageModule } from "@mxflow/ui/collapsible-message";
import { DefectSelectionModalComponent } from "@mxflow/features/validation-management";
import { ConfirmPopup } from "primeng/confirmpopup";
import { CommentInputComponent } from "./execution-details/comment-input/comment-input.component";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { ScenarioExecutionHistoryComponent } from "./scenario-execution-history/scenario-execution-history.component";
import { ScenarioExecutionDetailsComponent } from "./scenario-execution-details.component";
import { TabPanel, Tabs, TabsModule } from "primeng/tabs";
import { ConfirmationService } from "primeng/api";
import { StoreModule } from "@ngrx/store";
import { ToastModule } from "primeng/toast";
import { AnalysisObjectLinkService } from "../../analysis-object-link/analysis-object-link.service";
import { TestCaseExecutionService } from "../../test-case-execution/test-case-execution.service";
import { ScenarioExecutionStatusComponent } from "../scenario-execution-status/scenario-execution-status.component";
import { ScenarioAnalysisStatusComponent } from "../scenario-analysis-status/scenario-analysis-status.component";
import { TestExecutionsGridComponent } from "./execution-details/test-result-table/test-executions-grid.component";
import { Divider } from "primeng/divider";
import { TagModule } from "primeng/tag";
import { StyleClass } from "primeng/styleclass";
import { TestExecutionStatusComponent } from "../test-result-status/test-execution-status.component";
import { AnalysisObjectUnlinkModalComponent } from "../../analysis-object-link/analysis-object-unlink-modal/analysis-object-unlink-modal.component";
import { AnalysisObjectLinkingComponent } from "../../analysis-object-link/analysis-object-linking/analysis-object-linking.component";
import { AnalysisObjectLinkUtils } from "../../analysis-object-link/analysis-object-link-utils";
import { LinkedBinaryImpactDetailsTableComponent } from "./scenario-execution-detections/linked-binary-impact-details-table/linked-binary-impact-details-table.component";
import { LinkedConfigurationRegressionDetailsTableComponent } from "./scenario-execution-detections/linked-configuration-regression-details-table/linked-configuration-regression-details-table.component";
import { LinkedConfigurationImpactDetailsTableComponent } from "./scenario-execution-detections/linked-configuration-impact-details-table/linked-configuration-impact-details-table.component";
import { LinkedBinaryRegressionDetailsTableComponent } from "./scenario-execution-detections/linked-binary-regression-details-table/linked-binary-regression-details-table.component";
import { TestExecutionReportComponent } from "./execution-details/test-execution-report/test-execution-report.component";
import { TestExecutionWebEngineReportComponent } from "../../test-execution/test-execution-web-engine-report/test-execution-web-engine-report.component";
import { UpdateReferenceTableComponent } from "../../test-execution/update-reference/update-reference-table/update-reference-table.component";
import { TestCaseExecutionAnalysisStatusDropdownComponent } from "../../test-case-execution/analysis-status-dropdown/test-case-execution-analysis-status-dropdown.component";
import { TestUnitService } from "../../test-unit/test-unit.service";
import { ScenarioExecutionMxBuildIdComponent } from "../properties-display/mx-build-id/scenario-execution-mx-build-id.component";
import { ScenarioExecutionMxVersionComponent } from "../properties-display/mx-version/scenario-execution-mx-version.component";
import { ScenarioExecutionCommitIdComponent } from "../properties-display/commit-id/scenario-execution-commit-id.component";
import { ScenarioExecutionDurationComponent } from "../properties-display/duration/scenario-execution-duration.component";
import { TestCaseExecutionAnalyzabilityService } from "../../test-case-execution/test-case-execution-analyzability.service";
import { DisableAbortPipe } from "../actions/abort/disable-abort.pipe";
import { ShowCommentPipe } from "./execution-details/comment-input/show-comment-pipe";
import { ShowTerminationMessagePipe } from "./execution-details/termination-message/show-termination-message-pipe";
import { TransferToReconProgressTableComponent } from "@mxevolve/domains/test/widget";

@NgModule({
  declarations: [
    ScenarioExecutionIncidentsComponent,
    ScenarioExecutionDetectionsComponent,
    ExecutionDetailsComponent,
    ScenarioExecutionHistoryComponent,
    CommentInputComponent,
    ShowCommentPipe,
    ScenarioExecutionDetailsComponent,
    TestExecutionReportComponent,
  ],
  imports: [
    CommonModule,
    CardContainerModule,
    HeaderTitleModule,
    IncidentsTableComponent,
    LinkedConfigurationRegressionDetailsTableComponent,
    LinkedBinaryImpactDetailsTableComponent,
    LinkedBinaryRegressionDetailsTableComponent,
    LinkedConfigurationImpactDetailsTableComponent,
    FailureReasonDetailsTableComponent,
    TableModule,
    ScenarioExecutionStatusComponent,
    DurationPipeModule,
    ProgressSpinner,
    Tooltip,
    TableEmptyMessageComponent,
    RouterLink,
    Skeleton,
    TestExecutionNamePipe,
    TextareaModule,
    Menu,
    Button,
    ToggleSwitch,
    FormsModule,
    KeptExecutionDisabledPipe,
    KeptExecutionToggleComponent,
    CommitIdPipeModule,
    ScenarioAnalysisStatusComponent,
    AssigneeInputComponent,
    UiCollapsibleMessageModule,
    DefectSelectionModalComponent,
    UpgradeImpactSelectionModalComponent,
    ConfirmPopup,
    ShowElementIfAuthorizedDirective,
    ButtonDirective,
    Tabs,
    TabsModule,
    TabPanel,
    AnalysisObjectLinkingComponent,
    StoreModule,
    ToastModule,
    TagModule,
    TestExecutionStatusComponent,
    StyleClass,
    Divider,
    TestExecutionsGridComponent,
    RouterOutlet,
    AnalysisObjectUnlinkModalComponent,
    UpdateReferenceTableComponent,
    TestCaseExecutionAnalysisStatusDropdownComponent,
    ScenarioExecutionMxBuildIdComponent,
    ScenarioExecutionMxVersionComponent,
    ScenarioExecutionCommitIdComponent,
    ScenarioExecutionDurationComponent,
    DisableAbortPipe,
    ShowTerminationMessagePipe,
    TestExecutionWebEngineReportComponent,
    TransferToReconProgressTableComponent,
  ],
  providers: [
    ScenarioExecutionStateManagementService,
    ConfirmationService,
    AnalysisObjectLinkService,
    TestCaseExecutionService,
    ConfigurationImpactService,
    ConfigurationRegressionService,
    BinaryImpactService,
    BinaryRegressionDataService,
    FailureReasonsDataService,
    IncidentService,
    AnalysisObjectLinkUtils,
    TestUnitService,
    TestCaseExecutionAnalyzabilityService,
  ],
  exports: [
    ScenarioExecutionIncidentsComponent,
    ScenarioExecutionDetectionsComponent,
    TestExecutionsGridComponent,
    ExecutionDetailsComponent,
    ScenarioExecutionHistoryComponent,
  ],
})
export class ScenarioExecutionDetailsModule {}
