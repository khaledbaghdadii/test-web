import { Routes } from "@angular/router";
import { TestDefinitionCreateComponent } from "./test-definition-create/test-definition-create.component";
import { TestDefinitionDetailsComponent } from "./test-definition-details/test-definition-details.component";
import { TestDefinitionsTableComponent } from "./test-definition-table/test-definitions-table.component";
import { TestDefinitionComponent } from "./test-definition.component";
import { TestDefinitionEditComponent } from "./test-definition-edit/test-definition-edit.component";
import { AuthorizationGuard } from "@mxflow/core/auth";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { RepositoryService } from "@mxflow/features/repository";
import { ProjectService } from "@mxflow/features/project";

export const testDefinitionRoutes: Routes = [
  {
    path: "",
    component: TestDefinitionComponent,
    providers: [TestDefinitionService, RepositoryService, ProjectService],
    children: [
      {
        path: "",
        component: TestDefinitionsTableComponent,
        canActivate: [AuthorizationGuard],
        data: {
          action: "read",
          package: "test",
          resource: "test_definition",
        },
      },
      {
        path: "create",
        component: TestDefinitionCreateComponent,
        canActivate: [AuthorizationGuard],
        data: {
          action: "create",
          package: "test",
          resource: "test_definition",
        },
      },
      {
        path: "details/:testDefinitionId",
        component: TestDefinitionDetailsComponent,
        canActivate: [AuthorizationGuard],
        data: {
          action: "read",
          package: "test",
          resource: "test_definition",
        },
      },
      {
        path: "edit/:testDefinitionId",
        component: TestDefinitionEditComponent,
        canActivate: [AuthorizationGuard],
        data: {
          action: "update",
          package: "test",
          resource: "test_definition",
        },
      },
    ],
  },
];
