import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CiProcessExecutionDetailsComponent } from "./ci-process-execution-details/ci-process-execution-details.component";

const routes: Routes = [
  {
    path: "",
    component: CiProcessExecutionDetailsComponent,
    data: {
      propagateTitleToChildren: true,
    },
    children: [
      {
        path: "create-branch",
        loadChildren: () =>
          import(
            "./ci-process-execution-stages/create-branch/create-branch-stage.module"
          ).then((module) => module.CreateBranchStageModule),
      },
      {
        path: "prepare-build",
        loadChildren: () =>
          import(
            "./ci-process-execution-stages/prepare-build/prepare-build-stage.module"
          ).then((module) => module.PrepareBuildStageModule),
      },
      {
        path: "build-and-test",
        loadChildren: () =>
          import(
            "./ci-process-execution-stages/build-and-test/build-and-test-stage.module"
          ).then((module) => module.BuildAndTestStageModule),
      },
      {
        path: "integrate-changes",
        loadChildren: () =>
          import(
            "./ci-process-execution-stages/integrate-changes/integrate-changes-stage.module"
          ).then((module) => module.IntegrateChangesStageModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CiProcessExecutionRoutingModule {}
