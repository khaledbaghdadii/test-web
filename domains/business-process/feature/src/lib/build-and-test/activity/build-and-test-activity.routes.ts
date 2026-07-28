import { Routes } from "@angular/router";
import { executionExistsGuard } from "@mxflow/features/business-process";
import { AuthorizationGuard } from "@mxflow/core/auth";
import { ProjectIdGuardInputResolver } from "@mxflow/features/project";
import { BuildAndTestActivityComponent } from "./build-and-test-activity.component";
import { BuildAndTestExecutionViewComponent } from "../build-and-test-execution-view/build-and-test-execution-view.component";

/**
 * Routes for the Build & Test activity landing page (the new-arch entry point
 * reached from the "Build & Test Activity" nav tab) plus the run deep-link the
 * table's Name column opens.
 */
export const BUILD_AND_TEST_ACTIVITY_ROUTES: Routes = [
  {
    path: "",
    component: BuildAndTestActivityComponent,
    canActivate: [AuthorizationGuard],
    resolve: {
      projectId: ProjectIdGuardInputResolver,
    },
    data: {
      action: "fetch",
      package: "business_process",
      resource: "business_process",
      attributes: {
        familyId: "user-story-build-and-test",
      },
    },
  },
  {
    path: "execution/:executionId",
    component: BuildAndTestExecutionViewComponent,
    canActivate: [executionExistsGuard],
    data: {
      details: {
        analyticsTitle: "BP Execution",
      },
      propagateTitleToChildren: true,
    },
  },
];
