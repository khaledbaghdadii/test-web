import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CreateBranchStageComponent } from "./create-branch-stage.component";

const routes: Routes = [
  {
    path: "",
    component: CreateBranchStageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CreateBranchStageRoutingModule {}
