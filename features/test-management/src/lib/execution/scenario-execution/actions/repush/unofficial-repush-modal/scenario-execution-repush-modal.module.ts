import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { ScenarioExecutionRepushModalComponent } from "./scenario-execution-repush-modal.component";
import { MandatoryFieldModule } from "@mxflow/ui/alert";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { TooltipModule } from "primeng/tooltip";
import { FeaturesArtifactManagerModule } from "@mxflow/features/artifact-manager";
import { SelectModule } from "primeng/select";
import { KeepServicesCheckboxComponent } from "../keep-services-checkbox/keep-services-checkbox.component";
import { MessageModule } from "primeng/message";

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MandatoryFieldModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    FeaturesArtifactManagerModule.forFeature(),
    SelectModule,
    MessageModule,
    KeepServicesCheckboxComponent,
  ],
  exports: [ScenarioExecutionRepushModalComponent],
  declarations: [ScenarioExecutionRepushModalComponent],
})
export class ScenarioExecutionRepushModalModule {}
