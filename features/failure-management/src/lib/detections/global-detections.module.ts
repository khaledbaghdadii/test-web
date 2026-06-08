import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthorizationGuard } from "@mxflow/core/auth";

const routes: Routes = [
  {
    path: "",
    children: [
      {
        path: "regressions/binary/:binary-regression-id",
        canActivate: [AuthorizationGuard],
        data: {
          action: "read",
          package: "test",
          resource: "binary_regression",
        },
        loadComponent: () =>
          import(
            "../binary-regression/binary-regression-view/binary-regression-view.component"
          ).then((c) => c.BinaryRegressionViewComponent),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GlobalDetectionsModule {}
