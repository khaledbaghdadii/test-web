import { Routes } from "@angular/router";
import { AllRunsActivityComponent } from "./activity/all-runs-activity.component";

export const ALL_RUNS_PROCESS_ROUTES: Routes = [
  { path: "", redirectTo: "executions", pathMatch: "full" },
  {
    path: "executions",
    component: AllRunsActivityComponent,
  },
];
