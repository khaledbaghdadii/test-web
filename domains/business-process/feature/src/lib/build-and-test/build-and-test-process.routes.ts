import { Routes } from "@angular/router";
import { executionExistsGuard } from "@mxflow/features/business-process";
import { BuildAndTestExecutionViewComponent } from "./build-and-test-execution-view/build-and-test-execution-view.component";
import { BuildAndTestActivityComponent } from "./activity/build-and-test-activity.component";

export const BUILD_AND_TEST_PROCESS_ROUTES: Routes = [
  { path: "", redirectTo: "executions", pathMatch: "full" },
  {
    path: "executions",
    component: BuildAndTestActivityComponent,
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
