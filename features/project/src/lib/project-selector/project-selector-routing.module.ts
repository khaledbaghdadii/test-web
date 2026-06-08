import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ProjectSelectorComponent } from "./project-selector.component";

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: "",
        component: ProjectSelectorComponent,
      },
    ]),
  ],
  exports: [RouterModule],
})
export class ProjectSelectorRoutingModule {}
