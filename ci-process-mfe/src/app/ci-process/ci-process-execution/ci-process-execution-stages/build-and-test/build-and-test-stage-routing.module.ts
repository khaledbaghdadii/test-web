import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { BuildAndTestStageComponent } from "./build-and-test-stage.component";

const routes: Routes = [
  {
    path: "",
    component: BuildAndTestStageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BuildAndTestStageRoutingModule {}
