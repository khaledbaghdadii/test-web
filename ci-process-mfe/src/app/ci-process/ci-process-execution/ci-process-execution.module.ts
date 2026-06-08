import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CiProcessExecutionDetailsComponent } from "./ci-process-execution-details/ci-process-execution-details.component";
import {
  BuildAndTestProcessExecutionFetcherService,
  BusinessProcessAlertDisplayComponent,
  BusinessProcessExecutionAbortButtonComponent,
  BusinessProcessExecutionAbortService,
  BusinessProcessExecutionProgressComponent,
  BusinessProcessExecutionStatusComponent,
  BusinessProcessNamePipe,
  BusinessProcessUriFactoryPipeModule,
  LoadingBusinessProcessExecutionSkeletonComponent,
} from "@mxflow/features/business-process";
import { CiProcessExecutionService } from "./service/ci-process-execution.service";
import { CiProcessExecutionRoutingModule } from "./ci-process-execution-routing.module";
import { StoreModule } from "@ngrx/store";
import { CiProcessExecutionReducer } from "./state/ci-process-execution.reducer";
import { EffectsModule } from "@ngrx/effects";
import { CiProcessExecutionEffects } from "./state/ci-process-execution.effects";
import { CiProcessStageSelectorService } from "./service/ci-process-stage-selector.service";
import { BuildAndTestExecutionRunHeaderComponent } from "@mxevolve/domains/business-process/composite-widget";
import { BuildAndTestExecutionFetcherService } from "@mxevolve/domains/business-process/data-access";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { ErrorAlertComponent, InfoAlertComponent } from "@mxflow/ui/alert";
import { CiProcessExecutionStateUpdaterService } from "./ci-process-execution-details/ci-process-state-updater.service";
import { StepperComponent } from "@mxevolve/shared/ui/primitive";
import { MxflowSpinnerModule } from "@mxflow/ui/utils";
import { ArtifactManagerService } from "@mxflow/features/artifact-manager";
import { MessageModule } from "primeng/message";

@NgModule({
  imports: [
    CommonModule,
    CiProcessExecutionRoutingModule,
    StoreModule.forFeature("ciProcessExecution", CiProcessExecutionReducer),
    EffectsModule.forFeature([CiProcessExecutionEffects]),
    CardContainerModule,
    HeaderTitleModule,
    StepperComponent,
    ErrorAlertComponent,
    MessageModule,
    BusinessProcessExecutionStatusComponent,
    MxflowSpinnerModule,
    InfoAlertComponent,
    BusinessProcessExecutionAbortButtonComponent,
    LoadingBusinessProcessExecutionSkeletonComponent,
    BusinessProcessAlertDisplayComponent,
    BusinessProcessExecutionProgressComponent,
    BusinessProcessUriFactoryPipeModule,
    BusinessProcessNamePipe,
    BuildAndTestExecutionRunHeaderComponent,
  ],
  declarations: [CiProcessExecutionDetailsComponent],
  providers: [
    CiProcessExecutionService,
    CiProcessStageSelectorService,
    CiProcessExecutionStateUpdaterService,
    BusinessProcessExecutionAbortService,
    ArtifactManagerService,
    BuildAndTestProcessExecutionFetcherService,
    BuildAndTestExecutionFetcherService,
  ],
})
export class CiProcessExecutionModule {}
