import { Routes } from "@angular/router";
import { AuthorizationGuard } from "@mxflow/core/auth";
import { ScenarioDefinitionComponent } from "./scenario-definition.component";
import { ScenarioDefinitionCreateComponent } from "./scenario-definition-create/scenario-definition-create.component";
import { ScenarioDefinitionDetailsComponent } from "./scenario-definition-details/scenario-definition-details.component";
import { ScenarioDefinitionEditComponent } from "./scenario-definition-edit/scenario-definition-edit.component";
import { ScenarioDefinitionTableComponent } from "./scenario-definition-table/scenario-definition-table.component";
import {
  ScenarioDefinitionService,
  TestDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { EnvironmentService } from "@mxflow/features/environment";
import { StreamsService } from "@mxflow/features/streams";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ConfirmationService } from "primeng/api";

export const scenarioDefinitionRoutes: Routes = [
  {
    path: "",
    component: ScenarioDefinitionComponent,
    canActivate: [AuthorizationGuard],
    data: {
      action: "read",
      package: "test",
      resource: "scenario_definition",
    },
    providers: [
      ScenarioDefinitionService,
      TestDefinitionService,
      EnvironmentService,
      StreamsService,
      ToastMessageService,
      ConfirmationService,
    ],
    children: [
      {
        path: "",
        component: ScenarioDefinitionTableComponent,
        canActivate: [AuthorizationGuard],
        data: {
          action: "read",
          package: "test",
          resource: "scenario_definition",
        },
      },
      {
        path: "create",
        canActivate: [AuthorizationGuard],
        data: {
          action: "create",
          package: "test",
          resource: "scenario_definition",
        },
        component: ScenarioDefinitionCreateComponent,
      },
      {
        path: "edit/:scenarioDefinitionId",
        canActivate: [AuthorizationGuard],
        data: {
          action: "edit",
          package: "test",
          resource: "scenario_definition",
        },
        component: ScenarioDefinitionEditComponent,
      },
      {
        path: "details/:scenarioDefinitionId",
        component: ScenarioDefinitionDetailsComponent,
        canActivate: [AuthorizationGuard],
        data: {
          action: "read",
          package: "test",
          resource: "scenario_definition",
        },
      },
    ],
  },
];
