import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CiProcessComponent } from "./ci-process.component";
import { executionExistsGuard } from "@mxflow/features/business-process";

const routes: Routes = [
  { path: "", redirectTo: "executions", pathMatch: "full" },
  {
    path: "",
    component: CiProcessComponent,
    children: [
      {
        path: "execution/:executionId",
        loadChildren: () =>
          import(
            "./ci-process-execution/ci-process-execution-routing.module"
          ).then((module) => module.CiProcessExecutionRoutingModule),
        canActivate: [executionExistsGuard],
        data: {
          details: {
            analyticsTitle: "BP Execution",
          },
        },
      },
      {
        path: "executions",
        loadChildren: () =>
          import("./ci-process-executions/ci-process-executions.module").then(
            (module) => module.CiProcessExecutionsModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CiProcessRoutingModule {}
