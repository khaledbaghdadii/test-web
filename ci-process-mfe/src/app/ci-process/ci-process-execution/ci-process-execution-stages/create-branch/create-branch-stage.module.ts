import { NgModule } from "@angular/core";
import { CreateBranchStageComponent } from "./create-branch-stage.component";
import { CreateBranchStageRoutingModule } from "./create-branch-stage-routing.module";
import { CommonModule } from "@angular/common";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { ScmManagementService } from "@mxflow/features/scm";
import { CreateBranchStageDetailsModule } from "@mxflow/features/business-process";
import { ErrorAlertComponent } from "@mxflow/ui/alert";
import { RepositoryService } from "@mxflow/features/repository";
import { MxflowSpinnerModule } from "@mxflow/ui/utils";

@NgModule({
  imports: [
    CommonModule,
    CreateBranchStageRoutingModule,
    CardContainerModule,
    HeaderTitleModule,
    CreateBranchStageDetailsModule,
    ErrorAlertComponent,
    MxflowSpinnerModule,
  ],
  declarations: [CreateBranchStageComponent],
  providers: [ScmManagementService, RepositoryService],
})
export class CreateBranchStageModule {}
