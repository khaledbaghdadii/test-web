import { TableModule } from "primeng/table";
import { DialogModule } from "primeng/dialog";
import { ModuleWithProviders, NgModule } from "@angular/core";
import { ViewEnvironmentDetailsButtonComponent } from "./view-environment-details-button/view-environment-details-button.component";
import { ManagementRequestsService } from "../service/management-requests.service";
import { ConfirmationService, MessageService } from "primeng/api";
import { EnvironmentService } from "../service/environment.service";
import { DeployClientButtonComponent } from "./deploy-client-button/deploy-client-button.component";
import { MxenvCompanionService } from "../service/mxenv-companion.service";
import { CopyPackageDetailsButtonComponent } from "./copy-package-details-button/copy-package-details-button.component";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { ToastModule } from "primeng/toast";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import { SkeletonModule } from "primeng/skeleton";
import { EnvironmentServiceStatusModule } from "../environment-service-status/environment-service-status.component";
import { SplitButtonModule } from "primeng/splitbutton";
import { EnvironmentClientLauncherService } from "../service/environment-client-launcher-service";
import { EnvironmentsStoreModule } from "../store/environment/environments-store.module";
import { EnvironmentActionsService } from "./service-actions/environment-actions-service";
import { Menu } from "primeng/menu";
import { ToggleSwitch } from "primeng/toggleswitch";
import { FormsModule } from "@angular/forms";
import { TieredMenu } from "primeng/tieredmenu";

@NgModule({
  declarations: [
    ViewEnvironmentDetailsButtonComponent,
    CopyPackageDetailsButtonComponent,
    DeployClientButtonComponent,
  ],
  exports: [
    ViewEnvironmentDetailsButtonComponent,
    CopyPackageDetailsButtonComponent,
    DeployClientButtonComponent,
  ],
  imports: [
    CommonModule,
    ButtonModule,
    TooltipModule,
    ToastModule,
    ConfirmPopupModule,
    DialogModule,
    TableModule,
    TableEmptyMessageComponent,
    SkeletonModule,
    EnvironmentServiceStatusModule,
    SplitButtonModule,
    EnvironmentsStoreModule,
    Menu,
    ToggleSwitch,
    FormsModule,
    TieredMenu,
  ],
})
export class EnvironmentActionsModule {
  static forFeature(): ModuleWithProviders<EnvironmentActionsModule> {
    return {
      ngModule: EnvironmentActionsModule,
      providers: [
        ManagementRequestsService,
        MessageService,
        EnvironmentService,
        MxenvCompanionService,
        ConfirmationService,
        EnvironmentClientLauncherService,
        EnvironmentActionsService,
      ],
    };
  }
}
