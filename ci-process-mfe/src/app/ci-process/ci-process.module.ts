import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { CiProcessComponent } from "./ci-process.component";
import { CiProcessRoutingModule } from "./ci-process-routing.module";
import { APP_CONFIG } from "@mxflow/config";
import {
  environment,
  EnvironmentProvider,
} from "../../environments/environment";
import { CiProcessExecutionModule } from "./ci-process-execution/ci-process-execution.module";
import { StoreModule } from "@ngrx/store";
import { ciProcessReducer } from "./state/ci-process.reducer";
import { ErrorAlertComponent } from "@mxflow/ui/alert";
import { CiProcessGlobalMessageComponent } from "./ci-process-global-message.component";
import { BusinessProcessExecutionService } from "@mxflow/features/business-process";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { CUSTOM_ICONS_PATH, ILLUSTRATIONS_PATH } from "@mxevolve/shared/ui/primitive";
import {AllEnterpriseModule, LicenseManager as AgGridLicenseManager, ModuleRegistry} from "ag-grid-enterprise";
import {LicenseManager as AgChartLicenseManager} from "ag-charts-enterprise";

@NgModule({
  imports: [
    CommonModule,
    CiProcessRoutingModule,
    CiProcessExecutionModule,
    StoreModule.forFeature("ciProcess", ciProcessReducer),
    ErrorAlertComponent,
  ],
  declarations: [CiProcessComponent, CiProcessGlobalMessageComponent],
  providers: [
    EnvironmentProvider,
    { provide: APP_CONFIG, useValue: environment },
    {provide: GATEWAY_CONFIG, useValue: environment},
        { provide: CUSTOM_ICONS_PATH, useValue: "assets/icons" },
        { provide: ILLUSTRATIONS_PATH, useValue: "assets/illustrations" },
    BusinessProcessExecutionService,
  ],
})
export class CiProcessModule {}
ModuleRegistry.registerModules([AllEnterpriseModule]);
AgGridLicenseManager.setLicenseKey(environment.agGridChartLicenseKey);
AgChartLicenseManager.setLicenseKey(environment.agGridChartLicenseKey);