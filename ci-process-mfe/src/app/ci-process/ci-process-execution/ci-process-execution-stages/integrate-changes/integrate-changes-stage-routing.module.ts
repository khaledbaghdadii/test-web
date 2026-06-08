import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { IntegrateChangesStageComponent } from "./integrate-changes-stage.component";

const routes: Routes = [
  {
    path: "",
    component: IntegrateChangesStageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IntegrateChangesStageRoutingModule {}
