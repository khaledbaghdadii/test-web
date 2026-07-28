import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UnderConstructionPageComponent } from "./under-construction-page.component";
import { CardContainerModule } from "@mxflow/ui/container";
import { RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { RippleModule } from "primeng/ripple";

@NgModule({
  imports: [
    CommonModule,
    CardContainerModule,
    RouterModule,
    ButtonModule,
    RippleModule,
  ],
  declarations: [UnderConstructionPageComponent],
  exports: [UnderConstructionPageComponent],
})
export class UnderConstructionPageModule {}
