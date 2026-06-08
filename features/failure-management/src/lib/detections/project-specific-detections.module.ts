import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthorizationGuard } from "@mxflow/core/auth";

const routes: Routes = [
  {
    path: "",
    children: [
      {
        path: "regressions/configuration/:configuration-regression-id",
        canActivate: [AuthorizationGuard],
        data: {
          action: "read",
          package: "test",
          resource: "configuration_regression",
        },
        loadComponent: () =>
          import(
            "../configuration-regression/configuration-regression-view/configuration-regression-view.component"
          ).then((c) => c.ConfigurationRegressionViewComponent),
      },
      {
        path: "impacts/configuration/:configurationImpactId",
        canActivate: [AuthorizationGuard],
        data: {
          action: "read",
          package: "test",
          resource: "configuration_impact",
        },
        loadComponent: () =>
          import(
            "../configuration-impact/configuration-impact-view/configuration-impact-view.component"
          ).then((c) => c.ConfigurationImpactViewComponent),
      },
      {
        path: "impacts/binary/:binary-impact-id",
        canActivate: [AuthorizationGuard],
        data: { action: "read", package: "test", resource: "binary_impact" },
        loadComponent: () =>
          import(
            "../binary-impact/binary-impact-view/binary-impact-view.component"
          ).then((c) => c.BinaryImpactViewComponent),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectSpecificDetectionsModule {}
