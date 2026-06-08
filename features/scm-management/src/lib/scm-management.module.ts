import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MergeConfigurationService } from "./merge-configuration/merge-configuration.service";
import { MergeRequestService } from "./merge-request/merge-request.service";
import { MergeConfigurationDefinitionService } from "./merge-configuration-definition/merge-configuration-definition.service";

@NgModule({
  imports: [CommonModule],
  providers: [
    MergeConfigurationService,
    MergeConfigurationDefinitionService,
    MergeRequestService,
  ],
})
export class ScmManagementModule {}
