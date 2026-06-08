import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FeaturesScmModule } from "@mxflow/features/scm";
import { CommitIdPipeModule } from "@mxflow/pipe";
import { CreateBranchStageDetailsComponent } from "./create-branch-stage-details.component";
import { TableModule } from "primeng/table";
import { SkeletonModule } from "primeng/skeleton";
import { GetRepositoryNamePipe } from "@mxflow/features/repository";
import { WarningAlertModule } from "@mxflow/ui/alert";

@NgModule({
  imports: [
    CommonModule,
    CommitIdPipeModule,
    FeaturesScmModule,
    TableModule,
    SkeletonModule,
    GetRepositoryNamePipe,
    WarningAlertModule,
  ],
  declarations: [CreateBranchStageDetailsComponent],
  exports: [CreateBranchStageDetailsComponent],
})
export class CreateBranchStageDetailsModule {}
