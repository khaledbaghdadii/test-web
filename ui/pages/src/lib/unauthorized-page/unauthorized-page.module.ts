import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardContainerModule } from "@mxflow/ui/container";
import { RouterModule } from "@angular/router";
import { UnauthorizedPageComponent } from "./unauthorized-page.component";
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
  declarations: [UnauthorizedPageComponent],
  exports: [UnauthorizedPageComponent],
})
export class UnauthorizedPageModule {}
