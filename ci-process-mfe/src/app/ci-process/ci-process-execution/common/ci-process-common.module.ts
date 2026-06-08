import { NgModule } from "@angular/core";
import { BuildAndTestBranchDetailsComponent } from "./branch-details/build-and-test-branch-details.component";
import { CommitIdPipeModule } from "@mxflow/pipe";
import { CommonModule } from "@angular/common";
import {
  ErrorAlertComponent,
  InfoAlertComponent,
  WarningAlertModule,
} from "@mxflow/ui/alert";
import { ScmManagementService } from "@mxflow/features/scm";
import { PanelModule } from "primeng/panel";
import { TableModule } from "primeng/table";
import { SkeletonModule } from "primeng/skeleton";
import {
  MxflowSpinnerModule,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";

import { FinalProductDetailsComponent } from "@mxflow/features/artifact-manager";
import { TagModule } from "primeng/tag";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import {
  CommitsDetailsComponent,
  DevelopmentDetailsComponent,
  MergeConfigurationService,
} from "@mxflow/features/scm-management";
import { IssueTrackingService } from "@mxflow/features/project";
import { JiraUserStories } from "../../common/jira-user-stories.component";

@NgModule({
  imports: [
    CommonModule,
    CommitIdPipeModule,
    WarningAlertModule,
    PanelModule,
    TableModule,
    SkeletonModule,
    MxflowSpinnerModule,
    TableEmptyMessageComponent,
    FinalProductDetailsComponent,
    TagModule,
    InfoAlertComponent,
    ErrorAlertComponent,
    ProgressSpinnerModule,
    DevelopmentDetailsComponent,
    CommitsDetailsComponent,
    JiraUserStories,
  ],
  declarations: [BuildAndTestBranchDetailsComponent],
  providers: [
    ScmManagementService,
    MergeConfigurationService,
    IssueTrackingService,
  ],
  exports: [BuildAndTestBranchDetailsComponent],
})
export class CiProcessCommonModule {}
