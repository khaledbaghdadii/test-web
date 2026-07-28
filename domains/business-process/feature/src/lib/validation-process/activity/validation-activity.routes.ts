import { Routes } from "@angular/router";
import { executionExistsGuard } from "@mxflow/features/business-process";
import { AuthorizationGuard } from "@mxflow/core/auth";
import { ProjectIdGuardInputResolver } from "@mxflow/features/project";
import { ValidationActivityComponent } from "./validation-activity.component";
import { ValidationProcessExecutionViewComponent } from "../validation-process-execution-view/validation-process-execution-view.component";

/**
 * Routes for the Validation activity landing page (the new-arch entry point
 * reached from the "Validation Activity" nav tab) plus the run deep-link the
 * table's Execution Name column opens.
 */
export const VALIDATION_ACTIVITY_ROUTES: Routes = [
  {
    path: "",
    component: ValidationActivityComponent,
    canActivate: [AuthorizationGuard],
    resolve: {
      projectId: ProjectIdGuardInputResolver,
    },
    data: {
      action: "fetch",
      package: "business_process",
      resource: "business_process",
      attributes: {
        familyId: "master-validation",
      },
    },
  },
  {
    path: "execution/:executionId",
    component: ValidationProcessExecutionViewComponent,
    canActivate: [executionExistsGuard],
    data: {
      details: {
        analyticsTitle: "BP Execution",
      },
      propagateTitleToChildren: true,
    },
  },
];
