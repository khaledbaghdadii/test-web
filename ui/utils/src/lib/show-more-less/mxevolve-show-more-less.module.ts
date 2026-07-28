import { NgModule } from "@angular/core";
import { MXEvolveShowMoreLessComponent } from "./mxevolve-show-more-less.component";
import { TagModule } from "primeng/tag";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

@NgModule({
  imports: [CommonModule, TagModule, RouterModule],
  declarations: [MXEvolveShowMoreLessComponent],
  exports: [MXEvolveShowMoreLessComponent],
})
export class MXEvolveShowMoreLessModule {}
