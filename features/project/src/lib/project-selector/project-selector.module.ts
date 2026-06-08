import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProjectSelectorRoutingModule } from "./project-selector-routing.module";
import { ProjectService } from "../project.service";
import { ProjectSelectorComponent } from "./project-selector.component";
import { PanelModule } from "primeng/panel";
import { SkeletonModule } from "primeng/skeleton";
import { CardModule } from "primeng/card";

@NgModule({
  imports: [
    CommonModule,
    ProjectSelectorRoutingModule,
    PanelModule,
    SkeletonModule,
    CardModule,
  ],
  declarations: [ProjectSelectorComponent],
  providers: [ProjectService],
  exports: [ProjectSelectorComponent],
})
export class ProjectSelectorModule {}
