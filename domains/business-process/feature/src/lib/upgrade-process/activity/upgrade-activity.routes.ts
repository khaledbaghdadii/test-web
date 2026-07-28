import { Routes } from "@angular/router";
import { executionExistsGuard } from "@mxflow/features/business-process";
import { AuthorizationGuard } from "@mxflow/core/auth";
import { ProjectIdGuardInputResolver } from "@mxflow/features/project";
import { UpgradeActivityComponent } from "./upgrade-activity.component";
import { UpgradeProcessExecutionViewComponent } from "../upgrade-process-execution-view/upgrade-process-execution-view.component";

/**
 * Routes for the Upgrade activity landing page (the new-arch entry point
 * reached from the "Upgrade Activity" nav tab) plus the run deep-link the
 * table's Execution Name column opens.
 */
export const UPGRADE_ACTIVITY_ROUTES: Routes = [
  {
    path: "",
    component: UpgradeActivityComponent,
    canActivate: [AuthorizationGuard],
    resolve: {
      projectId: ProjectIdGuardInputResolver,
    },
    data: {
      action: "fetch",
      package: "business_process",
      resource: "business_process",
      attributes: {
        familyId: "binary-upgrade",
      },
    },
  },
  {
    path: "execution/:executionId",
    component: UpgradeProcessExecutionViewComponent,
    canActivate: [executionExistsGuard],
    data: {
      details: {
        analyticsTitle: "BP Execution",
      },
      propagateTitleToChildren: true,
    },
  },
];
