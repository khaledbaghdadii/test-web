import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { PrepareBuildStageComponent } from "./prepare-build-stage.component";

const routes: Routes = [
  {
    path: "",
    component: PrepareBuildStageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrepareBuildStageRoutingModule {}
