import { Routes } from "@angular/router";
import { executionExistsGuard } from "@mxflow/features/business-process";
import { ValidationProcessExecutionViewComponent } from "./validation-process-execution-view/validation-process-execution-view.component";
import { ValidationActivityComponent } from "./activity/validation-activity.component";

export const VALIDATION_PROCESS_ROUTES: Routes = [
  { path: "", redirectTo: "executions", pathMatch: "full" },
  {
    path: "executions",
    component: ValidationActivityComponent,
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
